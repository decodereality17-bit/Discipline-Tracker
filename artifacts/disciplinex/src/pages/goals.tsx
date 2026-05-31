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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Trash2, Edit2, CheckCircle2, PauseCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["general", "health", "career", "finance", "learning", "fitness", "personal"] as const;
type Category = typeof CATEGORIES[number];

const CATEGORY_COLORS: Record<Category, string> = {
  general:  "bg-slate-500/20  text-slate-300  border-slate-500/30",
  health:   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  career:   "bg-blue-500/20    text-blue-300    border-blue-500/30",
  finance:  "bg-yellow-500/20  text-yellow-300  border-yellow-500/30",
  learning: "bg-purple-500/20  text-purple-300  border-purple-500/30",
  fitness:  "bg-orange-500/20  text-orange-300  border-orange-500/30",
  personal: "bg-pink-500/20    text-pink-300    border-pink-500/30",
};

const CATEGORY_EMOJI: Record<Category, string> = {
  general: "🎯", health: "❤️", career: "💼", finance: "💰",
  learning: "📚", fitness: "💪", personal: "🌱",
};

type GoalStatus = "active" | "completed" | "paused";
type ApiGoal = {
  id: string; user_id: string; title: string; description?: string | null;
  category: string; status: string; progress: number;
  target_date?: string | null; created_at: string; updated_at: string;
};

