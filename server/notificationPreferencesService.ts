/**
 * Notification Preferences Service
 * Manages user notification preferences and thresholds
 */

import { getDb } from "./db";
import { notificationPreferences } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface NotificationPreferencesInput {
  aiAlerts?: boolean;
  deadlineWarnings?: boolean;
  budgetAlerts?: boolean;
  projectDelays?: boolean;
  taskOverdue?: boolean;
  orderPending?: boolean;
  systemNotifications?: boolean;
  deadlineWarningDays?: number;
  budgetThreshold?: number;
}

/**
 * Get user notification preferences
 * Creates default preferences if they don't exist
 */
export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Try to get existing preferences
  const existing = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create default preferences
  const result = await db.insert(notificationPreferences).values({
    userId,
    aiAlerts: 1,
    deadlineWarnings: 1,
    budgetAlerts: 1,
    projectDelays: 1,
    taskOverdue: 1,
    orderPending: 1,
    systemNotifications: 1,
    deadlineWarningDays: 7,
    budgetThreshold: 90,
  });

  // Return the created preferences
  const created = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  return created[0];
}

/**
 * Update user notification preferences
 */
export async function updateUserPreferences(
  userId: number,
  preferences: NotificationPreferencesInput
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Ensure preferences exist
  await getUserPreferences(userId);

  // Convert boolean to int for database
  const dbPreferences: any = {};

  if (preferences.aiAlerts !== undefined) {
    dbPreferences.aiAlerts = preferences.aiAlerts ? 1 : 0;
  }
  if (preferences.deadlineWarnings !== undefined) {
    dbPreferences.deadlineWarnings = preferences.deadlineWarnings ? 1 : 0;
  }
  if (preferences.budgetAlerts !== undefined) {
    dbPreferences.budgetAlerts = preferences.budgetAlerts ? 1 : 0;
  }
  if (preferences.projectDelays !== undefined) {
    dbPreferences.projectDelays = preferences.projectDelays ? 1 : 0;
  }
  if (preferences.taskOverdue !== undefined) {
    dbPreferences.taskOverdue = preferences.taskOverdue ? 1 : 0;
  }
  if (preferences.orderPending !== undefined) {
    dbPreferences.orderPending = preferences.orderPending ? 1 : 0;
  }
  if (preferences.systemNotifications !== undefined) {
    dbPreferences.systemNotifications = preferences.systemNotifications ? 1 : 0;
  }
  if (preferences.deadlineWarningDays !== undefined) {
    dbPreferences.deadlineWarningDays = preferences.deadlineWarningDays;
  }
  if (preferences.budgetThreshold !== undefined) {
    dbPreferences.budgetThreshold = preferences.budgetThreshold;
  }

  // Update preferences
  await db
    .update(notificationPreferences)
    .set(dbPreferences)
    .where(eq(notificationPreferences.userId, userId));

  // Return updated preferences
  return await getUserPreferences(userId);
}

/**
 * Reset user preferences to defaults
 */
export async function resetUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(notificationPreferences)
    .set({
      aiAlerts: 1,
      deadlineWarnings: 1,
      budgetAlerts: 1,
      projectDelays: 1,
      taskOverdue: 1,
      orderPending: 1,
      systemNotifications: 1,
      deadlineWarningDays: 7,
      budgetThreshold: 90,
    })
    .where(eq(notificationPreferences.userId, userId));

  return await getUserPreferences(userId);
}

/**
 * Check if user should receive a specific notification type
 */
export async function shouldNotifyUser(
  userId: number,
  notificationType: string
): Promise<boolean> {
  const prefs = await getUserPreferences(userId);

  switch (notificationType) {
    case "ai_alert":
      return prefs.aiAlerts === 1;
    case "deadline_warning":
      return prefs.deadlineWarnings === 1;
    case "budget_exceeded":
      return prefs.budgetAlerts === 1;
    case "project_delayed":
      return prefs.projectDelays === 1;
    case "task_overdue":
      return prefs.taskOverdue === 1;
    case "order_pending":
      return prefs.orderPending === 1;
    case "system":
      return prefs.systemNotifications === 1;
    default:
      return true; // Default to sending if type is unknown
  }
}

/**
 * Get user's deadline warning threshold in days
 */
export async function getDeadlineWarningDays(userId: number): Promise<number> {
  const prefs = await getUserPreferences(userId);
  return prefs.deadlineWarningDays;
}

/**
 * Get user's budget alert threshold percentage
 */
export async function getBudgetThreshold(userId: number): Promise<number> {
  const prefs = await getUserPreferences(userId);
  return prefs.budgetThreshold;
}
