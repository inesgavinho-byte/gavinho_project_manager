/**
 * Database operations for mentions
 */

import { getDb } from "./db";
import { commentMentions, users } from "../drizzle/schema";
// import { scenarioComments } from "../drizzle/schema";
// Note: scenarioComments table was removed from schema
import { eq, and, desc } from "drizzle-orm";

export interface CreateMentionData {
  commentId: number;
  mentionedUserId: number;
  mentionedBy: number;
  scenarioId: number;
}

/**
 * Create a new mention
 */
export async function createMention(data: CreateMentionData) {
  // TODO: Implement when commentMentions table is restored
  return null;
}

/**
 * Create multiple mentions
 */
export async function createMentions(mentions: CreateMentionData[]) {
  // TODO: Implement when commentMentions table is restored
  return [];
}

/**
 * Get all mentions for a comment
 */
export async function getCommentMentions(commentId: number) {
  // TODO: Implement when commentMentions table is restored
  return [];
}

/**
 * Get all mentions for a user
 */
export async function getUserMentions(userId: number) {
  // TODO: Implement when commentMentions table is restored
  return [];
}

/**
 * Delete a mention
 */
export async function deleteMention(mentionId: number): Promise<boolean> {
  // TODO: Implement when commentMentions table is restored
  return false;
}

/**
 * Mark mentions as read
 */
export async function markMentionsAsRead(mentionIds: number[]): Promise<boolean> {
  // TODO: Implement when commentMentions table is restored
  return false;
}


/**
 * Get mentions for a comment
 */
export async function getMentionsForComment(commentId: number) {
  // TODO: Implement when commentMentions table is restored
  return [];
}

/**
 * Mark mention as read (alias for markMentionsAsRead)
 */
export async function markMentionAsRead(mentionId: number): Promise<boolean> {
  return markMentionsAsRead([mentionId]);
}


/**
 * Get unread mentions count
 */
export async function getUnreadMentionsCount(userId: number): Promise<number> {
  // TODO: Implement when commentMentions table is restored
  return 0;
}

/**
 * Mark all mentions as read
 */
export async function markAllMentionsAsRead(userId: number): Promise<boolean> {
  // TODO: Implement when commentMentions table is restored
  return false;
}
