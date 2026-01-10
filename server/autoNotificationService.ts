/**
 * Auto Notification Service
 * Monitors projects and generates automatic notifications for:
 * - Progress milestones (75%, 90%, 100%)
 * - Approaching deadlines (7, 14, 30 days)
 * - Budget thresholds (90%, 100%, >100%)
 * - Contract deadline warnings
 */

import { getDb } from "./db";
import { projects, notifications, notificationPreferences } from "../drizzle/schema";
import { eq, and, gte, lte, isNull, or } from "drizzle-orm";

interface NotificationCheck {
  type: "ai_alert" | "deadline_warning" | "budget_exceeded" | "project_delayed" | "task_overdue" | "order_pending" | "system";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  projectId: number;
  userId: number;
  link?: string;
}

/**
 * Check if a notification of the same type already exists for this project today
 */
async function notificationExistsToday(
  userId: number,
  projectId: number,
  type: string,
  titlePattern: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.projectId, projectId),
        eq(notifications.type, type as any),
        gte(notifications.createdAt, today)
      )
    )
    .limit(1);

  return existing.length > 0;
}

/**
 * Create a notification
 */
async function createNotification(check: NotificationCheck): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Check if notification already exists today
  const exists = await notificationExistsToday(
    check.userId,
    check.projectId,
    check.type,
    check.title
  );

  if (exists) {
    console.log(`[AutoNotification] Skipping duplicate notification: ${check.title}`);
    return;
  }

  try {
    await db.insert(notifications).values({
      userId: check.userId,
      type: check.type,
      priority: check.priority,
      title: check.title,
      message: check.message,
      link: check.link,
      projectId: check.projectId,
      isRead: false,
    });
    console.log(`[AutoNotification] Created: ${check.title}`);
  } catch (error) {
    console.error(`[AutoNotification] Failed to create notification:`, error);
  }
}

/**
 * Check progress milestones (75%, 90%, 100%)
 */
