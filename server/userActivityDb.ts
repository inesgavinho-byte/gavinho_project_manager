import { eq, desc } from "drizzle-orm";
import { getDb } from "./db.js";
import { userActivityLog } from "../drizzle/schema.js";
import type { UserActivityLog, InsertUserActivityLog } from "../drizzle/schema.js";

/**
 * Log a user activity
 */
export async function logUserActivity(
  data: Omit<InsertUserActivityLog, "id" | "createdAt">
): Promise<UserActivityLog | null> {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db
    .insert(userActivityLog)
    .values({
      ...data,
      createdAt: new Date(),
    });

  if (!result.insertId) return null;

  return getUserActivity(Number(result.insertId));
}

/**
 * Get a single activity by ID
 */
export async function getUserActivity(activityId: number): Promise<UserActivityLog | null> {
  const db = await getDb();
  if (!db) return null;

  const [activity] = await db
    .select()
    .from(userActivityLog)
    .where(eq(userActivityLog.id, activityId))
    .limit(1);

  return activity || null;
}

/**
 * Get user activities with pagination
 */
export async function getUserActivities(
  userId: number,
  options: {
    limit?: number;
    offset?: number;
    actionType?: string;
  } = {}
): Promise<UserActivityLog[]> {
  const db = await getDb();
  if (!db) return [];

  const { limit = 50, offset = 0, actionType } = options;

  let query = db
    .select()
    .from(userActivityLog)
    .where(eq(userActivityLog.userId, userId))
    .orderBy(desc(userActivityLog.createdAt))
    .limit(limit)
    .offset(offset);

  // Add action type filter if provided
  if (actionType) {
    const { and } = await import("drizzle-orm");
    query = db
      .select()
      .from(userActivityLog)
      .where(
        and(
          eq(userActivityLog.userId, userId),
          eq(userActivityLog.actionType, actionType)
        )
      )
      .orderBy(desc(userActivityLog.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return query;
}

/**
 * Get recent activities across all users (for admin)
 */
export async function getRecentActivities(limit: number = 50): Promise<UserActivityLog[]> {
  const db = await getDb();
  if (!db) return [];

  const activities = await db
    .select()
    .from(userActivityLog)
    .orderBy(desc(userActivityLog.createdAt))
    .limit(limit);

  return activities;
}

/**
 * Get activity count by type for a user
 */
export async function getActivityCountByType(userId: number): Promise<Record<string, number>> {
  const db = await getDb();
  if (!db) return {};

  const activities = await db
    .select()
    .from(userActivityLog)
    .where(eq(userActivityLog.userId, userId));

  // Group by action type
  const counts: Record<string, number> = {};
  activities.forEach((activity) => {
    const type = activity.actionType;
    counts[type] = (counts[type] || 0) + 1;
  });

  return counts;
}

/**
 * Delete old activities (cleanup)
 */
export async function deleteOldActivities(daysToKeep: number = 90): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const { lt } = await import("drizzle-orm");
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await db
    .delete(userActivityLog)
    .where(lt(userActivityLog.createdAt, cutoffDate));

  return 0; // Return 0 for now, actual count would require checking result
}

// Helper function to log common activities
export async function logActivity(
  userId: number,
  actionType: string,
  description: string,
  entityType?: string,
  entityId?: number,
  metadata?: any
): Promise<void> {
  await logUserActivity({
    userId,
    actionType,
    description,
    entityType: entityType || null,
    entityId: entityId || null,
    metadata: metadata || null,
  });
}
