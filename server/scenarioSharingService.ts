import { getDb } from "./db";
import { scenarioShares, scenarioComments, users, whatIfScenarios } from "../drizzle/schema";
import { eq, and, or } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Share a scenario with another user
 */
export async function shareScenario(
  scenarioId: number,
  sharedBy: number,
  sharedWith: number,
  permission: "view" | "edit" | "admin"
): Promise<{ success: boolean; shareId?: number }> {
  const db = await getDb();
  if (!db) return { success: false };

  try {
    // Check if already shared
    const existing = await db
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
      await db
        .update(scenarioShares)
        .set({ permission })
        .where(eq(scenarioShares.id, existing[0]!.id));
      
      return { success: true, shareId: existing[0]!.id };
    }

    // Create new share
    const result = await db.insert(scenarioShares).values({
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
  const db = await getDb();
  if (!db) return false;

  try {
    await db
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
  const db = await getDb();
  if (!db) return [];

  try {
    const shares = await db
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
  const db = await getDb();
  if (!db) return [];

  try {
    const scenarios = await db
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
  const db = await getDb();
  if (!db) return { hasAccess: false };

  try {
    // Check if user owns the scenario (via project ownership or direct creation)
    const scenario = await db
      .select()
      .from(whatIfScenarios)
      .where(eq(whatIfScenarios.id, scenarioId))
      .limit(1);

    if (scenario.length === 0) {
      return { hasAccess: false };
    }

    // Check if shared with user
    const share = await db
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
 * Add comment to scenario
 */
export async function addScenarioComment(
  scenarioId: number,
  userId: number,
  comment: string
): Promise<{ success: boolean; commentId?: number }> {
  const db = await getDb();
  if (!db) return { success: false };

  try {
    const result = await db.insert(scenarioComments).values({
      scenarioId,
      userId,
      comment,
    });

    return { success: true, commentId: result[0].insertId };
  } catch (error) {
    console.error("Failed to add comment:", error);
    return { success: false };
  }
}

/**
 * Get all comments for a scenario
 */
export async function getScenarioComments(scenarioId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const comments = await db
      .select({
        id: scenarioComments.id,
        comment: scenarioComments.comment,
        createdAt: scenarioComments.createdAt,
        updatedAt: scenarioComments.updatedAt,
        userId: scenarioComments.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(scenarioComments)
      .leftJoin(users, eq(scenarioComments.userId, users.id))
      .where(eq(scenarioComments.scenarioId, scenarioId))
      .orderBy(scenarioComments.createdAt);

    return comments;
  } catch (error) {
    console.error("Failed to get comments:", error);
    return [];
  }
}

/**
 * Delete comment
 */
export async function deleteScenarioComment(
  commentId: number,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Only allow user to delete their own comments
    await db
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
  const db = await getDb();
  if (!db) return [];

  try {
    const members = await db
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
