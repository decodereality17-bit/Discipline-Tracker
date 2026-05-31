import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, eachDayOfInterval, startOfMonth } from "date-fns";
import { Flame, CheckCircle, Target, Plus, BarChart3, Zap, TrendingUp, TrendingDown, Minus, Brain } from "lucide-react";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell, YAxis, AreaChart, Area, CartesianGrid } from "recharts";
import { 
  useListTasks, 
  getListTasksQueryKey, 
  useGetUserStats,
  getGetUserStatsQueryKey,
  useCompleteTask,
  useFetchActivity,
  getFetchActivityQueryKey,
  useCreateTask,
  useRecalculateDiscipline,
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
  const recalculateDiscipline = useRecalculateDiscipline();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");

  const handleCompleteToggle = (id: string, currentStatus: boolean) => {
    completeTaskMutation.mutate(
      { id, data: { completed: !currentStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey({ user_id: user?.id || "", date: today }) });
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
              <div className="text-2xl font-bold">{(stats?.weekly_change ?? 0) >= 0 ? "+" : ""}{stats?.weekly_change?.toFixed(1) ?? "0.0"} pts</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">This Week</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{level}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Rank</div>
            </div>
          </div>
        </div>

        {/* Stats Column */}
        <div className="md:col-span-2 grid grid-cols-2 gap-6">
          {/* Streak Metre — three criteria */}
          <div className="col-span-2 glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Streak Metre</h3>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-3xl font-black text-orange-400 leading-none">{stats?.current_streak || 0}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">day streak · best {stats?.longest_streak || 0}</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Criterion 1: Daily Activity Streak */}
              {(() => {
                const streak = stats?.current_streak || 0;
                const target = 30;
                const pct = Math.min((streak / target) * 100, 100);
                const status = streak >= 7 ? "on-fire" : streak >= 3 ? "building" : "start";
                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-white/80">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        Daily Activity
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          status === "on-fire" ? "bg-orange-500/20 text-orange-300" :
                          status === "building" ? "bg-yellow-500/20 text-yellow-300" :
                          "bg-white/10 text-muted-foreground"
                        }`}>
                          {status === "on-fire" ? "🔥 On Fire" : status === "building" ? "⚡ Building" : "Start"}
                        </span>
                      </span>
                      <span className="text-muted-foreground">{streak} / {target} days</span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-orange-500 to-yellow-400"
                        style={{ width: `${pct}%`, boxShadow: pct > 0 ? "0 0 8px rgba(249,115,22,0.5)" : "none" }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Criterion 2: Weekly Execution Rate */}
              {(() => {
                const rate = stats?.weekly_completion_pct || 0;
                const pct = Math.min(rate, 100);
                const status = rate >= 80 ? "elite" : rate >= 50 ? "steady" : "low";
                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-white/80">
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        Weekly Execution
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          status === "elite" ? "bg-emerald-500/20 text-emerald-300" :
                          status === "steady" ? "bg-blue-500/20 text-blue-300" :
                          "bg-white/10 text-muted-foreground"
                        }`}>
                          {status === "elite" ? "✓ Elite" : status === "steady" ? "Steady" : "Low"}
                        </span>
                      </span>
                      <span className="text-muted-foreground">{rate}% hit rate</span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${pct}%`, boxShadow: pct > 0 ? "0 0 8px rgba(16,185,129,0.5)" : "none" }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Criterion 3: Momentum */}
              {(() => {
                const momentum = stats?.momentum_score || 0;
                const pct = Math.min((momentum / 100) * 100, 100);
                const status = momentum >= 70 ? "peak" : momentum >= 40 ? "rising" : "low";
                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-white/80">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                        Momentum
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          status === "peak" ? "bg-purple-500/20 text-purple-300" :
                          status === "rising" ? "bg-violet-500/20 text-violet-300" :
                          "bg-white/10 text-muted-foreground"
                        }`}>
                          {status === "peak" ? "⚡ Peak" : status === "rising" ? "Rising" : "Low"}
                        </span>
                      </span>
                      <span className="text-muted-foreground">{Math.round(momentum)} / 100</span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-violet-600 to-primary"
                        style={{ width: `${pct}%`, boxShadow: pct > 0 ? "0 0 8px rgba(147,51,234,0.5)" : "none" }}
                      />
                    </div>
                  </div>
                );
              })()}
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

          {/* Discipline Score This Month */}
          {(() => {
            const todayDate = new Date();
            const monthStart = startOfMonth(todayDate);
            const daysThisMonth = eachDayOfInterval({ start: monthStart, end: todayDate });

            // Reconstruct daily running score from deltas
            const monthDeltas = daysThisMonth.map(d => {
              const ds = format(d, "yyyy-MM-dd");
              const act = activities?.find(a => a.date === ds);
              return { date: ds, delta: act?.discipline_delta ?? 0 };
            });
            const totalMonthDelta = monthDeltas.reduce((s, d) => s + d.delta, 0);
            const startScore = Math.max(0, (stats?.discipline_score ?? 0) - totalMonthDelta);

            let running = startScore;
            const monthChartData = monthDeltas.map(d => {
              running = Math.max(0, Math.min(100, running + d.delta));
              return { day: format(new Date(d.date + "T12:00:00"), "d"), score: parseFloat(running.toFixed(1)) };
            });

            const minScore = Math.max(0, Math.min(...monthChartData.map(d => d.score)) - 5);
            const maxScore = Math.min(100, Math.max(...monthChartData.map(d => d.score)) + 5);
            const currentScore = stats?.discipline_score ?? 0;
            const monthGain = parseFloat(totalMonthDelta.toFixed(1));

            return (
              <div className="col-span-2 glass rounded-3xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Discipline Score — {format(todayDate, "MMMM")}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-2xl font-black glow-text">{Math.round(currentScore)}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Current</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-black ${monthGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {monthGain >= 0 ? "+" : ""}{monthGain}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest">This month</div>
                    </div>
                  </div>
                </div>

                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthChartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} axisLine={false} interval={3} />
                      <YAxis stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} axisLine={false} domain={[minScore, maxScore]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "rgba(0,0,0,0.85)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: 12 }}
                        formatter={(v: number) => [`${v}`, "Score"]}
                        labelFormatter={(l) => `Day ${l}`}
                      />
                      <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#scoreGradient)" dot={false} activeDot={{ r: 4, fill: "hsl(var(--primary))" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}

          {/* Today's Analysis */}
          {(() => {
            const completedToday = tasks?.filter(t => t.completed).length || 0;
            const totalToday = tasks?.length || 0;
            const completionPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;
            const delta = stats?.weekly_change || 0;
            const streak = stats?.current_streak || 0;
            const score = stats?.discipline_score || 0;
            const momentum = stats?.momentum_score || 0;

            const getDeltaColor = () => delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-muted-foreground";
            const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;

            const getAnalysis = () => {
              if (totalToday === 0) return { grade: "–", label: "No tasks set", tip: "Add at least one objective for today to start building your discipline score.", color: "text-muted-foreground", bg: "bg-white/5" };
              if (completionPct === 100) return { grade: "S", label: "Perfect execution", tip: "All objectives complete. Discipline score will compound upward. Maintain this to push your streak.", color: "text-emerald-400", bg: "bg-emerald-500/10" };
              if (completionPct >= 75) return { grade: "A", label: "Strong day", tip: `${totalToday - completedToday} task${totalToday - completedToday > 1 ? "s" : ""} remaining. Close the gap before midnight to protect your streak.`, color: "text-primary", bg: "bg-primary/10" };
              if (completionPct >= 50) return { grade: "B", label: "Halfway there", tip: "You're at 50%+. Push through the remaining tasks — half-days erode momentum over time.", color: "text-yellow-400", bg: "bg-yellow-500/10" };
              if (completionPct > 0) return { grade: "C", label: "Slow start", tip: "Low execution today. Even completing one more task will prevent a streak reset.", color: "text-orange-400", bg: "bg-orange-500/10" };
              return { grade: "F", label: "Not started", tip: "Zero tasks completed. Complete at least one objective now to keep your streak alive.", color: "text-red-400", bg: "bg-red-500/10" };
            };

            const analysis = getAnalysis();

            return (
              <div className="col-span-2 glass rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <Brain className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Today's Analysis</h3>
                  <span className="text-xs text-muted-foreground ml-auto">{format(new Date(), "EEE, MMM d")}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {/* Daily Grade */}
                  <div className={`rounded-2xl p-4 flex flex-col items-center justify-center text-center ${analysis.bg} border border-white/5`}>
                    <span className={`text-4xl font-black ${analysis.color}`}>{analysis.grade}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{analysis.label}</span>
                  </div>

                  {/* Tasks today */}
                  <div className="rounded-2xl p-4 bg-white/5 border border-white/5 flex flex-col justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Tasks Today</span>
                    <div>
                      <span className="text-2xl font-black">{completedToday}</span>
                      <span className="text-muted-foreground text-sm"> / {totalToday}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                    </div>
                  </div>

                  {/* Weekly score change */}
                  <div className="rounded-2xl p-4 bg-white/5 border border-white/5 flex flex-col justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Score This Week</span>
                    <div className={`flex items-center gap-1 text-2xl font-black ${getDeltaColor()}`}>
                      <DeltaIcon className="w-5 h-5" />
                      {delta > 0 ? "+" : ""}{delta.toFixed(1)} pts
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">{delta > 0 ? "improving" : delta < 0 ? "declining" : "no change"}</span>
                  </div>

                  {/* Streak status */}
                  <div className="rounded-2xl p-4 bg-white/5 border border-white/5 flex flex-col justify-between">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Streak Risk</span>
                    <div className={`text-2xl font-black ${completedToday > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {completedToday > 0 ? "Safe" : streak > 0 ? "At Risk" : "None"}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1">{streak} day streak</span>
                  </div>
                </div>

                {/* Tip */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-white/80 leading-relaxed">{analysis.tip}</p>
                </div>
              </div>
            );
          })()}

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
