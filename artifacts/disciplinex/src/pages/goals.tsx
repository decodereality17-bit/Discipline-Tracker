import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, isPast } from "date-fns";

import {
  useListGoals,
  getListGoalsQueryKey,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
} from "@workspace/api-client-react";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Trash2, Edit2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["general", "health", "career", "finance", "learning", "fitness", "personal"] as const;
type Category = typeof CATEGORIES[number];

type GoalStatus = "active" | "completed" | "paused";

type ApiGoal = {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  progress: number;
  target_date?: string | null;
  created_at: string;
  updated_at: string;
};

export default function Goals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<GoalStatus | "all">("active");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [targetDate, setTargetDate] = useState("");

  const [editingGoal, setEditingGoal] = useState<ApiGoal | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const queryKey = getListGoalsQueryKey({ user_id: user?.id || "" });

  const { data, isLoading } = useListGoals(
    { user_id: user?.id || "" },
    { query: { enabled: !!user?.id, queryKey } }
  );

  const goals: ApiGoal[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
    ? (data as any).data
    : [];

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey });

  const filteredGoals = goals.filter((g) =>
    activeTab === "all" ? true : g.status === activeTab
  );

  const safeParseDate = (date?: string | null) => {
    if (!date) return null;
    try {
      return parseISO(date);
    } catch {
      return null;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await createGoal.mutateAsync({
      data: {
        user_id: user.id,
        title,
        description: description || undefined,
        category,
        target_date: targetDate || undefined,
      },
    });

    setTitle("");
    setDescription("");
    setCategory("general");
    setTargetDate("");
    setIsCreateOpen(false);

    invalidate();
  };

  const handleDelete = async (id: string) => {
    await deleteGoal.mutateAsync({ id });
    invalidate();
  };

  const handleProgress = async (goal: ApiGoal, progress: number) => {
    const status: GoalStatus =
      progress >= 100 ? "completed" : "active";

    await updateGoal.mutateAsync({
      id: goal.id,
      data: { progress, status },
    });

    invalidate();
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-sm text-muted-foreground">
            Track your progress
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Goal</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Goal title"
                required
              />

              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />

              <Button type="submit">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* TABS */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">

          {isLoading ? (
            <p>Loading...</p>
          ) : filteredGoals.length === 0 ? (
            <p className="text-muted-foreground">No goals found</p>
          ) : (

            filteredGoals.map((goal) => {
              const date = safeParseDate(goal.target_date);
              const overdue = date ? isPast(date) : false;

              return (
                <div
                  key={goal.id}
                  className="p-4 border rounded-lg space-y-2"
                >

                  <div className="flex justify-between">
                    <h3 className="font-semibold">{goal.title}</h3>

                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(goal.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <Progress value={goal.progress} />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {goal.progress}%
                    </span>

                    {date && (
                      <span className={overdue ? "text-red-400" : ""}>
                        Target: {format(date, "MMM d, yyyy")}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {[25, 50, 75, 100].map((p) => (
                      <button
                        key={p}
                        onClick={() => handleProgress(goal, p)}
                        className="text-xs border px-2 py-1 rounded"
                      >
                        {p}%
                      </button>
                    ))}
                  </div>

                </div>
              );
            })

          )}

        </TabsContent>
      </Tabs>

    </div>
  );
    }
