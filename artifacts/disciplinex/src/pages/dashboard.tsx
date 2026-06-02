import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

import {
  useListTasks,
  getListTasksQueryKey,
  useListGoals,
  getListGoalsQueryKey,
  useGetUserStats,
  getGetUserStatsQueryKey,
} from "@workspace/api-client-react";

export default function Dashboard() {
  const { user } = useAuth();

  // =====================
  // DATA FETCH
  // =====================
  const { data: tasks = [] } = useListTasks(
    { user_id: user?.id || "" },
    { query: { enabled: !!user?.id, queryKey: getListTasksQueryKey({ user_id: user?.id || "" }) } }
  );

  const { data: goals = [] } = useListGoals(
    { user_id: user?.id || "" },
    { query: { enabled: !!user?.id, queryKey: getListGoalsQueryKey({ user_id: user?.id || "" }) } }
  );

  const { data: stats } = useGetUserStats(
    user?.id || "",
    { query: { enabled: !!user?.id, queryKey: getGetUserStatsQueryKey(user?.id || "") } }
  );

  const today = format(new Date(), "yyyy-MM-dd");

  // =====================
  // SAFE TASKS
  // =====================
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const taskStats = useMemo(() => {
    const total = safeTasks.length;
    const completed = safeTasks.filter(t => t.completed).length;
    const todayTasks = safeTasks.filter(t => t.due_date === today);
    const overdue = safeTasks.filter(
      t => t.due_date && t.due_date < today && !t.completed
    );

    return {
      total,
      completed,
      pending: total - completed,
      today: todayTasks.length,
      overdue: overdue.length,
    };
  }, [safeTasks, today]);

  // =====================
  // GOAL STATS
  // =====================
  const safeGoals = Array.isArray(goals) ? goals : [];

  const goalStats = useMemo(() => {
    return {
      active: safeGoals.filter(g => g.status === "active").length,
      completed: safeGoals.filter(g => g.status === "completed").length,
      paused: safeGoals.filter(g => g.status === "paused").length,
      total: safeGoals.length,
    };
  }, [safeGoals]);

  // =====================
  // SAFE STATS
  // =====================
  const safeStats = {
    streak: stats?.longest_streak ?? 0,
    discipline: stats?.discipline_score ?? 0,
    momentum: stats?.momentum_score ?? 0,
  };

  // =====================
  // UI
  // =====================
  return (
    <div className="space-y-8 pb-10">

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-white">Dashboard</h1>
        <p className="text-muted-foreground text-xs uppercase tracking-widest">
          Unified performance system
        </p>
      </div>

      {/* TOP STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Card label="Tasks Done" value={taskStats.completed} />
        <Card label="Pending" value={taskStats.pending} />
        <Card label="Goals Active" value={goalStats.active} />
        <Card label="Streak" value={safeStats.streak} />

      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* TASK SUMMARY */}
        <div className="glass p-5 rounded-xl">
          <h2 className="text-sm uppercase text-muted-foreground mb-3">
            Task Overview
          </h2>

          <div className="space-y-2 text-sm">
            <Row label="Total Tasks" value={taskStats.total} />
            <Row label="Completed" value={taskStats.completed} />
            <Row label="Today" value={taskStats.today} />
            <Row label="Overdue" value={taskStats.overdue} danger />
          </div>
        </div>

        {/* GOAL SUMMARY */}
        <div className="glass p-5 rounded-xl">
          <h2 className="text-sm uppercase text-muted-foreground mb-3">
            Goal Overview
          </h2>

          <div className="space-y-2 text-sm">
            <Row label="Total Goals" value={goalStats.total} />
            <Row label="Active" value={goalStats.active} />
            <Row label="Completed" value={goalStats.completed} />
            <Row label="Paused" value={goalStats.paused} />
          </div>
        </div>

        {/* PERFORMANCE */}
        <div className="glass p-5 rounded-xl">
          <h2 className="text-sm uppercase text-muted-foreground mb-3">
            Performance
          </h2>

          <div className="space-y-2 text-sm">
            <Row label="Discipline" value={`${safeStats.discipline}%`} />
            <Row label="Momentum" value={Math.round(safeStats.momentum)} />
            <Row label="Streak" value={safeStats.streak} />
          </div>
        </div>

      </div>

      {/* QUICK INSIGHT */}
      <div className="glass p-6 rounded-xl">
        <h2 className="text-sm uppercase text-muted-foreground mb-3">
          Quick Insight
        </h2>

        <p className="text-sm text-white/80">
          {taskStats.overdue > 0
            ? `⚠ You have ${taskStats.overdue} overdue tasks. Focus needed.`
            : taskStats.completed > taskStats.pending
            ? `🔥 Good momentum! You're completing more than pending tasks.`
            : `📊 Keep pushing — consistency builds discipline.`}
        </p>
      </div>

    </div>
  );
}

// =====================
// CARD
// =====================
function Card({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="glass p-4 rounded-xl">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
}

// =====================
// ROW
// =====================
function Row({
  label,
  value,
  danger,
}: {
  label: string;
  value: number | string;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={danger ? "text-red-400 font-semibold" : "text-white"}>
        {value}
      </span>
    </div>
  );
        }
