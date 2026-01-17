import { getWebSocketServer } from "./_core/websocket";
import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import { users, projects } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface MQTNotificationPayload {
  taskId: number;
  title: string;
  description: string;
  priority: string;
  severity: "critical" | "high" | "medium" | "low";
  itemCode: string;
  variance: number;
  variancePercentage: number;
  plannedQuantity: number;
  executedQuantity: number;
  projectId: number;
  assignedToId?: number;
  dueDate: string;
}

/**
 * Envia notificação de tarefa MQT gerada para usuário específico via WebSocket
 */
export async function notifyMQTTaskGenerated(
  userId: number,
  notification: MQTNotificationPayload
): Promise<void> {
  try {
    const wsServer = getWebSocketServer();
    if (wsServer && wsServer.isUserConnected(userId)) {
      wsServer.sendNotification(userId, {
        type: "mqt_task_generated",
        taskId: notification.taskId,
        title: notification.title,
        severity: notification.severity,
        itemCode: notification.itemCode,
        variance: notification.variance,
        variancePercentage: notification.variancePercentage,
        dueDate: notification.dueDate,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Erro ao enviar notificação WebSocket MQT:", error);
  }
}

/**
 * Notifica todos os usuários com acesso ao projeto sobre tarefa MQT gerada
 */
export async function notifyProjectTeamMQTTask(
  projectId: number,
  notification: MQTNotificationPayload
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Obter todos os usuários do projeto
    const projectUsers = await db
      .select()
      .from(users)
      .where(eq(users.projectId, projectId));

    // Enviar notificação para cada usuário
    const wsServer = getWebSocketServer();
    if (wsServer) {
      for (const user of projectUsers) {
        if (wsServer.isUserConnected(user.id)) {
          wsServer.sendNotification(user.id, {
            type: "mqt_task_generated",
            taskId: notification.taskId,
            title: notification.title,
            severity: notification.severity,
            itemCode: notification.itemCode,
            variance: notification.variance,
            variancePercentage: notification.variancePercentage,
            dueDate: notification.dueDate,
            assignedToId: notification.assignedToId,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    console.error("Erro ao notificar equipa do projeto sobre tarefa MQT:", error);
  }
}

/**
 * Envia notificação de tarefa MQT para o proprietário do projeto via Forge API
 */
export async function notifyOwnerMQTTask(
  notification: MQTNotificationPayload
): Promise<boolean> {
  try {
    const title = `🚨 Tarefa MQT Gerada: ${notification.itemCode}`;
    const content = `
Uma nova tarefa foi gerada automaticamente devido a uma discrepância no Mapa de Quantidades.

**Item:** ${notification.itemCode}
**Prioridade:** ${notification.priority}
**Severidade:** ${notification.severity}

**Discrepância:**
- Planejado: ${notification.plannedQuantity}
- Executado: ${notification.executedQuantity}
- Variância: ${notification.variance > 0 ? "+" : ""}${notification.variance.toFixed(2)} (${notification.variancePercentage.toFixed(1)}%)

**Tarefa:** ${notification.title}
**Data de Vencimento:** ${new Date(notification.dueDate).toLocaleDateString("pt-PT")}

Aceda ao painel para mais detalhes.
    `.trim();

    return await notifyOwner({ title, content });
  } catch (error) {
    console.error("Erro ao notificar proprietário sobre tarefa MQT:", error);
    return false;
  }
}

/**
 * Envia notificação consolidada de múltiplas tarefas MQT geradas
 */
export async function notifyBulkMQTTasksGenerated(
  projectId: number,
  notifications: MQTNotificationPayload[],
  assignedToId?: number
): Promise<void> {
  try {
    if (notifications.length === 0) return;

    // Notificar via WebSocket
    const wsServer = getWebSocketServer();
    if (wsServer) {
      const targetUserId = assignedToId;
      if (targetUserId && wsServer.isUserConnected(targetUserId)) {
        wsServer.sendNotification(targetUserId, {
          type: "mqt_bulk_tasks_generated",
          count: notifications.length,
          tasks: notifications.map((n) => ({
            taskId: n.taskId,
            itemCode: n.itemCode,
            severity: n.severity,
            variancePercentage: n.variancePercentage,
          })),
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Notificar proprietário se houver tarefas críticas
    const criticalTasks = notifications.filter((n) => n.severity === "critical");
    if (criticalTasks.length > 0) {
      const title = `🚨 ${criticalTasks.length} Tarefa(s) MQT Crítica(s) Gerada(s)`;
      const content = `
${criticalTasks.length} tarefa(s) com severidade crítica foram geradas automaticamente.

**Itens Críticos:**
${criticalTasks.map((t) => `- ${t.itemCode}: ${t.variancePercentage.toFixed(1)}% de variância`).join("\n")}

Total de tarefas geradas: ${notifications.length}

Aceda ao painel para revisar todas as tarefas.
      `.trim();

      await notifyOwner({ title, content });
    }
  } catch (error) {
    console.error("Erro ao enviar notificações em massa de tarefas MQT:", error);
  }
}

/**
 * Envia notificação de alerta de discrepância (antes de gerar tarefa)
 */
export async function notifyMQTDiscrepancyAlert(
  projectId: number,
  itemCode: string,
  severity: "critical" | "high" | "medium" | "low",
  variance: number,
  variancePercentage: number,
  userId?: number
): Promise<void> {
  try {
    const wsServer = getWebSocketServer();
    if (wsServer) {
      if (userId && wsServer.isUserConnected(userId)) {
        wsServer.sendNotification(userId, {
          type: "mqt_discrepancy_alert",
          itemCode,
          severity,
          variance,
          variancePercentage,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Broadcast para todos os usuários do projeto
        wsServer.broadcast({
          type: "mqt_discrepancy_alert",
          projectId,
          itemCode,
          severity,
          variance,
          variancePercentage,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error("Erro ao enviar alerta de discrepância MQT:", error);
  }
}

/**
 * Envia notificação de configuração de automação atualizada
 */
export async function notifyMQTAutomationConfigUpdated(
  projectId: number,
  changes: Record<string, any>,
  userId: number
): Promise<void> {
  try {
    const wsServer = getWebSocketServer();
    if (wsServer && wsServer.isUserConnected(userId)) {
      wsServer.sendNotification(userId, {
        type: "mqt_automation_config_updated",
        projectId,
        changes,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Erro ao notificar atualização de configuração MQT:", error);
  }
}

/**
 * Envia notificação de status de processamento de alertas
 */
export async function notifyMQTProcessingStatus(
  projectId: number,
  status: "started" | "in_progress" | "completed" | "failed",
  details?: Record<string, any>
): Promise<void> {
  try {
    const wsServer = getWebSocketServer();
    if (wsServer) {
      wsServer.broadcast({
        type: "mqt_processing_status",
        projectId,
        status,
        details,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Erro ao notificar status de processamento MQT:", error);
  }
}
