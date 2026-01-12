import { eq, desc, and, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";

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
  await db.update(users).set({ role, updatedAt: new Date().toISOString() }).where(eq(users.id, userId));
  return { success: true };
}

export async function getUsersByRole(role: "user" | "admin" | "client") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt));
}

// TODO: Restore audit logs functions after fixing auditLogs table schema
// TODO: Restore client access functions after fixing projectClientAccess table schema

// Placeholder functions - to be restored after fixing table schemas
export async function createAuditLog() {
  throw new Error("Audit logs functionality disabled - table schema needs fixing");
}

export async function getAuditLogs() {
  throw new Error("Audit logs functionality disabled - table schema needs fixing");
}

export async function getAuditLogsByEntity() {
  throw new Error("Audit logs functionality disabled - table schema needs fixing");
}

export async function grantClientAccess() {
  throw new Error("Client access functionality disabled - table schema needs fixing");
}

export async function revokeClientAccess() {
  throw new Error("Client access functionality disabled - table schema needs fixing");
}

export async function getClientProjects(clientUserId: number) {
  // TODO: Restore after fixing projectClientAccess table schema
  throw new Error("Client projects functionality disabled - table schema needs fixing");
}

export async function getProjectClients(projectId: number) {
  // TODO: Restore after fixing projectClientAccess table schema
  throw new Error("Project clients functionality disabled - table schema needs fixing");
}

export async function hasClientAccess(projectId: number, clientUserId: number): Promise<boolean> {
  // TODO: Restore after fixing projectClientAccess table schema
  throw new Error("Client access check functionality disabled - table schema needs fixing");
}
