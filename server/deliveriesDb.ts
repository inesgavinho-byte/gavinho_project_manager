import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { projectDeliveries, deliveryApprovals } from "../drizzle/schema";

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
