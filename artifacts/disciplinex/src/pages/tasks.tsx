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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  // Forms
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low"|"medium"|"high">("medium");
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

  const filteredTasks = allTasks?.filter(task => {
    if (activeTab === "today") {
      return task.due_date === todayStr && !task.completed;
    }
    if (activeTab === "completed") {
      return task.completed;
    }
    return true; // "all"
  }).sort((a, b) => {
    // Sort by completion, then due date, then priority
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.due_date !== b.due_date) return (a.due_date || "") > (b.due_date || "") ? 1 : -1;
    const pWeight = { high: 0, medium: 1, low: 2 };
    return pWeight[(a.priority || "medium") as keyof typeof pWeight] - pWeight[(b.priority || "medium") as keyof typeof pWeight];
  });

  const handleCompleteToggle = (id: string, currentStatus: boolean) => {
    completeTaskMutation.mutate(
      { id, data: { completed: !currentStatus } },
      {
        onSuccess: () => {
          invalidateTasks();
          if (user?.id) {
            recalculateDiscipline.mutate({ userId: user.id }, {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getGetUserStatsQueryKey(user.id) });
              }
            });
          }
        }
      }
    );
  };

  const handleDelete = (id: string) => {
    if(confirm("Are you sure you want to delete this objective?")) {
      deleteTaskMutation.mutate({ id }, { onSuccess: () => invalidateTasks() });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    
    createTaskMutation.mutate(
      { 
        data: { title, description, priority, due_date: dueDate, user_id: user.id }
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          resetForm();
          invalidateTasks();
        }
      }
    );
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    updateTaskMutation.mutate(
      {
        id: editingTask.id,
        data: { title, description, priority, due_date: dueDate }
      },
      {
        onSuccess: () => {
          setIsEditOpen(false);
          setEditingTask(null);
          resetForm();
          invalidateTasks();
        }
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate(todayStr);
  };

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ user_id: user?.id || "" }) });
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Task Registry</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs mt-2 font-semibold">
            Objective management
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if(!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold glow-purple" data-testid="button-new-task">
              <Plus className="w-4 h-4 mr-2" /> New Objective
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Create Objective</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={title} onChange={e=>setTitle(e.target.value)} required className="bg-black/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Textarea id="desc" value={description} onChange={e=>setDescription(e.target.value)} className="bg-black/50" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v:any)=>setPriority(v)}>
                    <SelectTrigger className="bg-black/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Due Date</Label>
                  <Input id="date" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="bg-black/50" />
                </div>
              </div>
              <Button type="submit" className="w-full mt-4" disabled={createTaskMutation.isPending}>
                Deploy Objective
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if(!open) { setEditingTask(null); resetForm(); }
      }}>
        <DialogContent className="bg-card border-border sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Modify Objective</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input id="edit-title" value={title} onChange={e=>setTitle(e.target.value)} required className="bg-black/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea id="edit-desc" value={description} onChange={e=>setDescription(e.target.value)} className="bg-black/50" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v:any)=>setPriority(v)}>
                  <SelectTrigger className="bg-black/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Due Date</Label>
                <Input id="edit-date" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="bg-black/50" />
              </div>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={updateTaskMutation.isPending}>
              Save Modifications
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-xl mb-6">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">All Tasks</TabsTrigger>
          <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Today</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white">Completed</TabsTrigger>
        </TabsList>

        <div className="space-y-3">
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 glass rounded-xl w-full" />
              ))}
            </div>
          ) : filteredTasks && filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div key={task.id} className={`glass rounded-xl p-4 flex items-start gap-4 transition-all duration-300 ${task.completed ? "opacity-60" : ""}`}>
                <button 
                  onClick={() => handleCompleteToggle(task.id, task.completed)}
                  className={`mt-1 shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    task.completed 
                      ? "bg-primary border-primary glow-purple text-white" 
                      : "border-muted-foreground hover:border-primary"
                  }`}
                  data-testid={`toggle-task-${task.id}`}
                >
                  {task.completed && <CheckCircle className="w-4 h-4" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-semibold truncate ${task.completed ? "line-through text-muted-foreground" : "text-white"}`}>
                      {task.title}
                    </h3>
                    <div className="flex gap-2">
                      {task.priority && (
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm bg-black/50 border ${
                          task.priority === 'high' ? 'text-red-500 border-red-500/30' : 
                          task.priority === 'medium' ? 'text-yellow-500 border-yellow-500/30' : 
                          'text-blue-500 border-blue-500/30'
                        }`}>
                          {task.priority}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm bg-black/50 border border-white/10 text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {task.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{task.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(task)} className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass rounded-3xl p-12 text-center flex flex-col items-center justify-center">
              <CheckCircle className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-bold tracking-widest uppercase mb-2">No Objectives Found</h2>
              <p className="text-muted-foreground">
                {activeTab === 'completed' ? "You haven't completed any objectives yet." : "Your registry is empty."}
              </p>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
