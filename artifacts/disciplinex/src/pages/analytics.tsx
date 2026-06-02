import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line,
  AreaChart, Area, CartesianGrid
} from "recharts";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { Activity, Target, Zap, Trophy } from "lucide-react";
import {
  useGetUserStats,
  getGetUserStatsQueryKey,
  useFetchActivity,
  getFetchActivityQueryKey
} from "@workspace/api-client-react";

export default function Analytics() {
  const { user } = useAuth();

  const { data: stats } = useGetUserStats(
    user?.id || "",
    { query: { enabled: !!user?.id, queryKey: getGetUserStatsQueryKey(user?.id || "") } }
  );

  const { data: activities = [] } = useFetchActivity(
    { user_id: user?.id || "", days: 30 },
    { query: { enabled: !!user?.id, queryKey: getFetchActivityQueryKey({ user_id: user?.id || "", days: 30 }) } }
  );

  const today = new Date();

  // 🔥 FAST LOOKUP MAP (fix O(n²) issue)
  const activityMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const a of activities) {
      map.set(a.date, a);
    }
    return map;
  }, [activities]);

  // ========================
  // 📊 7 DAY DATA
  // ========================
  const weeklyData = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(today, 6),
      end: today
    }).map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      const activity = activityMap.get(dateStr);

      const total = activity?.tasks_total || 0;
      const completed = activity?.tasks_completed || 0;

      return {
        name: format(d, "EEE"),
        completed,
        total,
        rate: total ? Math.round((completed / total) * 100) : 0
      };
    });
  }, [activityMap]);

  // ========================
  // 📈 30 DAY SCORE (NO RANDOMNESS → FIX HYDRATION BUG)
  // ========================
  const monthlyScore = useMemo(() => {
    let score = stats?.discipline_score ?? 50;

    return eachDayOfInterval({
      start: subDays(today, 29),
      end: today
    }).map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      const activity = activityMap.get(dateStr);

      const delta = activity?.discipline_delta ?? 0;

      score = Math.max(0, Math.min(100, score + delta));

      return {
        date: format(d, "MMM d"),
        score: Math.round(score)
      };
    });
  }, [activityMap, stats?.discipline_score]);

  // ========================
  // SAFE STATS
  // ========================
  const safeStats = {
    total_tasks_completed: stats?.total_tasks_completed ?? 0,
    weekly_completion_pct: stats?.weekly_completion_pct ?? 0,
    momentum_score: stats?.momentum_score ?? 0,
    longest_streak: stats?.longest_streak ?? 0,
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <div className="bg-card/95 border border-border p-3 rounded-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-white">
          {payload[0].value}
          {payload[0].dataKey === "rate" ? "%" : ""}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-white">Analytics</h1>
        <p className="text-muted-foreground text-xs uppercase tracking-widest">
          Performance telemetry
        </p>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Card icon={<Target />} value={safeStats.total_tasks_completed} label="Total Done" />
        <Card icon={<Activity />} value={`${safeStats.weekly_completion_pct}%`} label="7D Rate" />
        <Card icon={<Zap />} value={Math.round(safeStats.momentum_score)} label="Momentum" />
        <Card icon={<Trophy />} value={safeStats.longest_streak} label="Streak" />

      </div>

      {/* GRAPHS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* WEEKLY */}
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-xs uppercase mb-4 text-muted-foreground">
            7-Day Activity
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="completed" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RATE */}
        <div className="glass p-6 rounded-2xl">
          <h3 className="text-xs uppercase mb-4 text-muted-foreground">
            Efficiency
          </h3>

          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="rate"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--primary))"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* MONTHLY */}
        <div className="glass p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-xs uppercase mb-4 text-muted-foreground">
            30-Day Discipline Trend
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyScore}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" minTickGap={20} />
              <YAxis domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

// ========================
// CARD COMPONENT
// ========================
function Card({
  icon,
  value,
  label
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="glass p-4 rounded-xl">
      <div className="text-primary mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
      }
