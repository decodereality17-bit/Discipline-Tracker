import { Router } from "express";
import { db, goalsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListGoalsQueryParams,
  CreateGoalBody,
  UpdateGoalParams,
  UpdateGoalBody,
  DeleteGoalParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/goals", async (req, res) => {
  const query = ListGoalsQueryParams.parse(req.query);
  const conditions = [eq(goalsTable.userId, query.user_id)];
  if (query.status) conditions.push(eq(goalsTable.status, query.status));
  const goals = await db
    .select()
    .from(goalsTable)
    .where(and(...conditions))
    .orderBy(goalsTable.createdAt);
  res.json(goals.map(toApiGoal));
});

router.post("/goals", async (req, res) => {
  const body = CreateGoalBody.parse(req.body);
  const [goal] = await db
    .insert(goalsTable)
    .values({
      userId: body.user_id,
      title: body.title,
      description: body.description ?? null,
      category: body.category ?? "general",
      targetDate: body.target_date ?? null,
    })
    .returning();
  res.status(201).json(toApiGoal(goal));
});

router.patch("/goals/:id", async (req, res) => {
  const { id } = UpdateGoalParams.parse(req.params);
  const body = UpdateGoalBody.parse(req.body);
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.category !== undefined) updates.category = body.category;
  if (body.status !== undefined) updates.status = body.status;
  if (body.progress !== undefined) updates.progress = body.progress;
  if (body.target_date !== undefined) updates.targetDate = body.target_date;
  const [goal] = await db
    .update(goalsTable)
    .set(updates)
    .where(eq(goalsTable.id, id))
    .returning();
  if (!goal) { res.status(404).json({ error: "Goal not found" }); return; }
  res.json(toApiGoal(goal));
});

router.delete("/goals/:id", async (req, res) => {
  const { id } = DeleteGoalParams.parse(req.params);
  await db.delete(goalsTable).where(eq(goalsTable.id, id));
  res.status(204).send();
});

function toApiGoal(g: typeof goalsTable.$inferSelect) {
  return {
    id: g.id,
    user_id: g.userId,
    title: g.title,
    description: g.description ?? null,
    category: g.category,
    status: g.status,
    progress: g.progress,
    target_date: g.targetDate ?? null,
    created_at: g.createdAt.toISOString(),
    updated_at: g.updatedAt.toISOString(),
  };
}

export default router;
