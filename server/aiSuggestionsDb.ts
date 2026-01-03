import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { aiSuggestions, type InsertAISuggestion, type AISuggestion } from "../drizzle/schema";

/**
 * Create new AI suggestion
 */
export async function createAISuggestion(suggestion: InsertAISuggestion): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(aiSuggestions).values(suggestion);
}

/**
 * Get AI suggestions by project ID
 */
export async function getAISuggestionsByProject(projectId: number): Promise<AISuggestion[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(aiSuggestions)
    .where(eq(aiSuggestions.projectId, projectId))
    .orderBy(desc(aiSuggestions.createdAt));
}

/**
 * Get pending AI suggestions
 */
export async function getPendingAISuggestions(projectId?: number): Promise<AISuggestion[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const conditions = [eq(aiSuggestions.status, "pending")];
  if (projectId) {
    conditions.push(eq(aiSuggestions.projectId, projectId));
  }

  return await db
    .select()
    .from(aiSuggestions)
    .where(and(...conditions))
    .orderBy(desc(aiSuggestions.priority), desc(aiSuggestions.createdAt));
}

/**
 * Get AI suggestions by type
 */
export async function getAISuggestionsByType(
  type: AISuggestion["type"],
  projectId?: number
): Promise<AISuggestion[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const conditions = [eq(aiSuggestions.type, type)];
  if (projectId) {
    conditions.push(eq(aiSuggestions.projectId, projectId));
  }

  return await db
    .select()
    .from(aiSuggestions)
    .where(and(...conditions))
    .orderBy(desc(aiSuggestions.createdAt));
}

/**
 * Update AI suggestion status
 */
export async function updateAISuggestionStatus(
  id: number,
  status: AISuggestion["status"],
  userId?: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === "accepted" && userId) {
    updateData.acceptedById = userId;
    updateData.acceptedAt = new Date();
  } else if (status === "completed") {
    updateData.completedAt = new Date();
  }

  await db.update(aiSuggestions).set(updateData).where(eq(aiSuggestions.id, id));
}

/**
 * Delete AI suggestion
 */
export async function deleteAISuggestion(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(aiSuggestions).where(eq(aiSuggestions.id, id));
}

/**
 * Get AI suggestion statistics
 */
export async function getAISuggestionStats(projectId?: number): Promise<
  Array<{
    type: string;
    count: string;
    status: string;
  }>
> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const conditions = projectId ? [eq(aiSuggestions.projectId, projectId)] : [];

  return await db
    .select({
      type: aiSuggestions.type,
      status: aiSuggestions.status,
      count: sql<string>`count(*)`.as("count"),
    })
    .from(aiSuggestions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(aiSuggestions.type, aiSuggestions.status);
}

/**
 * Get critical suggestions (high/critical priority, pending status)
 */
export async function getCriticalSuggestions(): Promise<AISuggestion[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db
    .select()
    .from(aiSuggestions)
    .where(
      and(
        eq(aiSuggestions.status, "pending"),
        sql`${aiSuggestions.priority} IN ('high', 'critical')`
      )
    )
    .orderBy(desc(aiSuggestions.priority), desc(aiSuggestions.createdAt))
    .limit(10);
}
