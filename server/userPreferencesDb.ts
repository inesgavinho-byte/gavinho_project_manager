import { eq } from "drizzle-orm";
import { getDb } from "./db.js";
import { userPreferences } from "../drizzle/schema.js";
import type { UserPreferences, InsertUserPreferences } from "../drizzle/schema.js";

/**
 * Get user preferences by user ID
 */
export async function getUserPreferences(userId: number): Promise<UserPreferences | null> {
  const db = await getDb();
  if (!db) return null;

  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return prefs || null;
}

/**
 * Create default preferences for a new user
 */
export async function createDefaultPreferences(userId: number): Promise<UserPreferences | null> {
  const db = await getDb();
  if (!db) return null;

  // Check if preferences already exist
  const existing = await getUserPreferences(userId);
  if (existing) return existing;

  const [result] = await db
    .insert(userPreferences)
    .values({
      userId,
      emailNotifications: 1,
      pushNotifications: 1,
      notificationFrequency: "realtime",
      theme: "light",
      language: "pt",
      timezone: "Europe/Lisbon",
      dateFormat: "DD/MM/YYYY",
      defaultView: "dashboard",
      showCompletedProjects: 1,
      projectsPerPage: 12,
    });

  if (!result.insertId) return null;

  return getUserPreferences(userId);
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: number,
  data: Partial<InsertUserPreferences>
): Promise<UserPreferences | null> {
  const db = await getDb();
  if (!db) return null;

  // Ensure preferences exist
  const existing = await getUserPreferences(userId);
  if (!existing) {
    return createDefaultPreferences(userId);
  }

  await db
    .update(userPreferences)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(userPreferences.userId, userId));

  return getUserPreferences(userId);
}

/**
 * Get or create user preferences (ensures preferences always exist)
 */
export async function getOrCreateUserPreferences(userId: number): Promise<UserPreferences | null> {
  const existing = await getUserPreferences(userId);
  if (existing) return existing;

  return createDefaultPreferences(userId);
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: number,
  settings: {
    emailNotifications?: number;
    pushNotifications?: number;
    notificationFrequency?: "realtime" | "hourly" | "daily" | "weekly";
  }
): Promise<UserPreferences | null> {
  return updateUserPreferences(userId, settings);
}

/**
 * Update display preferences
 */
export async function updateDisplayPreferences(
  userId: number,
  settings: {
    theme?: "light" | "dark" | "auto";
    language?: string;
    timezone?: string;
    dateFormat?: string;
  }
): Promise<UserPreferences | null> {
  return updateUserPreferences(userId, settings);
}

/**
 * Update dashboard preferences
 */
export async function updateDashboardPreferences(
  userId: number,
  settings: {
    defaultView?: string;
    showCompletedProjects?: number;
    projectsPerPage?: number;
  }
): Promise<UserPreferences | null> {
  return updateUserPreferences(userId, settings);
}

/**
 * Reset preferences to defaults
 */
export async function resetPreferencesToDefaults(userId: number): Promise<UserPreferences | null> {
  const db = await getDb();
  if (!db) return null;

  await db
    .delete(userPreferences)
    .where(eq(userPreferences.userId, userId));

  return createDefaultPreferences(userId);
}
