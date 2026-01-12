/**
 * Database functions for contract processing history
 */

import { getDb } from "./db";
// TODO: Restore after fixing contractProcessingHistory table schema
// import { contractProcessingHistory, type InsertContractProcessingHistory, type ContractProcessingHistory } from "../drizzle/schema";
// import { eq, desc } from "drizzle-orm";

// Placeholder types for disabled functionality
type InsertContractProcessingHistory = any;
type ContractProcessingHistory = any;

/**
 * Create a new contract processing history record
 */
export async function createContractHistory(data: InsertContractProcessingHistory): Promise<number> {
  const db = await getDb();
  const result = await db.insert(contractProcessingHistory).values(data);
  return result[0].insertId;
}

/**
 * Update contract processing history
 */
export async function updateContractHistory(
  id: number,
  data: Partial<InsertContractProcessingHistory>
): Promise<void> {
  const db = await getDb();
  await db
    .update(contractProcessingHistory)
    .set(data)
    .where(eq(contractProcessingHistory.id, id));
}

/**
 * Get all contract processing history for a project
 */
export async function getContractHistoryByProject(projectId: number): Promise<ContractProcessingHistory[]> {
  const db = await getDb();
  return db
    .select()
    .from(contractProcessingHistory)
    .where(eq(contractProcessingHistory.projectId, projectId))
    .orderBy(desc(contractProcessingHistory.createdAt));
}

/**
 * Get all contract processing history (all projects)
 */
export async function getAllContractHistory(): Promise<ContractProcessingHistory[]> {
  const db = await getDb();
  return db
    .select()
    .from(contractProcessingHistory)
    .orderBy(desc(contractProcessingHistory.createdAt));
}

/**
 * Get a single contract processing history record by ID
 */
export async function getContractHistoryById(id: number): Promise<ContractProcessingHistory | null> {
  const db = await getDb();
  const results = await db
    .select()
    .from(contractProcessingHistory)
    .where(eq(contractProcessingHistory.id, id))
    .limit(1);
  
  return results[0] || null;
}

/**
 * Delete contract processing history record
 */
export async function deleteContractHistory(id: number): Promise<void> {
  const db = await getDb();
  await db
    .delete(contractProcessingHistory)
    .where(eq(contractProcessingHistory.id, id));
}
