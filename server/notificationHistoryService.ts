/**
 * Notification History Service
 * Provides advanced filtering and analytics for notification history
 */

import { getDb } from "./db";
import { notifications, projects } from "../drizzle/schema";
import { eq, and, gte, lte, isNull, sql, desc, or } from "drizzle-orm";

export interface NotificationFilters {
  type?: string[];
  priority?: string[];
  projectId?: number;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface NotificationHistoryStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byProject: Array<{ projectId: number; projectName: string; count: number }>;
}

/**
 * Get notifications with advanced filters
 */
export async function getFilteredNotifications(
  userId: number,
  filters: NotificationFilters
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let query = db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      type: notifications.type,
      priority: notifications.priority,
      title: notifications.title,
      message: notifications.message,
      link: notifications.link,
      projectId: notifications.projectId,
      taskId: notifications.taskId,
      isRead: notifications.isRead,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      projectName: projects.name,
    })
    .from(notifications)
    .leftJoin(projects, eq(notifications.projectId, projects.id))
    .where(eq(notifications.userId, userId))
    .$dynamic();

  // Apply filters
  const conditions: any[] = [eq(notifications.userId, userId)];

  if (filters.type && filters.type.length > 0) {
    conditions.push(
      or(...filters.type.map((t) => eq(notifications.type, t as any)))
    );
  }

  if (filters.priority && filters.priority.length > 0) {
    conditions.push(
      or(...filters.priority.map((p) => eq(notifications.priority, p as any)))
    );
  }

  if (filters.projectId) {
    conditions.push(eq(notifications.projectId, filters.projectId));
  }

  if (filters.isRead !== undefined) {
    conditions.push(eq(notifications.isRead, filters.isRead));
  }

  if (filters.startDate) {
    conditions.push(gte(notifications.createdAt, filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(lte(notifications.createdAt, filters.endDate));
  }

  // Build final query
  const results = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      type: notifications.type,
      priority: notifications.priority,
      title: notifications.title,
      message: notifications.message,
      link: notifications.link,
      projectId: notifications.projectId,
      taskId: notifications.taskId,
      isRead: notifications.isRead,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      projectName: projects.name,
    })
    .from(notifications)
    .leftJoin(projects, eq(notifications.projectId, projects.id))
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(filters.limit || 50)
    .offset(filters.offset || 0);

  return results;
}

/**
 * Get notification history statistics
 */
export async function getNotificationStats(
  userId: number,
  filters?: Omit<NotificationFilters, "limit" | "offset">
): Promise<NotificationHistoryStats> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build conditions
  const conditions: any[] = [eq(notifications.userId, userId)];

  if (filters?.type && filters.type.length > 0) {
    conditions.push(
      or(...filters.type.map((t) => eq(notifications.type, t as any)))
    );
  }

  if (filters?.priority && filters.priority.length > 0) {
    conditions.push(
      or(...filters.priority.map((p) => eq(notifications.priority, p as any)))
    );
  }

  if (filters?.projectId) {
    conditions.push(eq(notifications.projectId, filters.projectId));
  }

  if (filters?.startDate) {
    conditions.push(gte(notifications.createdAt, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(lte(notifications.createdAt, filters.endDate));
  }

  // Get all matching notifications
  const allNotifications = await db
    .select()
    .from(notifications)
    .where(and(...conditions));

  // Calculate stats
  const total = allNotifications.length;
  const unread = allNotifications.filter((n) => !n.isRead).length;

  // By type
  const byType: Record<string, number> = {};
  for (const notif of allNotifications) {
    byType[notif.type] = (byType[notif.type] || 0) + 1;
  }

  // By priority
  const byPriority: Record<string, number> = {};
  for (const notif of allNotifications) {
    byPriority[notif.priority] = (byPriority[notif.priority] || 0) + 1;
  }

  // By project
  const projectCounts = new Map<number, number>();
  const projectNames = new Map<number, string>();

  for (const notif of allNotifications) {
    if (notif.projectId) {
      projectCounts.set(notif.projectId, (projectCounts.get(notif.projectId) || 0) + 1);
    }
  }

  // Get project names
  if (projectCounts.size > 0) {
    const projectIds = Array.from(projectCounts.keys());
    const projectsData = await db
      .select()
      .from(projects)
      .where(
        or(...projectIds.map((id) => eq(projects.id, id)))
      );

    for (const project of projectsData) {
      projectNames.set(project.id, project.name);
    }
  }

  const byProject = Array.from(projectCounts.entries())
    .map(([projectId, count]) => ({
      projectId,
      projectName: projectNames.get(projectId) || "Projeto Desconhecido",
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    total,
    unread,
    byType,
    byPriority,
    byProject,
  };
}

/**
 * Export notifications to CSV format
 */
export async function exportNotificationsToCSV(
  userId: number,
  filters?: NotificationFilters
): Promise<string> {
  const notifications = await getFilteredNotifications(userId, filters || {});

  // CSV header
  let csv = "ID,Tipo,Prioridade,Título,Mensagem,Projeto,Lida,Data Criação,Data Leitura\n";

  // CSV rows
  for (const notif of notifications) {
    const row = [
      notif.id,
      notif.type,
      notif.priority,
      `"${notif.title.replace(/"/g, '""')}"`,
      `"${notif.message.replace(/"/g, '""')}"`,
      notif.projectName ? `"${notif.projectName.replace(/"/g, '""')}"` : "",
      notif.isRead ? "Sim" : "Não",
      notif.createdAt ? new Date(notif.createdAt).toLocaleString("pt-PT") : "",
      notif.readAt ? new Date(notif.readAt).toLocaleString("pt-PT") : "",
    ];
    csv += row.join(",") + "\n";
  }

  return csv;
}

/**
 * Get date range presets
 */
export function getDateRangePreset(preset: string): { startDate: Date; endDate: Date } {
  const now = new Date();
  const endDate = now;
  let startDate = new Date();

  switch (preset) {
    case "last_week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "last_month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "last_quarter":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "last_year":
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(0); // All time
  }

  return { startDate, endDate };
}
