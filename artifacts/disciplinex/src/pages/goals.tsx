import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Edit2 } from "lucide-react";

import {
  useListGoals,
  getListGoalsQueryKey,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function Goals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: allGoals, isLoading } = useListGoals(
    { user_id: user?.id || "" },
    { query: { enabled: !!user?.id, queryKey: getListGoalsQueryKey({ user_id: user?.id || "" }) } }
  );

  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const goals = Array.isArray(allGoals) ? allGoals : (allGoals as any)?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getListGoalsQueryKey({ user_id: user?.id || "" }),
    });
  };

  // ================= CREATE GOAL =================
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !title.trim()) {
      console.error("Missing user or title");
      return;
    }

    createGoalMutation.mutate(
      {
        title: title.trim(),
        description,
        user_id: user.id,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setTitle("");
          setDescription("");
          invalidate();
        },
        onError: (err) => console.error("GOAL CREATE ERROR:", err),
      }
    );
  };

  // ================= DELETE =================
  const handleDelete = (id: string) => {
    deleteGoalMutation.mutate(
      { id },
      {
        onSuccess: invalidate,
        onError: (err) => console.error(err),
      }
    );
  };

  // ================= EDIT =================
  const openEdit = (goal: any) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setDescription(goal.description || "");
    setIsEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingGoal) return;

    updateGoalMutation.mutate(
      {
        id: editingGoal.id,
        data: {
          title,
          description,
        },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setEditingGoal(null);
          setTitle("");
          setDescription("");
          invalidate();
        },
        onError: (err) => console.error("GOAL UPDATE ERROR:", err),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Goals</h1>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Goal</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title" />
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />

              <Button type="submit">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* LIST */}
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        goals.map((goal: any) => (
          <div key={goal.id} className="border p-3 rounded flex justify-between">
            <div>
              <h3>{goal.title}</h3>
              <p className="text-sm">{goal.description}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => openEdit(goal)}>
                <Edit2 />
              </button>

              <button onClick={() => handleDelete(goal.id)}>
                <Trash2 />
              </button>
            </div>
          </div>
        ))
      )}

      {/* EDIT */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />

            <Button type="submit">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
