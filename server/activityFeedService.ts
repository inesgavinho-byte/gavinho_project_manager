import { desc, eq, and, inArray, sql } from "drizzle-orm";
// // import { activityFeed, users } from "../drizzle/schema" (table removed);
// Note: activityFeed table was removed from schema

export type ActivityType =
  | "scenario_created"
  | "scenario_updated"
  | "scenario_shared"
  | "scenario_commented"
  | "scenario_favorited"
  | "scenario_deleted";

export interface CreateActivityParams {
  userId: number; // Quem vai receber a notificação
  actorId: number; // Quem realizou a ação
  activityType: ActivityType;
  scenarioId?: number;
  projectId?: number;
  metadata?: Record<string, any>;
}

export interface ActivityFeedItem {
  id: number;
  userId: number;
  actorId: number;
  activityType: ActivityType;
  scenarioId?: number;
  projectId?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Log an activity
 */
export async function logActivity(params: CreateActivityParams): Promise<void> {
  // TODO: Implement when activityFeed table is restored
}

/**
 * Get activity feed for a user
 */
export async function getActivityFeed(userId: number, limit: number = 50): Promise<ActivityFeedItem[]> {
  // TODO: Implement when activityFeed table is restored
  return [];
}

/**
 * Get recent activities
 */
export async function getRecentActivities(limit: number = 50): Promise<ActivityFeedItem[]> {
  // TODO: Implement when activityFeed table is restored
  return [];
}

/**
 * Delete an activity
 */
export async function deleteActivity(id: number): Promise<void> {
  // TODO: Implement when activityFeed table is restored
}


/**
 * Get user activities
 */
export async function getUserActivities(userId: number, limit?: number): Promise<ActivityFeedItem[]> {
  // TODO: Implement user activities retrieval
  return [];
}

/**
 * Get unread activity count
 */
export async function getUnreadActivityCount(userId: number): Promise<number> {
  // TODO: Implement unread activity count
  return 0;
}

/**
 * Mark activities as read
 */
export async function markActivitiesAsRead(activityIds: number[]): Promise<void> {
  // TODO: Implement mark activities as read
}
