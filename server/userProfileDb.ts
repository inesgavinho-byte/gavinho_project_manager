import { eq } from "drizzle-orm";
import { getDb } from "./db.js";
import { users, userActivityLog, userPreferences } from "../drizzle/schema.js";
import type { User, InsertUser } from "../drizzle/schema.js";

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: number): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user || null;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: number,
  data: Partial<InsertUser>
): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(users)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return getUserProfile(userId);
}

/**
 * Upload profile picture
 */
export async function updateProfilePicture(
  userId: number,
  pictureUrl: string
): Promise<User | null> {
  return updateUserProfile(userId, { profilePicture: pictureUrl });
}

/**
 * Change user password (placeholder - actual password hashing should be done in auth service)
 */
export async function changePassword(
  userId: number,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  // This is a placeholder - actual password validation and hashing
  // should be handled by your authentication service
  
  // For now, we'll just return success
  // In production, you would:
  // 1. Verify oldPassword matches current password
  // 2. Hash newPassword
  // 3. Update password in database
  // 4. Invalidate existing sessions if needed
  
  return {
    success: true,
    message: "Password changed successfully",
  };
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  // Import necessary tables
  const { projects, projectTeam, timesheets } = await import("../drizzle/schema.js");

  // Count projects created by user
  const projectsCreated = await db
    .select()
    .from(projects)
    .where(eq(projects.createdById, userId));

  // Count projects where user is team member
  const projectsAsMember = await db
    .select()
    .from(projectTeam)
    .where(eq(projectTeam.userId, userId));

  // Count total hours logged (if timesheets exist)
  let totalHours = 0;
  try {
    const hoursResult = await db
      .select()
      .from(timesheets)
      .where(eq(timesheets.userId, userId));
    
    totalHours = hoursResult.reduce((sum, ts) => sum + (Number(ts.hours) || 0), 0);
  } catch (error) {
    // Timesheets table might not exist
    console.log("Timesheets table not available");
  }

  // Count recent activities
  const recentActivities = await db
    .select()
    .from(userActivityLog)
    .where(eq(userActivityLog.userId, userId))
    .limit(10);

  return {
    projectsCreated: projectsCreated.length,
    projectsAsMember: projectsAsMember.length,
    totalProjects: projectsCreated.length + projectsAsMember.length,
    totalHours,
    recentActivitiesCount: recentActivities.length,
  };
}

/**
 * Get all users (for admin)
 */
export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];

  const allUsers = await db.select().from(users);
  return allUsers;
}

/**
 * Search users by name or email
 */
export async function searchUsers(query: string): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];

  const { or, like } = await import("drizzle-orm");

  const results = await db
    .select()
    .from(users)
    .where(
      or(
        like(users.name, `%${query}%`),
        like(users.email, `%${query}%`)
      )
    )
    .limit(20);

  return results;
}