async function checkProgressMilestones(): Promise<NotificationCheck[]> {
  const db = await getDb();
  if (!db) return [];

  const checks: NotificationCheck[] = [];

  // Get all active projects
  const activeProjects = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.status, "in_progress"),
        isNull(projects.deletedAt)
      )
    );

  for (const project of activeProjects) {
    const progress = project.progress || 0;

    // 75% milestone
    if (progress >= 75 && progress < 80) {
      checks.push({
        type: "system",
        priority: "medium",
        title: `Projeto ${project.name} atingiu 75% de conclusão`,
        message: `O projeto "${project.name}" está em boa progressão com ${progress}% concluído. Continue o bom trabalho!`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}`,
      });
    }

    // 90% milestone
    if (progress >= 90 && progress < 95) {
      checks.push({
        type: "system",
        priority: "high",
        title: `Projeto ${project.name} quase concluído (${progress}%)`,
        message: `O projeto "${project.name}" está quase finalizado com ${progress}% concluído. Prepare os últimos detalhes!`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}`,
      });
    }

    // 100% milestone
    if (progress >= 100) {
      checks.push({
        type: "system",
        priority: "high",
        title: `Projeto ${project.name} concluído!`,
        message: `Parabéns! O projeto "${project.name}" foi marcado como 100% concluído. Considere atualizar o status para "Concluído".`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}`,
      });
    }
  }

  return checks;
}

/**
 * Check approaching deadlines (7, 14, 30 days)
 */
async function checkDeadlines(): Promise<NotificationCheck[]> {
  const db = await getDb();
  if (!db) return [];

  const checks: NotificationCheck[] = [];
  const today = new Date();

  // Get all active projects with end dates
  const activeProjects = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.status, "in_progress"),
        isNull(projects.deletedAt)
      )
    );

  for (const project of activeProjects) {
    if (!project.endDate) continue;

    const endDate = new Date(project.endDate);
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 30 days warning
    if (daysRemaining === 30) {
      checks.push({
        type: "deadline_warning",
        priority: "medium",
        title: `Prazo de ${project.name} em 30 dias`,
        message: `O projeto "${project.name}" tem prazo em ${endDate.toLocaleDateString('pt-PT')} (30 dias). Verifique o progresso atual: ${project.progress}%.`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}`,
      });
    }

    // 14 days warning
    if (daysRemaining === 14) {
      checks.push({
        type: "deadline_warning",
        priority: "high",
        title: `Prazo de ${project.name} em 2 semanas`,
        message: `Atenção! O projeto "${project.name}" tem prazo em ${endDate.toLocaleDateString('pt-PT')} (14 dias). Progresso atual: ${project.progress}%.`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}`,
      });
    }

    // 7 days warning
    if (daysRemaining === 7) {
      checks.push({
        type: "deadline_warning",
        priority: "critical",
        title: `URGENTE: Prazo de ${project.name} em 7 dias`,
        message: `Alerta crítico! O projeto "${project.name}" tem prazo em ${endDate.toLocaleDateString('pt-PT')} (7 dias). Progresso atual: ${project.progress}%. Ação imediata necessária!`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}`,
      });
    }

    // Overdue
    if (daysRemaining < 0) {
      checks.push({
        type: "project_delayed",
        priority: "critical",
        title: `Projeto ${project.name} ATRASADO`,
        message: `O projeto "${project.name}" ultrapassou o prazo em ${Math.abs(daysRemaining)} dias. Prazo era ${endDate.toLocaleDateString('pt-PT')}. Progresso: ${project.progress}%.`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}`,
      });
    }
  }

  return checks;
}

/**
 * Check contract deadlines
 */
async function checkContractDeadlines(): Promise<NotificationCheck[]> {
  const db = await getDb();
  if (!db) return [];

  const checks: NotificationCheck[] = [];
  const today = new Date();

  // Get all projects with contract deadlines
  const projectsWithContracts = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.status, "in_progress"),
        isNull(projects.deletedAt)
      )
    );

  for (const project of projectsWithContracts) {
    if (!project.contractDeadline) continue;

    const deadline = new Date(project.contractDeadline);
    const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // 30 days warning
    if (daysRemaining === 30) {
      checks.push({
        type: "deadline_warning",
        priority: "medium",
        title: `Prazo contratual de ${project.name} em 30 dias`,
        message: `O prazo contratual do projeto "${project.name}" vence em ${deadline.toLocaleDateString('pt-PT')} (30 dias).`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}?tab=contract`,
      });
    }

    // 14 days warning
    if (daysRemaining === 14) {
      checks.push({
        type: "deadline_warning",
        priority: "high",
        title: `Prazo contratual de ${project.name} em 2 semanas`,
        message: `Atenção! O prazo contratual do projeto "${project.name}" vence em ${deadline.toLocaleDateString('pt-PT')} (14 dias).`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}?tab=contract`,
      });
    }

    // 7 days warning
    if (daysRemaining === 7) {
      checks.push({
        type: "deadline_warning",
        priority: "critical",
        title: `URGENTE: Prazo contratual de ${project.name} em 7 dias`,
        message: `Alerta crítico! O prazo contratual do projeto "${project.name}" vence em ${deadline.toLocaleDateString('pt-PT')} (7 dias). Ação imediata necessária!`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}?tab=contract`,
      });
    }

    // Contract expired
    if (daysRemaining < 0) {
      checks.push({
        type: "project_delayed",
        priority: "critical",
        title: `Contrato de ${project.name} EXPIRADO`,
        message: `O contrato do projeto "${project.name}" expirou há ${Math.abs(daysRemaining)} dias. Prazo contratual era ${deadline.toLocaleDateString('pt-PT')}.`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}?tab=contract`,
      });
    }
  }

  return checks;
}

/**
 * Check budget thresholds (90%, 100%, >100%)
 */
async function checkBudgets(): Promise<NotificationCheck[]> {
  const db = await getDb();
  if (!db) return [];

  const checks: NotificationCheck[] = [];

  // Get all active projects with budgets
  const activeProjects = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.status, "in_progress"),
        isNull(projects.deletedAt)
      )
    );

  for (const project of activeProjects) {
    if (!project.budget || !project.actualCost) continue;

    const budget = parseFloat(project.budget);
    const actualCost = parseFloat(project.actualCost);

    if (budget === 0) continue;

    const percentUsed = (actualCost / budget) * 100;

    // 90% threshold
    if (percentUsed >= 90 && percentUsed < 95) {
      checks.push({
        type: "budget_exceeded",
        priority: "high",
        title: `Orçamento de ${project.name} em 90%`,
        message: `Atenção! O projeto "${project.name}" já utilizou ${percentUsed.toFixed(1)}% do orçamento (€${actualCost.toLocaleString('pt-PT')} de €${budget.toLocaleString('pt-PT')}).`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}?tab=financial`,
      });
    }

    // 100% threshold
    if (percentUsed >= 100 && percentUsed < 105) {
      checks.push({
        type: "budget_exceeded",
        priority: "critical",
        title: `Orçamento de ${project.name} ESGOTADO`,
        message: `Alerta! O projeto "${project.name}" atingiu ${percentUsed.toFixed(1)}% do orçamento (€${actualCost.toLocaleString('pt-PT')} de €${budget.toLocaleString('pt-PT')}). Revisão urgente necessária!`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}?tab=financial`,
      });
    }

    // Over budget
    if (percentUsed >= 110) {
      checks.push({
        type: "budget_exceeded",
        priority: "critical",
        title: `Projeto ${project.name} ACIMA DO ORÇAMENTO`,
        message: `Crítico! O projeto "${project.name}" ultrapassou o orçamento em ${(percentUsed - 100).toFixed(1)}% (€${actualCost.toLocaleString('pt-PT')} de €${budget.toLocaleString('pt-PT')}). Ação imediata necessária!`,
        projectId: project.id,
        userId: project.createdById,
        link: `/projects/${project.id}?tab=financial`,
      });
    }
  }

  return checks;
}

/**
 * Run all checks and create notifications
 */
export async function runAutoNotifications(): Promise<{ created: number; skipped: number }> {
  console.log("[AutoNotification] Starting automatic notification checks...");

  try {
    // Collect all checks
    const progressChecks = await checkProgressMilestones();
    const deadlineChecks = await checkDeadlines();
    const contractChecks = await checkContractDeadlines();
    const budgetChecks = await checkBudgets();

    const allChecks = [
      ...progressChecks,
      ...deadlineChecks,
      ...contractChecks,
      ...budgetChecks,
    ];

    console.log(`[AutoNotification] Found ${allChecks.length} potential notifications`);

    // Create notifications
    let created = 0;
    let skipped = 0;

    for (const check of allChecks) {
      const exists = await notificationExistsToday(
        check.userId,
        check.projectId,
        check.type,
        check.title
      );

      if (exists) {
        skipped++;
      } else {
        await createNotification(check);
        created++;
      }
    }

    console.log(`[AutoNotification] Completed: ${created} created, ${skipped} skipped`);

    return { created, skipped };
  } catch (error) {
    console.error("[AutoNotification] Error running checks:", error);
    return { created: 0, skipped: 0 };
  }
}

/**
 * Generate test notifications for a specific project
 */
export async function generateTestNotifications(projectId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project || project.length === 0) {
    throw new Error("Project not found");
  }

  const proj = project[0];

  // Create test notifications
  const testNotifications: NotificationCheck[] = [
    {
      type: "system",
      priority: "medium",
      title: `[TESTE] Projeto ${proj.name} atingiu 75%`,
      message: `Notificação de teste: O projeto "${proj.name}" atingiu 75% de conclusão.`,
      projectId: proj.id,
      userId: userId,
      link: `/projects/${proj.id}`,
    },
    {
      type: "deadline_warning",
      priority: "high",
      title: `[TESTE] Prazo de ${proj.name} próximo`,
      message: `Notificação de teste: O prazo do projeto "${proj.name}" está se aproximando.`,
      projectId: proj.id,
      userId: userId,
      link: `/projects/${proj.id}`,
    },
    {
      type: "budget_exceeded",
      priority: "critical",
      title: `[TESTE] Orçamento de ${proj.name} em 90%`,
      message: `Notificação de teste: O projeto "${proj.name}" já utilizou 90% do orçamento.`,
      projectId: proj.id,
      userId: userId,
      link: `/projects/${proj.id}?tab=financial`,
    },
  ];

  for (const notif of testNotifications) {
    await db.insert(notifications).values({
      userId: notif.userId,
      type: notif.type,
      priority: notif.priority,
      title: notif.title,
      message: notif.message,
      link: notif.link,
      projectId: notif.projectId,
      isRead: false,
    });
  }

  console.log(`[AutoNotification] Created ${testNotifications.length} test notifications`);
}
