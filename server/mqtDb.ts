import { getDb } from "./db";
import { mqtCategories, mqtItems, mqtImportHistory, mqtImportItems, mqtValidationRules, type InsertMqtCategory, type InsertMqtItem, type InsertMqtImportHistory, type InsertMqtImportItem, type InsertMqtValidationRule } from "../drizzle/schema";
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


/**
 * Create import history record
 */
export async function createImportHistory(data: Omit<InsertMqtImportHistory, 'id' | 'importedAt' | 'itemsSuccess' | 'itemsError' | 'errorLog'>) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const result = await db.insert(mqtImportHistory).values({
    ...data,
    itemsSuccess: 0,
    itemsError: 0,
  });
  return Number((result as any).insertId);
}

/**
 * Create import item record (track which items were added in an import)
 */
export async function createImportItem(importId: number, mqtItemId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const result = await db.insert(mqtImportItems).values({
    importId,
    mqtItemId,
  });
  return Number((result as any).insertId);
}

/**
 * Get import history for a construction
 */
export async function getImportHistory(constructionId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  return await db
    .select()
    .from(mqtImportHistory)
    .where(eq(mqtImportHistory.constructionId, constructionId))
    .orderBy(mqtImportHistory.importedAt);
}

/**
 * Revert an import (delete all items that were added in that import)
 */
export async function revertImport(importId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Get all items that were added in this import
  const importItems = await db
    .select()
    .from(mqtImportItems)
    .where(eq(mqtImportItems.importId, importId));
  
  // Delete all MQT items
  for (const item of importItems) {
    await db.delete(mqtItems).where(eq(mqtItems.id, item.mqtItemId));
  }
  
  // Delete import items records
  await db.delete(mqtImportItems).where(eq(mqtImportItems.importId, importId));
  
  // Delete import history record
  await db.delete(mqtImportHistory).where(eq(mqtImportHistory.id, importId));
  
  return { success: true, deletedItems: importItems.length };
}


/**
 * Get all validation rules for a construction
 */
export async function getValidationRules(constructionId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  return db
    .select()
    .from(mqtValidationRules)
    .where(eq(mqtValidationRules.constructionId, constructionId))
    .orderBy(mqtValidationRules.createdAt);
}

/**
 * Create a new validation rule
 */
export async function createValidationRule(data: InsertMqtValidationRule) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const [result] = await db.insert(mqtValidationRules).values(data);
  return result;
}

/**
 * Update a validation rule
 */
export async function updateValidationRule(id: number, data: Partial<InsertMqtValidationRule>) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  await db.update(mqtValidationRules).set(data).where(eq(mqtValidationRules.id, id));
  return { success: true };
}

/**
 * Delete a validation rule
 */
export async function deleteValidationRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  await db.delete(mqtValidationRules).where(eq(mqtValidationRules.id, id));
  return { success: true };
}

/**
 * Toggle validation rule enabled status
 */
export async function toggleValidationRule(id: number, enabled: boolean) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  await db.update(mqtValidationRules).set({ enabled }).where(eq(mqtValidationRules.id, id));
  return { success: true };
}
