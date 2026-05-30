import { Router } from "express";
import { db, dailyActivityTable } from "@workspace/db";
import { eq, gte, and } from "drizzle-orm";
import { FetchActivityQueryParams, RecordActivityBody } from "@workspace/api-zod";

const router = Router();

function toApiActivity(a: typeof dailyActivityTable.$inferSelect) {
  return {
    id: a.id,
    user_id: a.userId,
    date: a.date,
    tasks_completed: a.tasksCompleted,
    tasks_total: a.tasksTotal,
    discipline_delta: a.disciplineDelta,
  };
}

router.get("/activity", async (req, res) => {
  const query = FetchActivityQueryParams.parse(req.query);
  const days = query.days ?? 90;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const activity = await db
    .select()
    .from(dailyActivityTable)
    .where(
      and(
        eq(dailyActivityTable.userId, query.user_id),
        gte(dailyActivityTable.date, cutoffStr)
      )
    );
  res.json(activity.map(toApiActivity));
});

router.post("/activity", async (req, res) => {
  const body = RecordActivityBody.parse(req.body);
  const today = new Date().toISOString().split("T")[0];

  const [record] = await db
    .insert(dailyActivityTable)
    .values({
      userId: body.user_id,
      date: today,
      tasksCompleted: body.tasks_completed,
      tasksTotal: body.tasks_total,
      disciplineDelta: body.discipline_delta ?? 0,
    })
    .onConflictDoUpdate({
      target: [dailyActivityTable.userId, dailyActivityTable.date],
      set: {
        tasksCompleted: body.tasks_completed,
        tasksTotal: body.tasks_total,
        disciplineDelta: body.discipline_delta ?? 0,
      },
    })
    .returning();
  res.json(toApiActivity(record));
});

export default router;
