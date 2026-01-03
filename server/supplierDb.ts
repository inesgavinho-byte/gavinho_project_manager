import { getDb } from "./db";
import { supplierTransactions, supplierEvaluations, InsertSupplierTransaction, InsertSupplierEvaluation } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// Supplier Transactions
export async function createSupplierTransaction(transaction: InsertSupplierTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(supplierTransactions).values(transaction);
}

export async function getSupplierTransactions(supplierId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(supplierTransactions)
    .where(eq(supplierTransactions.supplierId, supplierId))
    .orderBy(desc(supplierTransactions.transactionDate));
}

export async function getTransactionsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(supplierTransactions)
    .where(eq(supplierTransactions.projectId, projectId))
    .orderBy(desc(supplierTransactions.transactionDate));
}

export async function updateTransactionStatus(
  transactionId: number,
  status: "pending" | "completed" | "cancelled",
  paidDate?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  if (paidDate) {
    updateData.paidDate = paidDate;
  }

  await db
    .update(supplierTransactions)
    .set(updateData)
    .where(eq(supplierTransactions.id, transactionId));
}

// Supplier Evaluations
export async function createSupplierEvaluation(evaluation: InsertSupplierEvaluation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(supplierEvaluations).values(evaluation);
}

export async function getSupplierEvaluations(supplierId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(supplierEvaluations)
    .where(eq(supplierEvaluations.supplierId, supplierId))
    .orderBy(desc(supplierEvaluations.evaluatedAt));
}

export async function getEvaluationsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(supplierEvaluations)
    .where(eq(supplierEvaluations.projectId, projectId))
    .orderBy(desc(supplierEvaluations.evaluatedAt));
}

export async function updateSupplierEvaluation(
  evaluationId: number,
  updates: Partial<InsertSupplierEvaluation>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(supplierEvaluations)
    .set(updates)
    .where(eq(supplierEvaluations.id, evaluationId));
}

export async function deleteSupplierEvaluation(evaluationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(supplierEvaluations)
    .where(eq(supplierEvaluations.id, evaluationId));
}
