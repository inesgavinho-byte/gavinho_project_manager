import { eq, and, gte, lte, desc, sql, isNull } from "drizzle-orm";
import { getDb } from "./db";
import {
  projectDeliveries,
  deliveryApprovals,
  deliveryVersions,
  deliveryChecklists,
  checklistItems,
  clientDeliveryApprovals,
  deliveryNotifications,
  deliveryAuditLog,
  deliveryReminders,
  deliveryReports,
} from "../drizzle/schema";

// ============================================================================
// DELIVERIES
// ============================================================================

export async function listDeliveries(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(projectDeliveries)
    .where(eq(projectDeliveries.projectId, projectId))
    .orderBy(projectDeliveries.dueDate);
}

export async function getDelivery(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const results = await db
    .select()
    .from(projectDeliveries)
    .where(eq(projectDeliveries.id, id))
    .limit(1);
  return results[0] || null;
}

export async function createDelivery(data: {
  projectId: number;
  phaseId?: number;
  name: string;
  description?: string;
  type: string;
  dueDate: Date;
  assignedToId?: number;
  priority: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectDeliveries).values({
    projectId: data.projectId,
    phaseId: data.phaseId,
    name: data.name,
    description: data.description,
    type: data.type as any,
    dueDate: data.dueDate,
    assignedToId: data.assignedToId,
    priority: data.priority as any,
    status: "pending",
    notificationSent: 0,
  });
  return Number(result[0].insertId);
}

export async function updateDelivery(
  id: number,
  data: {
    name?: string;
    description?: string;
    type?: string;
    dueDate?: Date;
    status?: string;
    assignedToId?: number;
    priority?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(projectDeliveries)
    .set(data as any)
    .where(eq(projectDeliveries.id, id));
}

export async function uploadDeliveryFile(
  id: number,
  fileUrl: string,
  fileKey: string,
  fileSize: number,
  uploadedById: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(projectDeliveries)
    .set({
      fileUrl,
      fileKey,
      fileSize,
      uploadedById,
      uploadedAt: new Date(),
      status: "delivered",
    })
    .where(eq(projectDeliveries.id, id));
}

export async function deleteDelivery(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projectDeliveries).where(eq(projectDeliveries.id, id));
}

export async function getUpcomingDeliveries(projectId: number, days: number = 30) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return db
    .select()
    .from(projectDeliveries)
    .where(
      and(
        eq(projectDeliveries.projectId, projectId),
        gte(projectDeliveries.dueDate, now),
        lte(projectDeliveries.dueDate, futureDate),
        eq(projectDeliveries.status, "pending")
      )
    )
    .orderBy(projectDeliveries.dueDate);
}

export async function getDeliveriesNeedingNotification() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  return db
    .select()
    .from(projectDeliveries)
    .where(
      and(
        eq(projectDeliveries.status, "pending"),
        eq(projectDeliveries.notificationSent, 0),
        gte(projectDeliveries.dueDate, twoDaysFromNow),
        lte(projectDeliveries.dueDate, threeDaysFromNow)
      )
    );
}

export async function markNotificationSent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(projectDeliveries)
    .set({ notificationSent: 1 })
    .where(eq(projectDeliveries.id, id));
}

export async function getDeliveryStats(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const allDeliveries = await db
    .select()
    .from(projectDeliveries)
    .where(eq(projectDeliveries.projectId, projectId));

  const now = new Date();
  
  const stats = {
    total: allDeliveries.length,
    pending: allDeliveries.filter(d => d.status === "pending").length,
    delivered: allDeliveries.filter(d => d.status === "delivered").length,
    approved: allDeliveries.filter(d => d.status === "approved").length,
    rejected: allDeliveries.filter(d => d.status === "rejected").length,
    overdue: allDeliveries.filter(d => 
      d.status === "pending" && new Date(d.dueDate) < now
    ).length,
    upcoming: allDeliveries.filter(d => {
      const dueDate = new Date(d.dueDate);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      return d.status === "pending" && dueDate >= now && dueDate <= sevenDaysFromNow;
    }).length,
  };

  return stats;
}

