import { getDb } from "./db";
import { supplierTransactions, supplierEvaluations } from "../drizzle/schema";
// import { InsertSupplierTransaction, InsertSupplierEvaluation } from "../drizzle/schema"; // Types not exported
import { eq, desc, and } from "drizzle-orm";

// Supplier Transactions
export async function createSupplierTransaction(transaction: any) {
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
export async function createSupplierEvaluation(evaluation: any) {
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
  updates: any
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


// Supplier-Project Associations
export async function associateSupplierProjects(
  supplierId: number,
  projectIds: number[],
  category?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Import supplierProjects from schema
  const { supplierProjects } = await import("../drizzle/schema");

  // Delete existing associations
  await db.delete(supplierProjects).where(eq(supplierProjects.supplierId, supplierId));

  // Insert new associations
  if (projectIds.length > 0) {
    await db.insert(supplierProjects).values(
      projectIds.map(projectId => ({
        supplierId,
        projectId,
        category: category || null,
        totalValue: null,
      }))
    );
  }
}

export async function getSupplierProjects(supplierId: number) {
  const db = await getDb();
  if (!db) return [];

  const { supplierProjects, projects } = await import("../drizzle/schema");

  return await db
    .select({
      id: supplierProjects.id,
      projectId: projects.id,
      projectName: projects.name,
      projectStatus: projects.status,
      category: supplierProjects.category,
      totalValue: supplierProjects.totalValue,
    })
    .from(supplierProjects)
    .innerJoin(projects, eq(supplierProjects.projectId, projects.id))
    .where(eq(supplierProjects.supplierId, supplierId));
}
