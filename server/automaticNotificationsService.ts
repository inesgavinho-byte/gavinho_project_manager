import { getDb } from "./db";
import { notifications, supplierEvaluations, projects } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { eq } from "drizzle-orm";

/**
 * Serviço de Notificações Automáticas
 * Integra-se aos fluxos existentes para disparar notificações automaticamente
 */

export interface NotificationQueueItem {
  type: "supplier_evaluated" | "project_status_changed" | "project_completed";
  title: string;
  content: string;
  relatedId: number;
  relatedType: "supplier" | "project" | "evaluation";
  userId?: number;
  retries?: number;
  maxRetries?: number;
}

// Fila em memória para notificações (em produção, usar Redis ou banco de dados)
const notificationQueue: NotificationQueueItem[] = [];
const MAX_RETRIES = 3;

/**
 * Adiciona uma notificação à fila para processamento assíncrono
 */
export async function queueNotification(item: NotificationQueueItem) {
  const queueItem: NotificationQueueItem = {
    ...item,
    retries: 0,
    maxRetries: MAX_RETRIES,
  };

  notificationQueue.push(queueItem);

  // Processar fila em background (sem bloquear a requisição)
  setImmediate(() => processNotificationQueue());

  return queueItem;
}

/**
 * Processa a fila de notificações
 */
export async function processNotificationQueue() {
  while (notificationQueue.length > 0) {
    const item = notificationQueue.shift();
    if (!item) break;

    try {
      await createAndSendNotification(item);
    } catch (error) {
      console.error("Erro ao processar notificação:", error);

      // Retry com backoff exponencial
      if ((item.retries || 0) < (item.maxRetries || MAX_RETRIES)) {
        item.retries = (item.retries || 0) + 1;
        const delayMs = Math.pow(2, item.retries) * 1000; // 2s, 4s, 8s
        setTimeout(() => notificationQueue.push(item), delayMs);
      }
    }
  }
}

/**
 * Cria e envia uma notificação
 */
async function createAndSendNotification(item: NotificationQueueItem) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();

  // Inserir notificação no banco de dados
  await db.insert(notifications).values({
    userId: item.userId,
    title: item.title,
    content: item.content,
    type: item.type,
    relatedId: item.relatedId,
    relatedType: item.relatedType,
    isRead: false,
    createdAt: now.toISOString(),
  });

  // Enviar notificação ao proprietário para eventos críticos
  if (item.type === "supplier_evaluated" || item.type === "project_completed") {
    await notifyOwner({
      title: item.title,
      content: item.content,
    });
  }
}

/**
 * Notifica quando um fornecedor é avaliado
 */
export async function notifyOnSupplierEvaluation(
  supplierId: number,
  supplierName: string,
  rating: number,
  evaluatedBy: string
) {
  const ratingText = rating >= 4.5 ? "excelente" : rating >= 3.5 ? "bom" : "precisa melhorar";

  return queueNotification({
    type: "supplier_evaluated",
    title: `Fornecedor ${supplierName} Avaliado`,
    content: `O fornecedor ${supplierName} recebeu uma avaliação ${ratingText} (${rating}/5) por ${evaluatedBy}. Verifique os detalhes no módulo de Avaliações de Fornecedores.`,
    relatedId: supplierId,
    relatedType: "supplier",
  });
}

/**
 * Notifica quando o status de um projeto muda
 */
export async function notifyOnProjectStatusChange(
  projectId: number,
  projectName: string,
  oldStatus: string,
  newStatus: string,
  changedBy: string
) {
  const statusLabels: Record<string, string> = {
    planning: "Planeamento",
    in_progress: "Em Andamento",
    completed: "Concluído",
    on_hold: "Suspenso",
  };

  return queueNotification({
    type: "project_status_changed",
    title: `Projeto ${projectName} - Status Alterado`,
    content: `O status do projeto ${projectName} foi alterado de ${statusLabels[oldStatus] || oldStatus} para ${statusLabels[newStatus] || newStatus} por ${changedBy}.`,
    relatedId: projectId,
    relatedType: "project",
  });
}

/**
 * Notifica quando um projeto é concluído
 */
export async function notifyOnProjectCompletion(
  projectId: number,
  projectName: string,
  completedBy: string
) {
  return queueNotification({
    type: "project_completed",
    title: `Projeto ${projectName} Concluído`,
    content: `O projeto ${projectName} foi marcado como concluído por ${completedBy}. Parabéns pela conclusão bem-sucedida!`,
    relatedId: projectId,
    relatedType: "project",
  });
}

/**
 * Obtém estatísticas da fila de notificações
 */
export function getQueueStats() {
  return {
    queueLength: notificationQueue.length,
    items: notificationQueue.map((item) => ({
      type: item.type,
      retries: item.retries || 0,
      maxRetries: item.maxRetries || MAX_RETRIES,
    })),
  };
}

/**
 * Limpa a fila de notificações (para testes)
 */
export function clearQueue() {
  notificationQueue.length = 0;
}

/**
 * Processa notificações pendentes manualmente
 */
export async function processManually() {
  return processNotificationQueue();
}
