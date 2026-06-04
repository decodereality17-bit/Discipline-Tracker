import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { CheckCircle, Plus, Trash2, Edit2 } from "lucide-react";

import {
useListTasks,
getListTasksQueryKey,
useCreateTask,
useCompleteTask,
useDeleteTask,
useUpdateTask,
useRecalculateDiscipline,
getGetUserStatsQueryKey,
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";

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
{
query: {
enabled: !!user?.id,
queryKey: getListTasksQueryKey({
user_id: user?.id || "",
}),
},
}
);

const createTaskMutation = useCreateTask();
const updateTaskMutation = useUpdateTask();
const deleteTaskMutation = useDeleteTask();
const completeTaskMutation = useCompleteTask();
const recalc = useRecalculateDiscipline();

const tasks = Array.isArray(allTasks)
? allTasks
: (allTasks as any)?.data || [];

const invalidate = () => {
queryClient.invalidateQueries({
queryKey: getListTasksQueryKey({
user_id: user?.id || "",
}),
});
};

const handleCreateSubmit = (e: React.FormEvent) => {
e.preventDefault();

if (!user?.id || !title.trim()) {
  console.error("Missing user or title");
  return;
}

createTaskMutation.mutate(
  {
    data: {
      title: title.trim(),
      description,
      priority,
      due_date: dueDate,
      user_id: user.id,
    },
  },
  {
    onSuccess: () => {
      setIsCreateOpen(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(todayStr);
      invalidate();
    },
    onError: (err) => {
      console.error("CREATE ERROR:", err);
    },
  }
);

};

const handleComplete = (task: any) => {
completeTaskMutation.mutate(
{
id: task.id,
data: {
completed: !task.completed,
},
},
{
onSuccess: () => {
invalidate();

      recalc.mutate(
        { userId: user?.id || "" },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getGetUserStatsQueryKey(
                user?.id || ""
              ),
            });
          },
        }
      );
    },
  }
);

};

const handleDelete = (id: string) => {
deleteTaskMutation.mutate(
{ id },
{
onSuccess: invalidate,
}
);
};

const openEdit = (task: any) => {
setEditingTask(task);
setTitle(task.title);
setDescription(task.description || "");
setPriority(task.priority || "medium");
setDueDate(task.due_date || todayStr);
setIsEditOpen(true);
};

const handleEditSubmit = (e: React.FormEvent) => {
e.preventDefault();

if (!editingTask) return;

updateTaskMutation.mutate(
  {
    id: editingTask.id,
    data: {
      title,
      description,
      priority,
      due_date: dueDate,
    },
  },
  {
    onSuccess: () => {
      setIsEditOpen(false);
      setEditingTask(null);
      invalidate();
    },
    onError: (err) => {
      console.error("UPDATE ERROR:", err);
    },
  }
);

};

const filtered = tasks.filter((t: any) => {
if (activeTab === "today")
return t.due_date === todayStr && !t.completed;

if (activeTab === "completed")
  return t.completed;

return true;

});

return (
<div className="space-y-6">
<div className="flex justify-between">
<h1 className="text-xl font-bold">Tasks</h1>

    <Dialog
      open={isCreateOpen}
      onOpenChange={setIsCreateOpen}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleCreateSubmit}
          className="space-y-3"
        >
          <Input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Title"
          />

          <Textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Description"
          />

          <Button
            type="submit"
            disabled={createTaskMutation.isPending}
          >
            {createTaskMutation.isPending
              ? "Creating..."
              : "Create"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  </div>

  <Tabs
    value={activeTab}
    onValueChange={setActiveTab}
  >
    <TabsList>
      <TabsTrigger value="all">All</TabsTrigger>
      <TabsTrigger value="today">Today</TabsTrigger>
      <TabsTrigger value="completed">
        Completed
      </TabsTrigger>
    </TabsList>
  </Tabs>

  {isLoading ? (
    <p>Loading...</p>
  ) : filtered.length === 0 ? (
    <p>No tasks found</p>
  ) : (
    filtered.map((task: any) => (
      <div
        key={task.id}
        className="border p-3 rounded flex justify-between"
      >
        <div>
          <h3>{task.title}</h3>
          <p className="text-sm">
            {task.description}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              handleComplete(task)
            }
          >
            <CheckCircle />
          </button>

          <button
            onClick={() =>
              openEdit(task)
            }
          >
            <Edit2 />
          </button>

          <button
            onClick={() =>
              handleDelete(task.id)
            }
          >
            <Trash2 />
          </button>
        </div>
      </div>
    ))
  )}

  <Dialog
    open={isEditOpen}
    onOpenChange={setIsEditOpen}
  >
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Task</DialogTitle>
      </DialogHeader>

      <form
        onSubmit={handleEditSubmit}
        className="space-y-3"
      >
        <Input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
        />

        <Textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

        <Button type="submit">
          Save
        </Button>
      </form>
    </DialogContent>
  </Dialog>
</div>

);
            }
