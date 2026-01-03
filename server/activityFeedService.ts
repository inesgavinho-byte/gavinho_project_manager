import { getDb } from "./db";
import { activityFeed, users } from "../drizzle/schema";
import { desc, eq, and, inArray, sql } from "drizzle-orm";

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

/**
 * Registra uma nova atividade no feed
 */
export async function logActivity(params: CreateActivityParams): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(activityFeed).values({
      userId: params.userId,
      actorId: params.actorId,
      activityType: params.activityType,
      scenarioId: params.scenarioId,
      projectId: params.projectId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
  } catch (error) {
    console.error("[ActivityFeed] Failed to log activity:", error);
  }
}

/**
 * Registra atividade para múltiplos usuários (ex: compartilhamento)
 */
export async function logActivityForUsers(
  userIds: number[],
  params: Omit<CreateActivityParams, "userId">
): Promise<void> {
  const db = await getDb();
  if (!db || userIds.length === 0) return;

  try {
    const activities = userIds.map((userId) => ({
      userId,
      actorId: params.actorId,
      activityType: params.activityType,
      scenarioId: params.scenarioId,
      projectId: params.projectId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    }));

    await db.insert(activityFeed).values(activities);
  } catch (error) {
    console.error("[ActivityFeed] Failed to log activities for users:", error);
  }
}

/**
 * Obtém atividades recentes para um usuário
 */
export async function getUserActivities(
  userId: number,
  limit: number = 50,
  offset: number = 0,
  activityTypes?: ActivityType[]
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions = [eq(activityFeed.userId, userId)];
    
    if (activityTypes && activityTypes.length > 0) {
      conditions.push(inArray(activityFeed.activityType, activityTypes));
    }

    const activities = await db
      .select({
        id: activityFeed.id,
        userId: activityFeed.userId,
        actorId: activityFeed.actorId,
        actorName: users.name,
        actorEmail: users.email,
        activityType: activityFeed.activityType,
        scenarioId: activityFeed.scenarioId,
        projectId: activityFeed.projectId,
        metadata: activityFeed.metadata,
        createdAt: activityFeed.createdAt,
      })
      .from(activityFeed)
      .leftJoin(users, eq(activityFeed.actorId, users.id))
      .where(and(...conditions))
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit)
      .offset(offset);

    return activities.map((activity) => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
    }));
  } catch (error) {
    console.error("[ActivityFeed] Failed to get user activities:", error);
    return [];
  }
}

/**
 * Obtém contagem de atividades não lidas
 */
export async function getUnreadActivityCount(
  userId: number,
  since?: Date
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const conditions = [eq(activityFeed.userId, userId)];
    
    if (since) {
      conditions.push(sql`${activityFeed.createdAt} > ${since}`);
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityFeed)
      .where(and(...conditions));

    return Number(result[0]?.count || 0);
  } catch (error) {
    console.error("[ActivityFeed] Failed to get unread count:", error);
    return 0;
  }
}

/**
 * Marca atividades como lidas (limpa atividades antigas)
 */
export async function markActivitiesAsRead(
  userId: number,
  beforeDate: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Opcionalmente, podemos adicionar um campo 'isRead' na tabela
    // Por enquanto, consideramos que o usuário "leu" ao visualizar o feed
    console.log(`[ActivityFeed] User ${userId} viewed activities before ${beforeDate}`);
  } catch (error) {
    console.error("[ActivityFeed] Failed to mark as read:", error);
  }
}
