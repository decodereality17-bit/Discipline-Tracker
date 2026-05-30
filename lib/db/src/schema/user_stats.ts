import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userStatsTable = pgTable("user_stats", {
  userId: text("user_id").primaryKey(),
  disciplineScore: real("discipline_score").notNull().default(0),
  weeklyChange: real("weekly_change").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalTasksCompleted: integer("total_tasks_completed").notNull().default(0),
  weeklyCompletionPct: real("weekly_completion_pct").notNull().default(0),
  level: text("level").notNull().default("Beginner"),
  momentumScore: real("momentum_score").notNull().default(0),
  lastActiveDate: text("last_active_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserStatsSchema = createInsertSchema(userStatsTable);
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStatsTable.$inferSelect;
