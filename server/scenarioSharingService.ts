import { getDb } from "./db";
import { scenarioShares, scenarioComments, users, whatIfScenarios } from "../drizzle/schema";
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
  const dbConn = await getDb();
  if (!dbConn) return { success: false };

  try {
    // Check if already shared
    const existing = await dbConn
      .select()
      .from(scenarioShares)
      .where(
        and(
          eq(scenarioShares.scenarioId, scenarioId),
          eq(scenarioShares.sharedWith, sharedWith)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing share
      await dbConn
        .update(scenarioShares)
        .set({ permission })
        .where(eq(scenarioShares.id, existing[0]!.id));
      
      return { success: true, shareId: existing[0]!.id };
    }

    // Create new share
    const result = await dbConn.insert(scenarioShares).values({
      scenarioId,
      sharedBy,
      sharedWith,
      permission,
    });

    return { success: true, shareId: result[0].insertId };
  } catch (error) {
    console.error("Failed to share scenario:", error);
    return { success: false };
  }
}

/**
 * Remove share access
 */
export async function unshareScenario(
  scenarioId: number,
  sharedWith: number
): Promise<boolean> {
  const dbConn = await getDb();
  if (!dbConn) return false;

  try {
    await dbConn
      .delete(scenarioShares)
      .where(
        and(
          eq(scenarioShares.scenarioId, scenarioId),
          eq(scenarioShares.sharedWith, sharedWith)
        )
      );
    
    return true;
  } catch (error) {
    console.error("Failed to unshare scenario:", error);
    return false;
  }
}

/**
 * Get all users a scenario is shared with
 */
export async function getScenarioShares(scenarioId: number) {
  const dbConn = await getDb();
  if (!dbConn) return [];

  try {
    const shares = await dbConn
      .select({
        id: scenarioShares.id,
        sharedWith: scenarioShares.sharedWith,
        sharedBy: scenarioShares.sharedBy,
        permission: scenarioShares.permission,
        createdAt: scenarioShares.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(scenarioShares)
      .leftJoin(users, eq(scenarioShares.sharedWith, users.id))
      .where(eq(scenarioShares.scenarioId, scenarioId));

    return shares;
  } catch (error) {
    console.error("Failed to get scenario shares:", error);
    return [];
  }
}

/**
 * Get all scenarios shared with a user
 */
export async function getScenariosSharedWithUser(userId: number) {
  const dbConn = await getDb();
  if (!dbConn) return [];

  try {
    const scenarios = await dbConn
      .select({
        scenario: whatIfScenarios,
        share: scenarioShares,
        sharedByUser: users,
      })
      .from(scenarioShares)
      .innerJoin(whatIfScenarios, eq(scenarioShares.scenarioId, whatIfScenarios.id))
      .leftJoin(users, eq(scenarioShares.sharedBy, users.id))
      .where(eq(scenarioShares.sharedWith, userId));

    return scenarios;
  } catch (error) {
    console.error("Failed to get shared scenarios:", error);
    return [];
  }
}

/**
 * Check if user has access to a scenario
 */
export async function checkScenarioAccess(
  scenarioId: number,
  userId: number
): Promise<{ hasAccess: boolean; permission?: "view" | "edit" | "admin" }> {
  const dbConn = await getDb();
  if (!dbConn) return { hasAccess: false };

  try {
    // Check if user owns the scenario (via project ownership or direct creation)
    const scenario = await dbConn
      .select()
      .from(whatIfScenarios)
      .where(eq(whatIfScenarios.id, scenarioId))
      .limit(1);

    if (scenario.length === 0) {
      return { hasAccess: false };
    }

    // Check if shared with user
    const share = await dbConn
      .select()
      .from(scenarioShares)
      .where(
        and(
          eq(scenarioShares.scenarioId, scenarioId),
          eq(scenarioShares.sharedWith, userId)
        )
      )
      .limit(1);

    if (share.length > 0) {
      return { hasAccess: true, permission: share[0]!.permission };
    }

    // TODO: Check if user owns the project (requires project ownership tracking)
    
    return { hasAccess: false };
  } catch (error) {
    console.error("Failed to check scenario access:", error);
    return { hasAccess: false };
  }
}

/**
 * Add comment to scenario (supports threads)
 */
export async function addScenarioComment(
  scenarioId: number,
  userId: number,
  comment: string,
  parentCommentId?: number
): Promise<{ success: boolean; commentId?: number }> {
  const dbConn = await getDb();
  if (!dbConn) return { success: false };

  try {
    const result = await dbConn.insert(scenarioComments).values({
      scenarioId,
      userId,
      comment,
      parentCommentId: parentCommentId || null,
    });

    // Incrementar contador de respostas do comentário pai
    if (parentCommentId) {
      await dbConn
        .update(scenarioComments)
        .set({ replyCount: sql`${scenarioComments.replyCount} + 1` })
        .where(eq(scenarioComments.id, parentCommentId));
      
      // Buscar autor do comentário pai para notificar
      const parentComment = await dbConn
        .select({ userId: scenarioComments.userId, scenarioId: scenarioComments.scenarioId })
        .from(scenarioComments)
        .where(eq(scenarioComments.id, parentCommentId))
        .limit(1);
      
      if (parentComment.length > 0 && parentComment[0]!.userId !== userId) {
        // Notificar autor do comentário pai sobre a resposta
        await logActivity({
          userId: parentComment[0]!.userId,
          actorId: userId,
          activityType: "scenario_commented",
          scenarioId: parentComment[0]!.scenarioId,
          metadata: { isReply: true, parentCommentId },
        });
      }
    }

    const commentId = result[0].insertId;

    // Process @mentions in the comment
    const mentions = mentionService.extractMentions(comment);
    if (mentions.length > 0) {
      const mentionedUsernames = mentionService.getUniqueMentionedUsernames(mentions);
      
      // Get all users to find mentioned ones
      const allUsers = await db.getAllUsers(); // Use the imported db module function
      const mentionedUsers = allUsers.filter((user: { id: number; name: string | null; email: string | null; role: string }) => {
        const username = (user.name || user.email || `user${user.id}`)
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_-]/g, "");
        return mentionedUsernames.some(m => m.toLowerCase() === username.toLowerCase());
      });

      // Create mention records
      if (mentionedUsers.length > 0) {
        const mentionRecords = mentionedUsers.map((user: { id: number; name: string | null; email: string | null; role: string }) => ({
          commentId,
          mentionedUserId: user.id,
          mentionedBy: userId,
          scenarioId,
        }));
        
        await mentionDb.createMentions(mentionRecords);

        // Create activity notifications for mentioned users
        for (const user of mentionedUsers) {
          if (user.id !== userId) {
            await logActivity({
              userId: user.id,
              actorId: userId,
              activityType: "scenario_commented",
              scenarioId,
              metadata: { isMention: true, commentId },
            });
          }
        }
      }
    }

    return { success: true, commentId };
  } catch (error) {
    console.error("Failed to add comment:", error);
    return { success: false };
  }
}

