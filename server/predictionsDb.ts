import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { projectPredictions, type InsertProjectPrediction, type ProjectPrediction } from "../drizzle/schema";

export async function createPrediction(prediction: InsertProjectPrediction): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(projectPredictions).values(prediction);
}

export async function getProjectPredictions(projectId: number): Promise<ProjectPrediction[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(projectPredictions)
    .where(eq(projectPredictions.projectId, projectId))
    .orderBy(desc(projectPredictions.analysisDate));
}

export async function getLatestPrediction(
  projectId: number,
  type: "delay" | "cost" | "risk"
): Promise<ProjectPrediction | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db
    .select()
    .from(projectPredictions)
    .where(eq(projectPredictions.projectId, projectId))
    .orderBy(desc(projectPredictions.analysisDate))
    .limit(1);

  return results[0];
}

export async function getAllPredictionsByType(
  type: "delay" | "cost" | "risk"
): Promise<ProjectPrediction[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(projectPredictions)
    .where(eq(projectPredictions.predictionType, type))
    .orderBy(desc(projectPredictions.analysisDate));
}

export async function getCriticalPredictions(): Promise<ProjectPrediction[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(projectPredictions)
    .where(eq(projectPredictions.riskLevel, "critical"))
    .orderBy(desc(projectPredictions.analysisDate));
}
