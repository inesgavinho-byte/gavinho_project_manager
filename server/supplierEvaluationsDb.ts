import { getDb } from "./db";
import { supplierEvaluations, suppliers } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

interface CreateEvaluationInput {
  supplierId: number;
  rating: number;
  quality?: number;
  timeliness?: number;
  communication?: number;
  comments?: string;
  projectId?: number;
  evaluatedBy?: number;
}

interface EvaluationFilter {
  period?: "7d" | "30d" | "90d" | "all";
  supplierId?: number;
}

export async function createSupplierEvaluation(input: CreateEvaluationInput) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const now = new Date();
  const result = await db.insert(supplierEvaluations).values({
    supplierId: input.supplierId,
    rating: input.rating,
    quality: input.quality || input.rating,
    timeliness: input.timeliness || input.rating,
    communication: input.communication || input.rating,
    comments: input.comments,
    projectId: input.projectId,
    evaluatedBy: input.evaluatedBy,
    evaluatedAt: now.toISOString(),
  });

  return result;
}

export async function getSupplierEvaluations(filter: EvaluationFilter) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  let conditions: any[] = [];

  // Apply date filter
  if (filter.period && filter.period !== "all") {
    const now = new Date();
    const daysAgo = filter.period === "7d" ? 7 : filter.period === "30d" ? 30 : 90;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    conditions.push(
      gte(supplierEvaluations.evaluatedAt, startDate.toISOString())
    );
    conditions.push(
      lte(supplierEvaluations.evaluatedAt, now.toISOString())
    );
  }

  // Apply supplier filter
  if (filter.supplierId) {
    conditions.push(eq(supplierEvaluations.supplierId, filter.supplierId));
  }

  if (conditions.length === 0) {
    return db.select().from(supplierEvaluations);
  }

  return db.select().from(supplierEvaluations).where(and(...conditions));
}

export async function getSupplierEvaluationStats(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const evals = await db
    .select()
    .from(supplierEvaluations)
    .where(eq(supplierEvaluations.supplierId, supplierId));

  if (evals.length === 0) {
    return null;
  }

  const avgRating = evals.reduce((sum, e) => sum + e.rating, 0) / evals.length;
  const avgQuality = evals.reduce((sum, e) => sum + (e.quality || 0), 0) / evals.length;
  const avgTimeliness = evals.reduce((sum, e) => sum + (e.timeliness || 0), 0) / evals.length;
  const avgCommunication = evals.reduce((sum, e) => sum + (e.communication || 0), 0) / evals.length;

  return {
    supplierId,
    evaluationCount: evals.length,
    avgRating,
    avgQuality,
    avgTimeliness,
    avgCommunication,
    lastEvaluation: evals[evals.length - 1]?.evaluatedAt,
  };
}

export async function updateSupplierEvaluation(
  id: number,
  input: Partial<CreateEvaluationInput>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .update(supplierEvaluations)
    .set({
      rating: input.rating,
      quality: input.quality,
      timeliness: input.timeliness,
      communication: input.communication,
      comments: input.comments,
    })
    .where(eq(supplierEvaluations.id, id));

  return result;
}

export async function deleteSupplierEvaluation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db.delete(supplierEvaluations).where(eq(supplierEvaluations.id, id));
}

export async function getSupplierEvaluationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const result = await db
    .select()
    .from(supplierEvaluations)
    .where(eq(supplierEvaluations.id, id));

  return result[0] || null;
}

export async function getSupplierEvaluationHistory(supplierId: number, limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  return db
    .select()
    .from(supplierEvaluations)
    .where(eq(supplierEvaluations.supplierId, supplierId))
    .orderBy(supplierEvaluations.evaluatedAt)
    .limit(limit);
}