/**
 * Get all top-level comments for a scenario (no parent)
 */
export async function getScenarioComments(scenarioId: number) {
  const dbConn = await getDb();
  if (!dbConn) return [];

  try {
    const comments = await dbConn
      .select({
        id: scenarioComments.id,
        comment: scenarioComments.comment,
        parentCommentId: scenarioComments.parentCommentId,
        replyCount: scenarioComments.replyCount,
        createdAt: scenarioComments.createdAt,
        updatedAt: scenarioComments.updatedAt,
        userId: scenarioComments.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(scenarioComments)
      .leftJoin(users, eq(scenarioComments.userId, users.id))
      .where(
        and(
          eq(scenarioComments.scenarioId, scenarioId),
          isNull(scenarioComments.parentCommentId)
        )
      )
      .orderBy(scenarioComments.createdAt);

    return comments;
  } catch (error) {
    console.error("Failed to get comments:", error);
    return [];
  }
}

/**
 * Get replies to a specific comment
 */
export async function getCommentReplies(parentCommentId: number) {
  const dbConn = await getDb();
  if (!dbConn) return [];

  try {
    const replies = await dbConn
      .select({
        id: scenarioComments.id,
        comment: scenarioComments.comment,
        parentCommentId: scenarioComments.parentCommentId,
        replyCount: scenarioComments.replyCount,
        createdAt: scenarioComments.createdAt,
        updatedAt: scenarioComments.updatedAt,
        userId: scenarioComments.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(scenarioComments)
      .leftJoin(users, eq(scenarioComments.userId, users.id))
      .where(eq(scenarioComments.parentCommentId, parentCommentId))
      .orderBy(scenarioComments.createdAt);

    return replies;
  } catch (error) {
    console.error("Failed to get replies:", error);
    return [];
  }
}

/**
 * Get full comment thread (comment + all nested replies)
 */
export async function getCommentThread(commentId: number): Promise<any> {
  const dbConn = await getDb();
  if (!dbConn) return null;

  try {
    // Get the comment
    const comment = await dbConn
      .select({
        id: scenarioComments.id,
        comment: scenarioComments.comment,
        parentCommentId: scenarioComments.parentCommentId,
        replyCount: scenarioComments.replyCount,
        createdAt: scenarioComments.createdAt,
        updatedAt: scenarioComments.updatedAt,
        userId: scenarioComments.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(scenarioComments)
      .leftJoin(users, eq(scenarioComments.userId, users.id))
      .where(eq(scenarioComments.id, commentId))
      .limit(1);

    if (comment.length === 0) return null;

    // Get all replies
    const replies = await getCommentReplies(commentId);

    return {
      ...comment[0],
      replies,
    };
  } catch (error) {
    console.error("Failed to get comment thread:", error);
    return null;
  }
}

/**
 * Delete comment
 */
export async function deleteScenarioComment(
  commentId: number,
  userId: number
): Promise<boolean> {
  const dbConn = await getDb();
  if (!dbConn) return false;

  try {
    // Only allow user to delete their own comments
    await dbConn
      .delete(scenarioComments)
      .where(
        and(
          eq(scenarioComments.id, commentId),
          eq(scenarioComments.userId, userId)
        )
      );
    
    return true;
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return false;
  }
}

/**
 * Get all team members (users) for sharing
 */
export async function getTeamMembers() {
  const dbConn = await getDb();
  if (!dbConn) return [];

  try {
    const members = await dbConn
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users);

    return members;
  } catch (error) {
    console.error("Failed to get team members:", error);
    return [];
  }
}
