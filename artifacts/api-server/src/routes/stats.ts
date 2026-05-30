import { Router } from "express";
import { db, userStatsTable, tasksTable, dailyActivityTable } from "@workspace/db";
import { eq, gte, and } from "drizzle-orm";
import {
  GetUserStatsParams,
  UpsertUserStatsParams,
  UpsertUserStatsBody,
  RecalculateDisciplineParams,
} from "@workspace/api-zod";

const router = Router();

function calculateLevel(score: number): string {
  if (score <= 20) return "Beginner";
  if (score <= 40) return "Focused";
  if (score <= 60) return "Disciplined";
  if (score <= 80) return "Elite";
  return "Master";
}

function calculateDisciplineScore(
  currentScore: number,
  tasksCompleted: number,
  tasksTotal: number,
  currentStreak: number,
  daysSinceActive: number
): number {
  if (tasksTotal === 0) {
    const decay = daysSinceActive > 1 ? Math.min(3, daysSinceActive * 0.5) : 0;
    return Math.max(0, currentScore - decay);
  }
  const completionRate = tasksCompleted / tasksTotal;
  const streakBonus = Math.min(20, currentStreak * 0.5);
  const consistencyGain = completionRate * 8;
  const momentumMultiplier = currentStreak >= 7 ? 1.3 : currentStreak >= 3 ? 1.1 : 1.0;
  const gain = (consistencyGain + streakBonus * 0.2) * momentumMultiplier;
  const newScore = currentScore + (gain - currentScore * 0.02);
  return Math.min(100, Math.max(0, newScore));
}

function toApiStats(s: typeof userStatsTable.$inferSelect) {
  return {
    user_id: s.userId,
    discipline_score: s.disciplineScore,
    weekly_change: s.weeklyChange,
    current_streak: s.currentStreak,
    longest_streak: s.longestStreak,
    total_tasks_completed: s.totalTasksCompleted,
    weekly_completion_pct: s.weeklyCompletionPct,
    level: s.level,
    momentum_score: s.momentumScore,
    last_active_date: s.lastActiveDate ?? null,
    updated_at: s.updatedAt.toISOString(),
  };
}

router.get("/stats/:user_id", async (req, res) => {
  const { user_id } = GetUserStatsParams.parse(req.params);
  const [stats] = await db
    .select()
    .from(userStatsTable)
    .where(eq(userStatsTable.userId, user_id));
  if (!stats) {
    res.json({
      user_id,
      discipline_score: 0,
      weekly_change: 0,
      current_streak: 0,
      longest_streak: 0,
      total_tasks_completed: 0,
      weekly_completion_pct: 0,
      level: "Beginner",
      momentum_score: 0,
      last_active_date: null,
      updated_at: new Date().toISOString(),
    });
    return;
  }
  res.json(toApiStats(stats));
});

router.put("/stats/:user_id", async (req, res) => {
  const { user_id } = UpsertUserStatsParams.parse(req.params);
  const body = UpsertUserStatsBody.parse(req.body);
  const updateData: Record<string, unknown> = { userId: user_id };
  if (body.discipline_score !== undefined) updateData.disciplineScore = body.discipline_score;
  if (body.weekly_change !== undefined) updateData.weeklyChange = body.weekly_change;
  if (body.current_streak !== undefined) updateData.currentStreak = body.current_streak;
  if (body.longest_streak !== undefined) updateData.longestStreak = body.longest_streak;
  if (body.total_tasks_completed !== undefined) updateData.totalTasksCompleted = body.total_tasks_completed;
  if (body.weekly_completion_pct !== undefined) updateData.weeklyCompletionPct = body.weekly_completion_pct;
  if (body.level !== undefined) updateData.level = body.level;
  if (body.momentum_score !== undefined) updateData.momentumScore = body.momentum_score;
  if (body.last_active_date !== undefined) updateData.lastActiveDate = body.last_active_date;

  const [stats] = await db
    .insert(userStatsTable)
    .values({ userId: user_id, ...updateData })
    .onConflictDoUpdate({
      target: userStatsTable.userId,
      set: updateData,
    })
    .returning();
  res.json(toApiStats(stats));
});

router.post("/stats/:user_id/discipline", async (req, res) => {
  const { user_id } = RecalculateDisciplineParams.parse(req.params);

  // Get current stats
  const [stats] = await db
    .select()
    .from(userStatsTable)
    .where(eq(userStatsTable.userId, user_id));

  // Get last 30 days activity
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const activity = await db
    .select()
    .from(dailyActivityTable)
    .where(
      and(
        eq(dailyActivityTable.userId, user_id),
        gte(dailyActivityTable.date, thirtyDaysAgoStr)
      )
    );

  const today = new Date().toISOString().split("T")[0];
  const lastActive = stats?.lastActiveDate;
  const daysSinceActive = lastActive
    ? Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Today's task counts
  const totalTasks = await db.select().from(tasksTable).where(eq(tasksTable.userId, user_id));
  const todayTasks = totalTasks.filter(t => t.dueDate === today);
  const todayCompleted = todayTasks.filter(t => t.completed).length;
  const todayTotal = todayTasks.length;

  const currentScore = stats?.disciplineScore ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;

  const newScore = calculateDisciplineScore(
    currentScore,
    todayCompleted,
    todayTotal,
    currentStreak,
    daysSinceActive
  );

  // Calculate streak
  let newStreak = currentStreak;
  if (todayCompleted > 0 && lastActive !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    newStreak = lastActive === yesterdayStr ? currentStreak + 1 : 1;
  }

  const longestStreak = Math.max(stats?.longestStreak ?? 0, newStreak);

  // Weekly completion
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
  const weekActivity = activity.filter(a => a.date >= sevenDaysAgoStr);
  const weekCompleted = weekActivity.reduce((s, a) => s + a.tasksCompleted, 0);
  const weekTotal = weekActivity.reduce((s, a) => s + a.tasksTotal, 0);
  const weeklyCompletionPct = weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0;

  const weeklyChange = newScore - currentScore;
  const momentumScore = Math.min(100, newStreak * 2 + weeklyCompletionPct * 0.5 + newScore * 0.3);
  const level = calculateLevel(newScore);

  const [updated] = await db
    .insert(userStatsTable)
    .values({
      userId: user_id,
      disciplineScore: newScore,
      weeklyChange,
      currentStreak: newStreak,
      longestStreak,
      totalTasksCompleted: stats?.totalTasksCompleted ?? 0,
      weeklyCompletionPct,
      level,
      momentumScore,
      lastActiveDate: todayCompleted > 0 ? today : lastActive ?? null,
    })
    .onConflictDoUpdate({
      target: userStatsTable.userId,
      set: {
        disciplineScore: newScore,
        weeklyChange,
        currentStreak: newStreak,
        longestStreak,
        weeklyCompletionPct,
        level,
        momentumScore,
        lastActiveDate: todayCompleted > 0 ? today : lastActive ?? null,
      },
    })
    .returning();

  res.json({
    discipline_score: updated.disciplineScore,
    level: updated.level,
    weekly_change: updated.weeklyChange,
    momentum_score: updated.momentumScore,
    current_streak: updated.currentStreak,
  });
});

export default router;