// ============================================================================
// APPROVALS
// ============================================================================

export async function listApprovals(deliveryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(deliveryApprovals)
    .where(eq(deliveryApprovals.deliveryId, deliveryId))
    .orderBy(desc(deliveryApprovals.createdAt));
}

export async function createApproval(data: {
  deliveryId: number;
  reviewerId: number;
  status: "approved" | "rejected" | "revision_requested";
  comments?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Insert approval record
  const result = await db.insert(deliveryApprovals).values({
    deliveryId: data.deliveryId,
    reviewerId: data.reviewerId,
    status: data.status,
    comments: data.comments,
  });
  const approvalId = Number(result[0].insertId);

  // Update delivery status
  let newStatus: string;
  if (data.status === "approved") {
    newStatus = "approved";
  } else if (data.status === "rejected") {
    newStatus = "rejected";
  } else {
    newStatus = "in_review";
  }

  await db
    .update(projectDeliveries)
    .set({ status: newStatus as any })
    .where(eq(projectDeliveries.id, data.deliveryId));

  return approvalId;
}

// ============================================================================
// VERSIONAMENTO DE ENTREGAS
// ============================================================================

export async function createDeliveryVersion(data: {
  deliveryId: number;
  version: number;
  versionNotes?: string;
  fileUrl: string;
  fileKey: string;
  fileSize: number;
  uploadedById: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(deliveryVersions).values(data);
  
  // Log to audit trail
  await logDeliveryAction(data.deliveryId, "version_uploaded", data.uploadedById, {
    version: data.version,
    versionNotes: data.versionNotes,
  });
  
  return result;
}

export async function getDeliveryVersions(deliveryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.query.deliveryVersions.findMany({
    where: eq(deliveryVersions.deliveryId, deliveryId),
    orderBy: [desc(deliveryVersions.version)],
  });
}

export async function getLatestDeliveryVersion(deliveryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const versions = await db.query.deliveryVersions.findMany({
    where: eq(deliveryVersions.deliveryId, deliveryId),
    orderBy: [desc(deliveryVersions.version)],
    limit: 1,
  });
  return versions[0] || null;
}

export async function getNextVersionNumber(deliveryId: number): Promise<number> {
  const latest = await getLatestDeliveryVersion(deliveryId);
  return (latest?.version || 0) + 1;
}

// ============================================================================
// CHECKLISTS AUTOMÁTICOS
// ============================================================================

export async function createDeliveryChecklist(data: {
  deliveryId: number;
  deliveryType: string;
  title: string;
  description?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deliveryChecklists).values(data);
  return result;
}

export async function getDeliveryChecklist(deliveryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.query.deliveryChecklists.findFirst({
    where: eq(deliveryChecklists.deliveryId, deliveryId),
    with: {
      items: {
        orderBy: [checklistItems.order],
      },
    },
  });
}

export async function addChecklistItem(data: {
  checklistId: number;
  title: string;
  description?: string;
  order: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(checklistItems).values({
    ...data,
    isCompleted: 0,
  });
}

export async function completeChecklistItem(itemId: number, completedById: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(checklistItems)
    .set({
      isCompleted: 1,
      completedBy: completedById,
      completedAt: new Date(),
    })
    .where(eq(checklistItems.id, itemId));
}

export async function getChecklistCompletion(checklistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const items = await db.query.checklistItems.findMany({
    where: eq(checklistItems.checklistId, checklistId),
  });
  
  const completed = items.filter((i) => i.isCompleted === 1).length;
  const total = items.length;
  
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// ============================================================================
// APROVAÇÃO DO CLIENTE
// ============================================================================

export async function createClientApprovalRequest(deliveryId: number, clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientDeliveryApprovals).values({
    deliveryId,
    clientId,
    status: "pending",
  });
  
  // Log to audit trail
  await logDeliveryAction(deliveryId, "approval_requested_from_client", clientId);
  
  return result;
}

export async function approveDeliveryAsClient(
  deliveryId: number,
  clientId: number,
  feedback?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update approval status
  await db
    .update(clientDeliveryApprovals)
    .set({
      status: "approved",
      feedback,
      approvedAt: new Date(),
    })
    .where(
      and(
        eq(clientDeliveryApprovals.deliveryId, deliveryId),
        eq(clientDeliveryApprovals.clientId, clientId)
      )
    );
  
  // Update delivery status
  await updateDelivery(deliveryId, { status: "approved" });
  
  // Log to audit trail
  await logDeliveryAction(deliveryId, "approved_by_client", clientId, { feedback });
  
  return true;
}

export async function rejectDeliveryAsClient(
  deliveryId: number,
  clientId: number,
  rejectionReason: string,
  feedback?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Update approval status
  await db
    .update(clientDeliveryApprovals)
    .set({
      status: "rejected",
      rejectionReason,
      feedback,
      approvedAt: new Date(),
    })
    .where(
      and(
        eq(clientDeliveryApprovals.deliveryId, deliveryId),
        eq(clientDeliveryApprovals.clientId, clientId)
      )
    );
  
  // Update delivery status
  await updateDelivery(deliveryId, { status: "rejected" });
  
  // Log to audit trail
  await logDeliveryAction(deliveryId, "rejected_by_client", clientId, {
    rejectionReason,
    feedback,
  });
  
  return true;
}

export async function requestRevisionAsClient(
  deliveryId: number,
  clientId: number,
  feedback: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(clientDeliveryApprovals)
    .set({
      status: "revision_requested",
      feedback,
    })
    .where(
      and(
        eq(clientDeliveryApprovals.deliveryId, deliveryId),
        eq(clientDeliveryApprovals.clientId, clientId)
      )
    );
  
  // Update delivery status
  await updateDelivery(deliveryId, { status: "in_review" });
  
  // Log to audit trail
  await logDeliveryAction(deliveryId, "revision_requested_by_client", clientId, { feedback });
  
  return true;
}

export async function getClientApprovalStatus(deliveryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.query.clientDeliveryApprovals.findFirst({
    where: eq(clientDeliveryApprovals.deliveryId, deliveryId),
  });
}

// ============================================================================
// NOTIFICAÇÕES
// ============================================================================

export async function createDeliveryNotification(data: {
  deliveryId: number;
  type:
    | "deadline_reminder"
    | "approval_request"
    | "approval_received"
    | "rejection_notice"
    | "revision_requested"
    | "follow_up";
  recipientId: number;
  message: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(deliveryNotifications).values(data);
}

export async function getUnreadDeliveryNotifications(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.query.deliveryNotifications.findMany({
    where: and(
      eq(deliveryNotifications.recipientId, userId),
      isNull(deliveryNotifications.readAt)
    ),
    orderBy: [desc(deliveryNotifications.sentAt)],
  });
}

export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(deliveryNotifications)
    .set({ readAt: new Date() })
    .where(eq(deliveryNotifications.id, notificationId));
}

// ============================================================================
// AUDITORIA
// ============================================================================

export async function logDeliveryAction(
  deliveryId: number,
  action: string,
  performedBy: number,
  details?: Record<string, any>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(deliveryAuditLog).values({
    deliveryId,
    action,
    performedBy,
    details: details ? JSON.stringify(details) : null,
  });
}

export async function getDeliveryAuditLog(deliveryId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.query.deliveryAuditLog.findMany({
    where: eq(deliveryAuditLog.deliveryId, deliveryId),
    orderBy: [desc(deliveryAuditLog.createdAt)],
  });
}

// ============================================================================
// LEMBRETES AUTOMÁTICOS
// ============================================================================

export async function createDeliveryReminder(data: {
  deliveryId: number;
  reminderType:
    | "1_day_before"
    | "3_days_before"
    | "7_days_before"
    | "1_day_after"
    | "3_days_after"
    | "7_days_after";
  scheduledFor: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(deliveryReminders).values({
    ...data,
    status: "pending",
  });
}

export async function getPendingReminders() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.query.deliveryReminders.findMany({
    where: and(
      eq(deliveryReminders.status, "pending"),
      lte(deliveryReminders.scheduledFor, new Date())
    ),
  });
}

export async function markReminderAsSent(reminderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(deliveryReminders)
    .set({ sentAt: new Date(), status: "sent" })
    .where(eq(deliveryReminders.id, reminderId));
}

// ============================================================================
// RELATÓRIOS E MÉTRICAS
// ============================================================================

export async function calculateDeliveryMetrics(projectId: number, phaseId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const whereCondition = phaseId
    ? and(eq(projectDeliveries.projectId, projectId), eq(projectDeliveries.phaseId, phaseId))
    : eq(projectDeliveries.projectId, projectId);
  
  const deliveries = await db.query.projectDeliveries.findMany({
    where: whereCondition,
  });
  
  const now = new Date();
  const onTime = deliveries.filter((d) => d.dueDate <= now && d.status === "approved").length;
  const late = deliveries.filter((d) => d.dueDate < now && d.status !== "approved").length;
  const approved = deliveries.filter((d) => d.status === "approved").length;
  const rejected = deliveries.filter((d) => d.status === "rejected").length;
  
  return {
    total: deliveries.length,
    onTime,
    late,
    approved,
    rejected,
    pending: deliveries.filter((d) => d.status === "pending").length,
    inReview: deliveries.filter((d) => d.status === "in_review").length,
    complianceRate: deliveries.length > 0 ? Math.round((onTime / deliveries.length) * 100) : 0,
    acceptanceRate: deliveries.length > 0 ? Math.round((approved / deliveries.length) * 100) : 0,
  };
}

export async function getDeliveriesByStatus(
  projectId: number,
  status: "pending" | "in_review" | "approved" | "rejected" | "delivered"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.query.projectDeliveries.findMany({
    where: and(
      eq(projectDeliveries.projectId, projectId),
      eq(projectDeliveries.status, status)
    ),
    orderBy: [desc(projectDeliveries.dueDate)],
  });
}

export async function getOverdueDeliveries(projectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  
  const whereCondition = projectId
    ? and(
        eq(projectDeliveries.projectId, projectId),
        lte(projectDeliveries.dueDate, now),
        inArray(projectDeliveries.status, ["pending", "in_review"])
      )
    : and(
        lte(projectDeliveries.dueDate, now),
        inArray(projectDeliveries.status, ["pending", "in_review"])
      );
  
  return await db.query.projectDeliveries.findMany({
    where: whereCondition,
    orderBy: [desc(projectDeliveries.dueDate)],
  });
}

export async function getUpcomingDeliveriesAdvanced(projectId?: number, daysAhead: number = 7) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  
  const whereCondition = projectId
    ? and(
        eq(projectDeliveries.projectId, projectId),
        gte(projectDeliveries.dueDate, now),
        lte(projectDeliveries.dueDate, futureDate),
        inArray(projectDeliveries.status, ["pending", "in_review"])
      )
    : and(
        gte(projectDeliveries.dueDate, now),
        lte(projectDeliveries.dueDate, futureDate),
        inArray(projectDeliveries.status, ["pending", "in_review"])
      );
  
  return await db.query.projectDeliveries.findMany({
    where: whereCondition,
    orderBy: [projectDeliveries.dueDate],
  });
}

export async function saveDeliveryReport(data: {
  projectId: number;
  phaseId?: number;
  reportDate: Date;
  totalDeliveries: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  complianceRate: number;
  totalApprovals: number;
  approvedDeliveries: number;
  rejectedDeliveries: number;
  revisionRequested: number;
  acceptanceRate: number;
  avgApprovalTime?: number;
  avgTimeToRevision?: number;
  avgDaysLate: number;
  maxDaysLate: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(deliveryReports).values(data);
}

export async function getDeliveryReports(projectId: number, phaseId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const whereCondition = phaseId
    ? and(eq(deliveryReports.projectId, projectId), eq(deliveryReports.phaseId, phaseId))
    : eq(deliveryReports.projectId, projectId);
  
  return await db.query.deliveryReports.findMany({
    where: whereCondition,
    orderBy: [desc(deliveryReports.reportDate)],
  });
}