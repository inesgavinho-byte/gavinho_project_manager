import { getDb } from "./db";
import { notifications, notificationPreferences, projects, tasks, budgets } from "../drizzle/schema";
import { eq, and, lte, gte, sql } from "drizzle-orm";

export interface NotificationData {
  userId: number;
  type: "ai_alert" | "deadline_warning" | "budget_exceeded" | "project_delayed" | "task_overdue" | "order_pending" | "system";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  link?: string;
  projectId?: number;
  taskId?: number;
}

/**
 * Create a notification
 */
export async function createNotification(data: NotificationData): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Notifications] Database not available");
    return;
  }

  try {
    await db.insert(notifications).values({
      userId: data.userId,
      type: data.type,
      priority: data.priority,
      title: data.title,
      message: data.message,
      link: data.link,
      projectId: data.projectId,
      taskId: data.taskId,
      isRead: 0,
    });
  } catch (error) {
    console.error("[Notifications] Failed to create notification:", error);
  }
}

/**
 * Get user notification preferences
 */
export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const prefs = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  return prefs.length > 0 ? prefs[0] : null;
}

/**
 * Create default preferences for a user
 */
export async function createDefaultPreferences(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(notificationPreferences).values({
      userId,
      aiAlerts: 1,
      deadlineWarnings: 1,
      budgetAlerts: 1,
      projectDelays: 1,
      taskOverdue: 1,
      orderPending: 1,
      systemNotifications: 1,
      deadlineWarningDays: 7,
      budgetThreshold: 90,
    });
  } catch (error) {
    // Ignore duplicate key errors
    if ((error as any).code !== "ER_DUP_ENTRY") {
      console.error("[Notifications] Failed to create default preferences:", error);
    }
  }
}

/**
 * Check and generate deadline warnings
 */
export async function checkDeadlineWarnings(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const prefs = await getUserPreferences(userId);
  if (!prefs || !prefs.deadlineWarnings) return;

  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() + prefs.deadlineWarningDays);

  // Check projects
  const upcomingProjects = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.createdById, userId),
        lte(projects.endDate, warningDate),
        gte(projects.endDate, new Date()),
        eq(projects.status, "in_progress")
      )
    );

  for (const project of upcomingProjects) {
    if (!project.endDate) continue;

    const daysRemaining = Math.ceil(
      (project.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    await createNotification({
      userId,
      type: "deadline_warning",
      priority: daysRemaining <= 3 ? "high" : "medium",
      title: `Prazo Próximo: ${project.name}`,
      message: `O projeto "${project.name}" tem prazo em ${daysRemaining} dias (${project.endDate.toLocaleDateString()}).`,
      link: `/projects/${project.id}`,
      projectId: project.id,
    });
  }

  // Check tasks
  const upcomingTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.createdById, userId),
        lte(tasks.dueDate, warningDate),
        gte(tasks.dueDate, new Date())
      )
    );

  for (const task of upcomingTasks) {
    if (!task.dueDate) continue;

    const daysRemaining = Math.ceil(
      (task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    await createNotification({
      userId,
      type: "deadline_warning",
      priority: daysRemaining <= 2 ? "high" : "medium",
      title: `Tarefa com Prazo Próximo`,
      message: `A tarefa "${task.title}" tem prazo em ${daysRemaining} dias (${task.dueDate.toLocaleDateString()}).`,
      link: `/projects/${task.projectId}`,
      projectId: task.projectId,
      taskId: task.id,
    });
  }
}

/**
 * Check and generate budget exceeded warnings
 */
export async function checkBudgetWarnings(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const prefs = await getUserPreferences(userId);
  if (!prefs || !prefs.budgetAlerts) return;

  const threshold = prefs.budgetThreshold / 100;

  // Get all projects with budgets
  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.createdById, userId));

  for (const project of userProjects) {
    if (!project.budget || parseFloat(project.budget.toString()) === 0) continue;

    const budgetValue = parseFloat(project.budget.toString());
    const actualCost = parseFloat(project.actualCost?.toString() || "0");
    const utilization = actualCost / budgetValue;

    if (utilization >= threshold) {
      const priority = utilization >= 1.0 ? "critical" : utilization >= 0.95 ? "high" : "medium";

      await createNotification({
        userId,
        type: "budget_exceeded",
        priority,
        title: `Alerta de Orçamento: ${project.name}`,
        message: `O projeto "${project.name}" atingiu ${(utilization * 100).toFixed(1)}% do orçamento (€${actualCost.toFixed(2)} de €${budgetValue.toFixed(2)}).`,
        link: `/projects/${project.id}`,
        projectId: project.id,
      });
    }
  }
}

/**
 * Check and generate project delay warnings
 */
export async function checkProjectDelays(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const prefs = await getUserPreferences(userId);
  if (!prefs || !prefs.projectDelays) return;

  const now = new Date();

  const delayedProjects = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.createdById, userId),
        lte(projects.endDate, now),
        eq(projects.status, "in_progress")
      )
    );

  for (const project of delayedProjects) {
    if (!project.endDate) continue;

    const daysOverdue = Math.ceil(
      (now.getTime() - project.endDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    await createNotification({
      userId,
      type: "project_delayed",
      priority: daysOverdue > 7 ? "critical" : "high",
      title: `Projeto Atrasado: ${project.name}`,
      message: `O projeto "${project.name}" está ${daysOverdue} dias atrasado (prazo: ${project.endDate.toLocaleDateString()}).`,
      link: `/projects/${project.id}`,
      projectId: project.id,
    });
  }
}

/**
 * Check and generate task overdue warnings
 */
export async function checkTaskOverdue(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const prefs = await getUserPreferences(userId);
  if (!prefs || !prefs.taskOverdue) return;

  const now = new Date();

  const overdueTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.createdById, userId),
        lte(tasks.dueDate, now)
      )
    );

  for (const task of overdueTasks) {
    if (!task.dueDate || task.completedAt) continue;

    const daysOverdue = Math.ceil(
      (now.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    await createNotification({
      userId,
      type: "task_overdue",
      priority: daysOverdue > 3 ? "high" : "medium",
      title: `Tarefa Atrasada`,
      message: `A tarefa "${task.title}" está ${daysOverdue} dias atrasada (prazo: ${task.dueDate.toLocaleDateString()}).`,
      link: `/projects/${task.projectId}`,
      projectId: task.projectId,
      taskId: task.id,
    });
  }
}

/**
 * Run all notification checks for a user
 */
export async function runNotificationChecks(userId: number): Promise<void> {
  // Ensure user has preferences
  let prefs = await getUserPreferences(userId);
  if (!prefs) {
    await createDefaultPreferences(userId);
    prefs = await getUserPreferences(userId);
  }

  if (!prefs) return;

  // Run all checks
  await Promise.all([
    checkDeadlineWarnings(userId),
    checkBudgetWarnings(userId),
    checkProjectDelays(userId),
    checkTaskOverdue(userId),
  ]);
}

/**
 * Create notification from AI suggestion
 */
export async function createAIAlertNotification(
  userId: number,
  suggestionId: number,
  title: string,
  message: string,
  priority: "low" | "medium" | "high" | "critical",
  projectId?: number
): Promise<void> {
  const prefs = await getUserPreferences(userId);
  if (!prefs || !prefs.aiAlerts) return;

  await createNotification({
    userId,
    type: "ai_alert",
    priority,
    title,
    message,
    link: `/ai-suggestions`,
    projectId,
  });
}
