import { initDb } from './db';
import { projectMilestones, milestoneNotifications } from '../drizzle/schema';
import { eq, and, lt, gt, isNull } from 'drizzle-orm';

export interface MilestoneAlert {
  milestoneId: number;
  projectId: number;
  milestoneName: string;
  daysUntilDue: number;
  dueDate: Date;
  severity: 'warning' | 'urgent' | 'overdue';
}

/**
 * Calcula a severidade do alerta baseado nos dias até o vencimento
 */
function calculateSeverity(daysUntilDue: number): 'warning' | 'urgent' | 'overdue' {
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 3) return 'urgent';
  return 'warning';
}

/**
 * Verifica marcos próximos do vencimento
 */
export async function checkUpcomingMilestones(
  warningDays: number = 7
): Promise<MilestoneAlert[]> {
  try {
    const db = await initDb();
    const now = new Date();
    const warningDate = new Date(now.getTime() + warningDays * 24 * 60 * 60 * 1000);

    // Buscar marcos que vencem em breve (não concluídos)
    const upcomingMilestones = await db
      .select({
        id: projectMilestones.id,
        projectId: projectMilestones.projectId,
        name: projectMilestones.name,
        dueDate: projectMilestones.dueDate,
        status: projectMilestones.status,
      })
      .from(projectMilestones)
      .where(
        and(
          ne(projectMilestones.status, 'completed'),
          lt(projectMilestones.dueDate, warningDate),
          gt(projectMilestones.dueDate, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) // Últimos 30 dias
        )
      );

    const alerts: MilestoneAlert[] = upcomingMilestones.map((milestone) => {
      const daysUntilDue = Math.ceil(
        (milestone.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        milestoneId: milestone.id,
        projectId: milestone.projectId,
        milestoneName: milestone.name,
        daysUntilDue,
        dueDate: milestone.dueDate,
        severity: calculateSeverity(daysUntilDue),
      };
    });

    return alerts;
  } catch (error) {
    console.error('[MilestoneNotification] Erro ao verificar marcos:', error);
    return [];
  }
}

/**
 * Cria notificações para marcos próximos do vencimento
 */
export async function createMilestoneNotifications(userId: number): Promise<void> {
  try {
    const db = await initDb();
    const alerts = await checkUpcomingMilestones();

    for (const alert of alerts) {
      // Verificar se já existe notificação para este marco hoje
      const existingNotification = await db
        .select()
        .from(milestoneNotifications)
        .where(
          and(
            eq(milestoneNotifications.milestoneId, alert.milestoneId),
            eq(milestoneNotifications.userId, userId),
            isNull(milestoneNotifications.dismissedAt)
          )
        )
        .limit(1);

      // Se não existe, criar nova notificação
      if (existingNotification.length === 0) {
        await db.insert(milestoneNotifications).values({
          milestoneId: alert.milestoneId,
          projectId: alert.projectId,
          userId,
          severity: alert.severity,
          message: `Marco "${alert.milestoneName}" vence em ${alert.daysUntilDue} dias`,
          daysUntilDue: alert.daysUntilDue,
          createdAt: new Date(),
          dismissedAt: null,
        });
      }
    }
  } catch (error) {
    console.error('[MilestoneNotification] Erro ao criar notificações:', error);
  }
}

/**
 * Obtém notificações não lidas para um usuário
 */
export async function getUserNotifications(userId: number) {
  try {
    const db = await initDb();

    const notifications = await db
      .select({
        id: milestoneNotifications.id,
        milestoneId: milestoneNotifications.milestoneId,
        projectId: milestoneNotifications.projectId,
        severity: milestoneNotifications.severity,
        message: milestoneNotifications.message,
        daysUntilDue: milestoneNotifications.daysUntilDue,
        createdAt: milestoneNotifications.createdAt,
        dismissedAt: milestoneNotifications.dismissedAt,
      })
      .from(milestoneNotifications)
      .where(
        and(
          eq(milestoneNotifications.userId, userId),
          isNull(milestoneNotifications.dismissedAt)
        )
      )
      .orderBy((t) => [desc(t.createdAt)]);

    return notifications;
  } catch (error) {
    console.error('[MilestoneNotification] Erro ao buscar notificações:', error);
    return [];
  }
}

/**
 * Marca notificação como lida
 */
export async function dismissNotification(notificationId: number): Promise<void> {
  try {
    const db = await initDb();

    await db
      .update(milestoneNotifications)
      .set({ dismissedAt: new Date() })
      .where(eq(milestoneNotifications.id, notificationId));
  } catch (error) {
    console.error('[MilestoneNotification] Erro ao descartar notificação:', error);
  }
}

/**
 * Marca todas as notificações como lidas
 */
export async function dismissAllNotifications(userId: number): Promise<void> {
  try {
    const db = await initDb();

    await db
      .update(milestoneNotifications)
      .set({ dismissedAt: new Date() })
      .where(
        and(
          eq(milestoneNotifications.userId, userId),
          isNull(milestoneNotifications.dismissedAt)
        )
      );
  } catch (error) {
    console.error('[MilestoneNotification] Erro ao descartar todas as notificações:', error);
  }
}

/**
 * Obtém estatísticas de notificações
 */
export async function getNotificationStats(userId: number) {
  try {
    const db = await initDb();

    const notifications = await db
      .select()
      .from(milestoneNotifications)
      .where(
        and(
          eq(milestoneNotifications.userId, userId),
          isNull(milestoneNotifications.dismissedAt)
        )
      );

    const stats = {
      total: notifications.length,
      overdue: notifications.filter((n) => n.severity === 'overdue').length,
      urgent: notifications.filter((n) => n.severity === 'urgent').length,
      warning: notifications.filter((n) => n.severity === 'warning').length,
    };

    return stats;
  } catch (error) {
    console.error('[MilestoneNotification] Erro ao obter estatísticas:', error);
    return { total: 0, overdue: 0, urgent: 0, warning: 0 };
  }
}

// Importar funções necessárias
import { ne, desc } from 'drizzle-orm';
