import { Router } from "express";
import { db, tasksTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  ListTasksQueryParams,
  CreateTaskBody,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
  CompleteTaskParams,
  CompleteTaskBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/tasks", async (req, res) => {
  const query = ListTasksQueryParams.parse(req.query);
  const conditions = [eq(tasksTable.userId, query.user_id)];
  if (query.date) conditions.push(eq(tasksTable.dueDate, query.date));
  if (query.completed !== undefined && query.completed !== null) {
    conditions.push(eq(tasksTable.completed, query.completed));
  }
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(and(...conditions))
    .orderBy(desc(tasksTable.createdAt));
  res.json(tasks.map(toApiTask));
});

router.post("/tasks", async (req, res) => {
  const body = CreateTaskBody.parse(req.body);
  const [task] = await db
    .insert(tasksTable)
    .values({
      userId: body.user_id,
      title: body.title,
      description: body.description ?? null,
      dueDate: body.due_date ?? null,
      priority: body.priority ?? "medium",
    })
    .returning();
  res.status(201).json(toApiTask(task));
});

router.patch("/tasks/:id", async (req, res) => {
  const { id } = UpdateTaskParams.parse(req.params);
  const body = UpdateTaskBody.parse(req.body);
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.due_date !== undefined) updates.dueDate = body.due_date;
  if (body.priority !== undefined) updates.priority = body.priority;
  const [task] = await db
    .update(tasksTable)
    .set(updates)
    .where(eq(tasksTable.id, id))
    .returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.json(toApiTask(task));
});

router.delete("/tasks/:id", async (req, res) => {
  const { id } = DeleteTaskParams.parse(req.params);
  await db.delete(tasksTable).where(eq(tasksTable.id, id));
  res.status(204).send();
});

router.patch("/tasks/:id/complete", async (req, res) => {
  const { id } = CompleteTaskParams.parse(req.params);
  const body = CompleteTaskBody.parse(req.body);
  const [task] = await db
    .update(tasksTable)
    .set({
      completed: body.completed,
      completedAt: body.completed ? new Date() : null,
    })
    .where(eq(tasksTable.id, id))
    .returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.json(toApiTask(task));
});

function toApiTask(t: typeof tasksTable.$inferSelect) {
  return {
    id: t.id,
    user_id: t.userId,
    title: t.title,
    description: t.description ?? null,
    completed: t.completed,
    completed_at: t.completedAt?.toISOString() ?? null,
    due_date: t.dueDate ?? null,
    priority: t.priority ?? null,
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
  };
}

export default router;
