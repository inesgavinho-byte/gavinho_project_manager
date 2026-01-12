import { getDb } from "./db";
import { users } from "../drizzle/schema";
// import { scenarioShares, scenarioComments } from "../drizzle/schema";
// Note: scenarioShares and scenarioComments tables were removed from schema

import { eq, and, or, isNull, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { logActivity } from "./activityFeedService";
import * as mentionService from "./mentionService";
import * as mentionDb from "./mentionDb";
import * as db from "./db";

/**
 * Share a scenario with another user
 */
export async function shareScenario(
  scenarioId: number,
  sharedBy: number,
  sharedWith: number,
  permission: "view" | "edit" | "admin"
): Promise<{ success: boolean; shareId?: number }> {
  // TODO: Implement when scenarioShares table is restored
  return { success: false };
}

/**
 * Remove share access
 */
export async function unshareScenario(
  scenarioId: number,
  sharedWith: number
): Promise<boolean> {
  // TODO: Implement when scenarioShares table is restored
  return false;
}

/**
 * Get all users a scenario is shared with
 */
export async function getScenarioShares(scenarioId: number) {
  // TODO: Implement when scenarioShares table is restored
  return [];
}

/**
 * Add comment to a scenario
 */
export async function addComment(
  scenarioId: number,
  userId: number,
  comment: string,
  parentCommentId?: number
): Promise<{ success: boolean; commentId?: number }> {
  // TODO: Implement when scenarioComments table is restored
  return { success: false };
}

/**
 * Get all top-level comments for a scenario (no parent)
 */
export async function getScenarioComments(scenarioId: number) {
  // TODO: Implement when scenarioComments table is restored
  return [];
}

/**
 * Get all replies to a comment
 */
export async function getCommentReplies(parentCommentId: number) {
  // TODO: Implement when scenarioComments table is restored
  return [];
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: number): Promise<boolean> {
  // TODO: Implement when scenarioComments table is restored
  return false;
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: number,
  comment: string
): Promise<boolean> {
  // TODO: Implement when scenarioComments table is restored
  return false;
}

/**
 * Like/Unlike a comment
 */
export async function toggleCommentLike(
  commentId: number,
  userId: number
): Promise<boolean> {
  // TODO: Implement when scenarioComments table is restored
  return false;
}

/**
 * Get comment likes count
 */
export async function getCommentLikesCount(commentId: number): Promise<number> {
  // TODO: Implement when scenarioComments table is restored
  return 0;
}
