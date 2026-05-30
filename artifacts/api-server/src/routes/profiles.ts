import { Router } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetProfileParams, UpsertProfileParams, UpsertProfileBody } from "@workspace/api-zod";

const router = Router();

function toApiProfile(p: typeof profilesTable.$inferSelect) {
  return {
    user_id: p.userId,
    full_name: p.fullName ?? null,
    email: p.email ?? null,
    avatar_url: p.avatarUrl ?? null,
    timezone: p.timezone ?? "UTC",
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

router.get("/profiles/:user_id", async (req, res) => {
  const { user_id } = GetProfileParams.parse(req.params);
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, user_id));
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(toApiProfile(profile));
});

router.put("/profiles/:user_id", async (req, res) => {
  const { user_id } = UpsertProfileParams.parse(req.params);
  const body = UpsertProfileBody.parse(req.body);
  const updateData: Record<string, unknown> = { userId: user_id };
  if (body.full_name !== undefined) updateData.fullName = body.full_name;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.avatar_url !== undefined) updateData.avatarUrl = body.avatar_url;
  if (body.timezone !== undefined) updateData.timezone = body.timezone;

  const [profile] = await db
    .insert(profilesTable)
    .values({ userId: user_id, ...updateData })
    .onConflictDoUpdate({
      target: profilesTable.userId,
      set: updateData,
    })
    .returning();
  res.json(toApiProfile(profile));
});

export default router;
