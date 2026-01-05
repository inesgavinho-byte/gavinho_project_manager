import { getDb } from "./db";
import { mqtCategories, mqtItems, type InsertMqtCategory, type InsertMqtItem } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Get or create MQT category by name
 */
export async function getOrCreateCategory(constructionId: number, categoryName: string, code: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Try to find existing category
  const existing = await db
    .select()
    .from(mqtCategories)
    .where(
      and(
        eq(mqtCategories.constructionId, constructionId),
        eq(mqtCategories.code, code)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new category
  const result = await db.insert(mqtCategories).values({
    constructionId,
    code,
    namePt: categoryName,
    order: parseInt(code) || 999,
  });

  return Number((result as any).insertId);
}

/**
 * Create MQT item
 */
export async function createMqtItem(item: InsertMqtItem) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const result = await db.insert(mqtItems).values(item);
  return Number((result as any).insertId);
}

/**
 * Get all items for a construction
 */
export async function getMqtItems(constructionId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  return await db
    .select()
    .from(mqtItems)
    .where(eq(mqtItems.constructionId, constructionId))
    .orderBy(mqtItems.order);
}

/**
 * Check if item code already exists
 */
export async function itemCodeExists(constructionId: number, code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const result = await db
    .select()
    .from(mqtItems)
    .where(
      and(
        eq(mqtItems.constructionId, constructionId),
        eq(mqtItems.code, code)
      )
    )
    .limit(1);

  return result.length > 0;
}
