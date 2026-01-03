/**
 * Database operations for mentions
 */

import { getDb } from "./db";
import { commentMentions, users, scenarioComments } from "../drizzle/schema";
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(commentMentions).values(data);
  // Get the created mention
  const result = await db.select().from(commentMentions)
    .where(and(
      eq(commentMentions.commentId, data.commentId),
      eq(commentMentions.mentionedUserId, data.mentionedUserId),
      eq(commentMentions.mentionedBy, data.mentionedBy)
    ))
    .orderBy(desc(commentMentions.id))
    .limit(1);
  return result[0];
}

/**
 * Create multiple mentions at once
 */
export async function createMentions(mentions: CreateMentionData[]) {
  if (mentions.length === 0) return [];
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(commentMentions).values(mentions);
  // Return empty array as MySQL doesn't support returning
  return [];
}

/**
 * Get all mentions for a specific comment
 */
export async function getMentionsForComment(commentId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: commentMentions.id,
      commentId: commentMentions.commentId,
      mentionedUserId: commentMentions.mentionedUserId,
      mentionedBy: commentMentions.mentionedBy,
      scenarioId: commentMentions.scenarioId,
      isRead: commentMentions.isRead,
      createdAt: commentMentions.createdAt,
      mentionedUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(commentMentions)
    .leftJoin(users, eq(commentMentions.mentionedUserId, users.id))
    .where(eq(commentMentions.commentId, commentId))
    .orderBy(desc(commentMentions.createdAt));
}

/**
 * Get all mentions for a user
 */
export async function getUserMentions(
  userId: number,
  limit: number = 20,
  offset: number = 0,
  unreadOnly: boolean = false
) {
  const db = await getDb();
  if (!db) return [];
  let query = db
    .select({
      id: commentMentions.id,
      commentId: commentMentions.commentId,
      mentionedUserId: commentMentions.mentionedUserId,
      mentionedBy: commentMentions.mentionedBy,
      scenarioId: commentMentions.scenarioId,
      isRead: commentMentions.isRead,
      createdAt: commentMentions.createdAt,
      mentionedByUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
      comment: {
        id: scenarioComments.id,
        comment: scenarioComments.comment,
        createdAt: scenarioComments.createdAt,
      },
    })
    .from(commentMentions)
    .leftJoin(users, eq(commentMentions.mentionedBy, users.id))
    .leftJoin(scenarioComments, eq(commentMentions.commentId, scenarioComments.id))
    .where(eq(commentMentions.mentionedUserId, userId))
    .$dynamic();

  if (unreadOnly) {
    query = query.where(
      and(
        eq(commentMentions.mentionedUserId, userId),
        eq(commentMentions.isRead, false)
      )
    );
  }

  return await query
    .orderBy(desc(commentMentions.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Mark a mention as read
 */
export async function markMentionAsRead(mentionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(commentMentions)
    .set({ isRead: true })
    .where(eq(commentMentions.id, mentionId));
}

/**
 * Mark all mentions for a user as read
 */
export async function markAllMentionsAsRead(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(commentMentions)
    .set({ isRead: true })
    .where(eq(commentMentions.mentionedUserId, userId));
}

/**
 * Get count of unread mentions for a user
 */
export async function getUnreadMentionsCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: commentMentions.id })
    .from(commentMentions)
    .where(
      and(
        eq(commentMentions.mentionedUserId, userId),
        eq(commentMentions.isRead, false)
      )
    );

  return result.length;
}

/**
 * Delete mentions for a comment (when comment is deleted)
 */
export async function deleteMentionsForComment(commentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(commentMentions)
    .where(eq(commentMentions.commentId, commentId));
}

/**
 * Check if a user is mentioned in a comment
 */
export async function isUserMentioned(userId: number, commentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: commentMentions.id })
    .from(commentMentions)
    .where(
      and(
        eq(commentMentions.mentionedUserId, userId),
        eq(commentMentions.commentId, commentId)
      )
    )
    .limit(1);

  return result.length > 0;
}