export default function Goals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("active");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ApiGoal | null>(null);

  // Create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("general");
  const [targetDate, setTargetDate] = useState("");

  // Edit form
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("general");
  const [editTargetDate, setEditTargetDate] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState<GoalStatus>("active");

  const queryKey = getListGoalsQueryKey({ user_id: user?.id || "" });
  const { data: goals = [], isLoading } = useListGoals(
    { user_id: user?.id || "" },
    { query: { enabled: !!user?.id, queryKey } }
  );

  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const deleteMutation = useDeleteGoal();

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const filteredGoals = goals.filter(g =>
    activeTab === "all" ? true : g.status === activeTab
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await createMutation.mutateAsync({
      data: { user_id: user.id, title, description: description || undefined, category, target_date: targetDate || undefined }
    });
    invalidate();
    setTitle(""); setDescription(""); setCategory("general"); setTargetDate("");
    setIsCreateOpen(false);
  };

  const openEdit = (goal: ApiGoal) => {
    setEditingGoal(goal);
    setEditTitle(goal.title);
    setEditDescription(goal.description ?? "");
    setEditCategory((goal.category as Category) ?? "general");
    setEditTargetDate(goal.target_date ?? "");
    setEditProgress(goal.progress);
    setEditStatus((goal.status as GoalStatus) ?? "active");
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;
    await updateMutation.mutateAsync({
      id: editingGoal.id,
      data: {
        title: editTitle, description: editDescription || undefined,
        category: editCategory, target_date: editTargetDate || undefined,
        progress: editProgress, status: editStatus,
      }
    });
    invalidate();
    setIsEditOpen(false);
    setEditingGoal(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync({ id });
    invalidate();
  };

  const handleProgressClick = async (goal: ApiGoal, newProgress: number) => {
    const status: GoalStatus = newProgress >= 100 ? "completed" : "active";
    await updateMutation.mutateAsync({ id: goal.id, data: { progress: newProgress, status } });
    invalidate();
  };

  const counts = {
    active: goals.filter(g => g.status === "active").length,
    completed: goals.filter(g => g.status === "completed").length,
    paused: goals.filter(g => g.status === "paused").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold glow-text">Goal Registry</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your objectives and measure progress</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 glow-purple gap-2">
              <Plus className="w-4 h-4" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-white/10 bg-card">
            <DialogHeader>
              <DialogTitle>Create Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="What do you want to achieve?" className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-1">
                <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your goal..." className="bg-black/40 border-white/10 resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={v => setCategory(v as Category)}>
                    <SelectTrigger className="bg-black/40 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>{CATEGORY_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Target Date <span className="text-muted-foreground">(optional)</span></Label>
                  <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                    className="bg-black/40 border-white/10" />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1 border-white/10"
                  onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Goal"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { label: "Active",    value: counts.active,    icon: <Target className="w-4 h-4" />,       color: "text-primary" },
          { label: "Completed", value: counts.completed, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400" },
          { label: "Paused",    value: counts.paused,    icon: <PauseCircle className="w-4 h-4" />,  color: "text-yellow-400" },
        ] as const).map(stat => (
          <div key={stat.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className={cn("opacity-80", stat.color)}>{stat.icon}</div>
            <div>
              <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + list */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border border-white/10">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">Loading goals...</div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Target className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <p className="text-muted-foreground">No {activeTab === "all" ? "" : activeTab} goals yet.</p>
              {activeTab === "active" && (
                <Button variant="outline" className="border-white/10 mt-2" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Create your first goal
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => openEdit(goal as ApiGoal)}
                  onDelete={() => handleDelete(goal.id)}
                  onProgressClick={(p) => handleProgressClick(goal as ApiGoal, p)}
                  isUpdating={updateMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={v => { setIsEditOpen(v); if (!v) setEditingGoal(null); }}>
        <DialogContent className="glass border-white/10 bg-card">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input required value={editTitle} onChange={e => setEditTitle(e.target.value)}
                className="bg-black/40 border-white/10" />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)}
                className="bg-black/40 border-white/10 resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={editCategory} onValueChange={v => setEditCategory(v as Category)}>
                  <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{CATEGORY_EMOJI[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={v => setEditStatus(v as GoalStatus)}>
                  <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Target Date</Label>
                <Input type="date" value={editTargetDate} onChange={e => setEditTargetDate(e.target.value)}
                  className="bg-black/40 border-white/10" />
              </div>
              <div className="space-y-1">
                <Label>Progress — {editProgress}%</Label>
                <input type="range" min={0} max={100} step={5} value={editProgress}
                  onChange={e => setEditProgress(Number(e.target.value))}
                  className="w-full accent-primary mt-2" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 border-white/10"
                onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90"
                disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalCard({ goal, onEdit, onDelete, onProgressClick, isUpdating }: {
  goal: ApiGoal;
  onEdit: () => void;
  onDelete: () => void;
  onProgressClick: (progress: number) => void;
  isUpdating: boolean;
}) {
  const cat = (goal.category as Category) in CATEGORY_COLORS ? (goal.category as Category) : "general";
  const isCompleted = goal.status === "completed";
  const isPaused = goal.status === "paused";
  const isOverdue = goal.target_date && isPast(parseISO(goal.target_date)) && !isCompleted;

  const quickSteps = [25, 50, 75, 100];

  return (
    <div className={cn(
      "glass rounded-xl p-4 space-y-3 transition-all duration-200 border",
      isCompleted ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/5 hover:border-white/10",
      isPaused && "opacity-60"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xl mt-0.5 shrink-0">{CATEGORY_EMOJI[cat]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("font-semibold truncate", isCompleted && "line-through text-muted-foreground")}>
                {goal.title}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full border shrink-0", CATEGORY_COLORS[cat])}>
                {cat}
              </span>
              {isPaused && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  paused
                </span>
              )}
              {isCompleted && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ✓ done
                </span>
              )}
            </div>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description}</p>
            )}
            {goal.target_date && (
              <p className={cn("text-xs mt-1", isOverdue ? "text-red-400" : "text-muted-foreground")}>
                {isOverdue ? "⚠ Overdue · " : ""}
                Target: {format(parseISO(goal.target_date), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="w-8 h-8 text-muted-foreground hover:text-foreground"
            onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost"
            className="w-8 h-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Progress</span>
          <span className={cn("font-semibold", isCompleted ? "text-emerald-400" : "text-primary")}>
            {goal.progress}%
          </span>
        </div>
        <Progress value={goal.progress}
          className={cn("h-2", isCompleted ? "[&>div]:bg-emerald-500" : "[&>div]:bg-primary")} />
        {!isCompleted && (
          <div className="flex gap-1 pt-1">
            {quickSteps.map(step => (
              <button key={step}
                disabled={isUpdating}
                onClick={() => onProgressClick(step)}
                className={cn(
                  "flex-1 text-xs py-1 rounded-md border transition-colors",
                  goal.progress === step
                    ? "border-primary/60 bg-primary/20 text-primary"
                    : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}>
                {step}%
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
