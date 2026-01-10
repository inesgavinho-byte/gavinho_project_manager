import { eq, desc, and, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { users, auditLogs, projectClientAccess } from "../drizzle/schema";
import type { InsertAuditLog, InsertProjectClientAccess } from "../drizzle/schema";

// ============= USER MANAGEMENT =============

export async function getAllUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "client") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
  return { success: true };
}

export async function getUsersByRole(role: "user" | "admin" | "client") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt));
}

// ============= AUDIT LOGS =============

export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(auditLogs).values(data);
  return result[0].insertId;
}

export async function getAuditLogs(filters?: {
  userId?: number;
  action?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(auditLogs);
  
  const conditions = [];
  if (filters?.userId) conditions.push(eq(auditLogs.userId, filters.userId));
  if (filters?.action) conditions.push(eq(auditLogs.action, filters.action));
  if (filters?.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const results = await query.orderBy(desc(auditLogs.createdAt)).limit(filters?.limit || 100);
  return results;
}

export async function getAuditLogsByEntity(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(auditLogs)
    .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
    .orderBy(desc(auditLogs.createdAt));
}

// ============= PROJECT CLIENT ACCESS =============

export async function grantClientAccess(data: InsertProjectClientAccess) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projectClientAccess).values(data);
  return result[0].insertId;
}

export async function revokeClientAccess(projectId: number, clientUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(projectClientAccess)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(projectClientAccess.projectId, projectId),
        eq(projectClientAccess.clientUserId, clientUserId),
        isNull(projectClientAccess.revokedAt)
      )
    );
  return { success: true };
}

export async function getClientProjects(clientUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(projectClientAccess)
    .where(
      and(
        eq(projectClientAccess.clientUserId, clientUserId),
        isNull(projectClientAccess.revokedAt)
      )
    );
}

export async function getProjectClients(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(projectClientAccess)
    .where(
      and(
        eq(projectClientAccess.projectId, projectId),
        isNull(projectClientAccess.revokedAt)
      )
    );
}

export async function hasClientAccess(projectId: number, clientUserId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(projectClientAccess)
    .where(
      and(
        eq(projectClientAccess.projectId, projectId),
        eq(projectClientAccess.clientUserId, clientUserId),
        isNull(projectClientAccess.revokedAt)
      )
    )
    .limit(1);
  return result.length > 0;
}
