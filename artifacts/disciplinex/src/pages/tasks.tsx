import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { CheckCircle, Plus, Trash2, Edit2, Calendar } from "lucide-react";

import {
  useListTasks,
  getListTasksQueryKey,
  useCompleteTask,
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
  useRecalculateDiscipline,
  getGetUserStatsQueryKey,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";

export default function Tasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [activeTab, setActiveTab] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState(todayStr);

  const { data: allTasks, isLoading } = useListTasks(
    { user_id: user?.id || "" },
    { query: { enabled: !!user?.id, queryKey: getListTasksQueryKey({ user_id: user?.id || "" }) } }
  );

  const completeTaskMutation = useCompleteTask();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const recalculateDiscipline = useRecalculateDiscipline();

  const safeTasks = Array.isArray(allTasks)
    ? allTasks
    : Array.isArray((allTasks as any)?.data)
    ? (allTasks as any).data
    : [];

  const filteredTasks = safeTasks
    .filter((task: any) => {
      if (activeTab === "today") return task.due_date === todayStr && !task.completed;
      if (activeTab === "completed") return task.completed;
      return true;
    })
    .sort((a: any, b: any) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.due_date !== b.due_date)
        return (a.due_date || "") > (b.due_date || "") ? 1 : -1;

      const pWeight: any = { high: 0, medium: 1, low: 2 };
      return pWeight[a.priority || "medium"] - pWeight[b.priority || "medium"];
    });

  const invalidateTasks = () => {
    queryClient.invalidateQueries({
      queryKey: getListTasksQueryKey({ user_id: user?.id || "" }),
    });
  };

  const handleCompleteToggle = (id: string, current: boolean) => {
    completeTaskMutation.mutate(
      { id, data: { completed: !current } },
      {
        onSuccess: () => {
          invalidateTasks();

          if (user?.id) {
            recalculateDiscipline.mutate(
              { userId: user.id },
              {
                onSuccess: () => {
                  queryClient.invalidateQueries({
                    queryKey: getGetUserStatsQueryKey(user.id),
                  });
                },
              }
            );
          }
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this task?")) {
      deleteTaskMutation.mutate({ id }, { onSuccess: invalidateTasks });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate(todayStr);
  };

  const openEdit = (task: any) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority || "medium");
    setDueDate(task.due_date || todayStr);
    setIsEditOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    createTaskMutation.mutate(
      {
        data: { title, description, priority, due_date: dueDate, user_id: user.id },
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          resetForm();
          invalidateTasks();
        },
      }
    );
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    updateTaskMutation.mutate(
      {
        id: editingTask.id,
        data: { title, description, priority, due_date: dueDate },
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setEditingTask(null);
          resetForm();
          invalidateTasks();
        },
      }
    );
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between">
        <h1 className="text-3xl font-bold text-white">Task Registry</h1>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Objective
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button type="submit">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <div className="space-y-3 mt-4">
          {isLoading ? (
            <p>Loading...</p>
          ) : filteredTasks.length ? (
            filteredTasks.map((task: any) => (
              <div key={task.id} className="p-4 border rounded-lg flex justify-between">
                <div>
                  <h3 className="font-bold">{task.title}</h3>
                  <p className="text-sm">{task.description}</p>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleCompleteToggle(task.id, task.completed)}>
                    <CheckCircle />
                  </button>
                  <button onClick={() => openEdit(task)}>
                    <Edit2 />
                  </button>
                  <button onClick={() => handleDelete(task.id)}>
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No tasks found</p>
          )}
        </div>
      </Tabs>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />

            <Button type="submit" disabled={updateTaskMutation.isPending}>
              Save Modifications
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
