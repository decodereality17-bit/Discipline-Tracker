import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Flame, CheckCircle, Target, Plus, BarChart3, Zap } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, YAxis } from "recharts";
import { 
  useListTasks, 
  getListTasksQueryKey, 
  useGetUserStats,
  getGetUserStatsQueryKey,
  useCompleteTask,
  useFetchActivity,
  getFetchActivityQueryKey,
  useCreateTask
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { calculateLevel } from "@/lib/discipline";

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: stats, isLoading: statsLoading } = useGetUserStats(user?.id || "", {
    query: { enabled: !!user?.id, queryKey: getGetUserStatsQueryKey(user?.id || "") }
  });

  const { data: tasks, isLoading: tasksLoading } = useListTasks(
    { user_id: user?.id || "", date: today },
    { query: { enabled: !!user?.id, queryKey: getListTasksQueryKey({ user_id: user?.id || "", date: today }) } }
  );

  const { data: activities } = useFetchActivity(
    { user_id: user?.id || "", days: 84 },
    { query: { enabled: !!user?.id, queryKey: getFetchActivityQueryKey({ user_id: user?.id || "", days: 84 }) } }
  );

  const completeTaskMutation = useCompleteTask();
  const createTaskMutation = useCreateTask();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");

  const handleCompleteToggle = (id: string, currentStatus: boolean) => {
    completeTaskMutation.mutate(
      { id, data: { completed: !currentStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ user_id: user?.id || "", date: today }) });
        }
      }
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !user) return;
    
    createTaskMutation.mutate(
      { 
        data: {
          title: newTaskTitle,
          priority: newTaskPriority,
          due_date: today,
          user_id: user.id
        }
      },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ user_id: user.id, date: today }) });
        }
      }
    );
  };

  const currentScore = stats?.discipline_score || 0;
  const level = calculateLevel(currentScore);
  
  const chartData = [
    { name: 'Background', value: 100, fill: 'rgba(255,255,255,0.05)' },
    { name: 'Score', value: currentScore, fill: 'hsl(var(--primary))' }
  ];

  // Prepare heatmap data
  const todayDate = new Date();
  const heatmapStart = subDays(todayDate, 84); // 12 weeks
  const dateRange = eachDayOfInterval({ start: heatmapStart, end: todayDate });
  
  const heatmapData = dateRange.map(date => {
    const dateStr = format(date, "yyyy-MM-dd");
    const activity = activities?.find(a => a.date === dateStr);
    return {
      date: dateStr,
      tasksCompleted: activity?.tasks_completed || 0,
      tasksTotal: activity?.tasks_total || 0,
    };
  });

  // Analytics preview (last 7 days)
  const last7Days = eachDayOfInterval({ start: subDays(todayDate, 6), end: todayDate });
  const weeklyData = last7Days.map(date => {
    const dateStr = format(date, "yyyy-MM-dd");
    const activity = activities?.find(a => a.date === dateStr);
    return {
      name: format(date, "EEE"),
      completed: activity?.tasks_completed || 0,
    };
  });

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Command Center</h1>
          <p className="text-muted-foreground uppercase tracking-widest text-xs mt-2 font-semibold">
            {format(new Date(), "EEEE, MMMM do, yyyy")} // {level} PROTOCOL
          </p>
        </div>
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-full glow-purple">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-primary font-bold tracking-widest uppercase text-sm">Status: Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Gauge */}
        <div className="md:col-span-1 glass rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-50" />
          
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 z-10">Discipline Output</h2>
          
          <div className="w-full aspect-square max-w-[240px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" cy="50%" 
                innerRadius="75%" outerRadius="100%" 
                barSize={15} 
                data={chartData} 
                startAngle={210} endAngle={-30}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  className="drop-shadow-[0_0_8px_rgba(147,51,234,0.6)]"
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black glow-text">{Math.round(currentScore)}</span>
              <span className="text-xs font-semibold text-muted-foreground mt-1">SCORE</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4 z-10 w-full justify-around px-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats?.weekly_change || 0 > 0 ? "+" : ""}{stats?.weekly_change?.toFixed(1) || "0.0"}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">7D Delta</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{level}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Rank</div>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="md:col-span-2 grid grid-cols-2 gap-6">
          <div className="glass rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                <Flame className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Streak</span>
            </div>
            <div>
              <div className="text-5xl font-black mt-4">{stats?.current_streak || 0}</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">days active (Best: {stats?.longest_streak || 0})</div>
            </div>
          </div>

          <div className="glass rounded-3xl p-6 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Execution</span>
            </div>
            <div>
              <div className="text-5xl font-black mt-4">{stats?.weekly_completion_pct || 0}%</div>
              <div className="text-sm text-muted-foreground font-medium mt-1">7-day hit rate</div>
            </div>
          </div>

          <div className="col-span-2 glass rounded-3xl p-6 flex flex-col md:flex-row gap-8">
             {/* Analytics Preview */}
             <div className="flex-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Weekly Volume
              </h3>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px'}}
                    />
                    <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                      {weeklyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.completed > 0 ? "hsl(var(--primary))" : "rgba(255,255,255,0.1)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Heatmap */}
            <div className="flex-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                <Target className="w-4 h-4" /> Activity Matrix
              </h3>
              <div className="flex gap-1 flex-wrap content-start h-40 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                {heatmapData.map((day, i) => (
                  <div 
                    key={i}
                    title={`${day.date}: ${day.tasksCompleted} tasks`}
                    className={`w-3 h-3 rounded-sm ${
                      day.tasksCompleted === 0 ? "bg-white/5" :
                      day.tasksCompleted < 3 ? "bg-primary/40" :
                      day.tasksCompleted < 5 ? "bg-primary/70" :
                      "bg-primary glow-[0_0_8px_rgba(147,51,234,0.8)]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-2 glass rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Today's Objectives</h3>
                <span className="text-xs font-bold px-3 py-1 bg-white/5 rounded-full">{tasks?.length || 0} Total</span>
              </div>

              <form onSubmit={handleCreateTask} className="flex items-center gap-2 w-full sm:w-auto">
                <Input 
                  placeholder="Quick add..." 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="bg-black/50 border-white/10 max-w-[200px]"
                />
                <Select value={newTaskPriority} onValueChange={(val: any) => setNewTaskPriority(val)}>
                  <SelectTrigger className="w-[100px] bg-black/50 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Med</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" size="icon" disabled={!newTaskTitle || createTaskMutation.isPending} className="bg-primary hover:bg-primary/80 glow-purple shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </form>
            </div>

            <div className="space-y-3">
              {tasksLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-white/5 rounded-xl w-full" />
                  ))}
                </div>
              ) : tasks && tasks.length > 0 ? (
                tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                    <button 
                      onClick={() => handleCompleteToggle(task.id, task.completed)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                        task.completed 
                          ? "bg-primary border-primary glow-purple text-white" 
                          : "border-muted-foreground hover:border-primary"
                      }`}
                      data-testid={`toggle-task-${task.id}`}
                    >
                      {task.completed && <CheckCircle className="w-4 h-4" />}
                    </button>
                    <div className="flex-1">
                      <p className={`font-semibold ${task.completed ? "text-muted-foreground line-through" : "text-white"}`}>
                        {task.title}
                      </p>
                    </div>
                    {task.priority && (
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500 glow-[0_0_10px_rgba(239,68,68,0.8)]' : 
                        task.priority === 'medium' ? 'bg-yellow-500 glow-[0_0_10px_rgba(234,179,8,0.8)]' : 
                        'bg-blue-500 glow-[0_0_10px_rgba(59,130,246,0.8)]'
                      }`} title={`Priority: ${task.priority}`} />
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-white/10 rounded-xl">
                  No objectives set for today. Add one above.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
