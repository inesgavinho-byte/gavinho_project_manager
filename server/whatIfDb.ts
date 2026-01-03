import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { whatIfScenarios, type InsertWhatIfScenario, type WhatIfScenario } from "../drizzle/schema";

export async function createScenario(scenario: InsertWhatIfScenario): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(whatIfScenarios).values(scenario);
}

export async function getProjectScenarios(projectId: number): Promise<WhatIfScenario[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(whatIfScenarios)
    .where(eq(whatIfScenarios.projectId, projectId))
    .orderBy(desc(whatIfScenarios.createdAt));
}

export async function getScenarioById(id: number): Promise<WhatIfScenario | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const results = await db
    .select()
    .from(whatIfScenarios)
    .where(eq(whatIfScenarios.id, id))
    .limit(1);

  return results[0];
}

export async function getFavoriteScenarios(projectId: number): Promise<WhatIfScenario[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(whatIfScenarios)
    .where(eq(whatIfScenarios.projectId, projectId))
    .orderBy(desc(whatIfScenarios.createdAt));
}

export async function toggleFavorite(id: number, isFavorite: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(whatIfScenarios)
    .set({ isFavorite: isFavorite ? 1 : 0 })
    .where(eq(whatIfScenarios.id, id));
}

export async function deleteScenario(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(whatIfScenarios).where(eq(whatIfScenarios.id, id));
}
