import { getDb } from "./db";
import { notifications, notificationPreferences } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getNotificationsByUser(userId: number, unreadOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  if (unreadOnly) {
    return await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)))
      .orderBy(desc(notifications.createdAt));
  }

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));

  return result.length;
}

export async function markAsRead(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: 1, readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notifications)
    .set({ isRead: 1, readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, 0)));
}

export async function deleteNotification(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const prefs = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  return prefs.length > 0 ? prefs[0] : null;
}

export async function updateUserPreferences(
  userId: number,
  preferences: Partial<typeof notificationPreferences.$inferInsert>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserPreferences(userId);

  if (existing) {
    await db
      .update(notificationPreferences)
      .set(preferences)
      .where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values({
      userId,
      ...preferences,
    });
  }
}
