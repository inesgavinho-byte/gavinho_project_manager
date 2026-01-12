import { getDb } from "./db";
import { notifications } from "../drizzle/schema";
import { notifyOwner } from "./_core/notification";
import { eq } from "drizzle-orm";

export interface ApprovalNotificationInput {
  type: "supplier_evaluated" | "project_status_changed" | "project_completed";
  title: string;
  content: string;
  relatedId: number;
  relatedType: "supplier" | "project" | "evaluation";
  userId?: number;
}

export async function createApprovalNotification(input: ApprovalNotificationInput) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();

  // Create notification in database
  const result = await db.insert(notifications).values({
    userId: input.userId,
    title: input.title,
    content: input.content,
    type: input.type,
    relatedId: input.relatedId,
    relatedType: input.relatedType,
    isRead: false,
    createdAt: now.toISOString(),
  });

  // Send owner notification for critical events
  if (input.type === "supplier_evaluated" || input.type === "project_completed") {
    await notifyOwner({
      title: input.title,
      content: input.content,
    });
  }

  return result;
}

export async function notifySupplierEvaluation(
  supplierId: number,
  supplierName: string,
  rating: number,
  evaluatedBy: string
) {
  const ratingText = rating >= 4.5 ? "excelente" : rating >= 3.5 ? "bom" : "precisa melhorar";

  return createApprovalNotification({
    type: "supplier_evaluated",
    title: `Fornecedor ${supplierName} Avaliado`,
    content: `O fornecedor ${supplierName} recebeu uma avaliação ${ratingText} (${rating}/5) por ${evaluatedBy}. Verifique os detalhes no módulo de Avaliações de Fornecedores.`,
    relatedId: supplierId,
    relatedType: "supplier",
  });
}

export async function notifyProjectStatusChange(
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

  return createApprovalNotification({
    type: "project_status_changed",
    title: `Projeto ${projectName} - Status Alterado`,
    content: `O status do projeto ${projectName} foi alterado de ${statusLabels[oldStatus] || oldStatus} para ${statusLabels[newStatus] || newStatus} por ${changedBy}.`,
    relatedId: projectId,
    relatedType: "project",
  });
}

export async function notifyProjectCompletion(
  projectId: number,
  projectName: string,
  completedBy: string
) {
  return createApprovalNotification({
    type: "project_completed",
    title: `Projeto ${projectName} Concluído`,
    content: `O projeto ${projectName} foi marcado como concluído por ${completedBy}. Parabéns pela conclusão bem-sucedida!`,
    relatedId: projectId,
    relatedType: "project",
  });
}

export async function getUnreadNotifications(userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  let query = db.select().from(notifications).where(eq(notifications.isRead, false));

  if (userId) {
    query = query.where(eq(notifications.userId, userId));
  }

  return query;
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  let query = db.update(notifications).set({ isRead: true });

  if (userId) {
    query = query.where(eq(notifications.userId, userId));
  }

  return query;
}

export async function deleteNotification(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db.delete(notifications).where(eq(notifications.id, notificationId));
}

export async function getNotificationStats(userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  let query = db.select().from(notifications);

  if (userId) {
    query = query.where(eq(notifications.userId, userId));
  }

  const allNotifications = await query;

  return {
    total: allNotifications.length,
    unread: allNotifications.filter((n: any) => !n.isRead).length,
    byType: {
      supplier_evaluated: allNotifications.filter((n: any) => n.type === "supplier_evaluated").length,
      project_status_changed: allNotifications.filter((n: any) => n.type === "project_status_changed").length,
      project_completed: allNotifications.filter((n: any) => n.type === "project_completed").length,
    },
  };
}
