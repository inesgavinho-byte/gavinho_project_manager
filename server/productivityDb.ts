import { getDb } from "./db";
import { users, timeTracking, taskAssignments } from "../drizzle/schema";
import { eq, sql, and, gte, lte, isNull } from "drizzle-orm";

export interface ProductivityFilters {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Get team productivity metrics
 */
export async function getTeamProductivityMetrics(filters?: ProductivityFilters) {
  const db = await getDb();
  
  const conditions = [];
  if (filters?.startDate) {
    conditions.push(gte(timeTracking.date, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(timeTracking.date, filters.endDate));
  }

  const result = await db
    .select({
      userId: timeTracking.userId,
      userName: users.name,
      totalHours: sql<number>`COALESCE(SUM(${timeTracking.hours}), 0)`,
      daysWorked: sql<number>`COUNT(DISTINCT ${timeTracking.date})`,
      entriesCount: sql<number>`COUNT(*)`,
    })
    .from(timeTracking)
    .leftJoin(users, eq(timeTracking.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(timeTracking.userId, users.name);

  return result.map(row => ({
    userId: row.userId,
    userName: row.userName || 'Utilizador Desconhecido',
    totalHours: Number(row.totalHours),
    daysWorked: Number(row.daysWorked),
    entriesCount: Number(row.entriesCount),
    avgHoursPerDay: row.daysWorked > 0 ? Number(row.totalHours) / Number(row.daysWorked) : 0,
  }));
}

/**
 * Get task completion rates by user
 */
export async function getTaskCompletionRates(filters?: ProductivityFilters) {
  const db = await getDb();
  
  const result = await db
    .select({
      userId: taskAssignments.userId,
      userName: users.name,
      totalTasks: sql<number>`COUNT(*)`,
      completedTasks: sql<number>`SUM(CASE WHEN ${taskAssignments.status} = 'completed' THEN 1 ELSE 0 END)`,
      inProgressTasks: sql<number>`SUM(CASE WHEN ${taskAssignments.status} = 'in_progress' THEN 1 ELSE 0 END)`,
      pendingTasks: sql<number>`SUM(CASE WHEN ${taskAssignments.status} = 'pending' THEN 1 ELSE 0 END)`,
    })
    .from(taskAssignments)
    .leftJoin(users, eq(taskAssignments.userId, users.id))
    .groupBy(taskAssignments.userId, users.name);

  return result.map(row => ({
    userId: row.userId,
    userName: row.userName || 'Utilizador Desconhecido',
    totalTasks: Number(row.totalTasks),
    completedTasks: Number(row.completedTasks),
    inProgressTasks: Number(row.inProgressTasks),
    pendingTasks: Number(row.pendingTasks),
    completionRate: row.totalTasks > 0 ? (Number(row.completedTasks) / Number(row.totalTasks)) * 100 : 0,
  }));
}

/**
 * Get efficiency metrics (hours per task)
 */
export async function getEfficiencyMetrics(filters?: ProductivityFilters) {
  const db = await getDb();
  
  const result = await db
    .select({
      userId: taskAssignments.userId,
      userName: users.name,
      totalEstimatedHours: sql<number>`COALESCE(SUM(${taskAssignments.estimatedHours}), 0)`,
      totalActualHours: sql<number>`COALESCE(SUM(${taskAssignments.actualHours}), 0)`,
      completedTasks: sql<number>`SUM(CASE WHEN ${taskAssignments.status} = 'completed' THEN 1 ELSE 0 END)`,
    })
    .from(taskAssignments)
    .leftJoin(users, eq(taskAssignments.userId, users.id))
    .where(eq(taskAssignments.status, 'completed' as any))
    .groupBy(taskAssignments.userId, users.name);

  return result.map(row => ({
    userId: row.userId,
    userName: row.userName || 'Utilizador Desconhecido',
    totalEstimatedHours: Number(row.totalEstimatedHours),
    totalActualHours: Number(row.totalActualHours),
    completedTasks: Number(row.completedTasks),
    avgHoursPerTask: row.completedTasks > 0 ? Number(row.totalActualHours) / Number(row.completedTasks) : 0,
    efficiency: row.totalEstimatedHours > 0 ? (Number(row.totalEstimatedHours) / Number(row.totalActualHours)) * 100 : 0,
  }));
}

/**
 * Get productivity trends over time
 */
export async function getProductivityTrends(filters?: ProductivityFilters) {
  const db = await getDb();
  
  const conditions = [];
  if (filters?.startDate) {
    conditions.push(gte(timeTracking.date, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(timeTracking.date, filters.endDate));
  }

  const result = await db
    .select({
      date: timeTracking.date,
      totalHours: sql<number>`COALESCE(SUM(${timeTracking.hours}), 0)`,
      uniqueUsers: sql<number>`COUNT(DISTINCT ${timeTracking.userId})`,
    })
    .from(timeTracking)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(timeTracking.date)
    .orderBy(timeTracking.date);

  return result.map(row => ({
    date: row.date,
    totalHours: Number(row.totalHours),
    uniqueUsers: Number(row.uniqueUsers),
    avgHoursPerUser: row.uniqueUsers > 0 ? Number(row.totalHours) / Number(row.uniqueUsers) : 0,
  }));
}
