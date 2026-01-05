import { getDb } from "./db";
import { constructions, mqtCategories, mqtItems } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import type { InsertConstruction, InsertMqtCategory, InsertMqtItem } from "../drizzle/schema";

// ==================== CONSTRUCTIONS ====================

export async function getAllConstructions() {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(constructions)
    .orderBy(desc(constructions.createdAt));
}

export async function getConstructionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db
    .select()
    .from(constructions)
    .where(eq(constructions.id, id))
    .limit(1);
  
  return results[0] || null;
}

export async function getConstructionByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db
    .select()
    .from(constructions)
    .where(eq(constructions.code, code))
    .limit(1);
  
  return results[0] || null;
}

export async function createConstruction(data: InsertConstruction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(constructions).values(data);
  return result[0].insertId;
}

export async function updateConstruction(id: number, data: Partial<InsertConstruction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(constructions)
    .set(data)
    .where(eq(constructions.id, id));
  
  return true;
}

export async function deleteConstruction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(constructions).where(eq(constructions.id, id));
  return true;
}

// ==================== MQT CATEGORIES ====================

export async function getMqtCategoriesByConstruction(constructionId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(mqtCategories)
    .where(eq(mqtCategories.constructionId, constructionId))
    .orderBy(mqtCategories.order);
}

export async function createMqtCategory(data: InsertMqtCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mqtCategories).values(data);
  return result[0].insertId;
}

export async function updateMqtCategory(id: number, data: Partial<InsertMqtCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(mqtCategories)
    .set(data)
    .where(eq(mqtCategories.id, id));
  
  return true;
}

export async function deleteMqtCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(mqtCategories).where(eq(mqtCategories.id, id));
  return true;
}

// ==================== MQT ITEMS ====================

export async function getMqtItemsByConstruction(constructionId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(mqtItems)
    .where(eq(mqtItems.constructionId, constructionId))
    .orderBy(mqtItems.order);
}

export async function getMqtItemsByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(mqtItems)
    .where(eq(mqtItems.categoryId, categoryId))
    .orderBy(mqtItems.order);
}

export async function createMqtItem(data: InsertMqtItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mqtItems).values(data);
  return result[0].insertId;
}

export async function updateMqtItem(id: number, data: Partial<InsertMqtItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(mqtItems)
    .set(data)
    .where(eq(mqtItems.id, id));
  
  return true;
}

export async function updateMqtItemQuantityExecuted(id: number, quantityExecuted: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(mqtItems)
    .set({ quantityExecuted })
    .where(eq(mqtItems.id, id));
  
  return true;
}

export async function deleteMqtItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(mqtItems).where(eq(mqtItems.id, id));
  return true;
}

// ==================== STATISTICS ====================

export async function getConstructionStatistics(constructionId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const items = await getMqtItemsByConstruction(constructionId);
  
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.status === "completed").length;
  const pendingItems = items.filter((item) => item.status === "pending").length;
  const inProgressItems = items.filter((item) => item.status === "in_progress").length;
  
  const totalBudget = items.reduce((sum, item) => {
    const price = item.totalPrice ? parseFloat(item.totalPrice.toString()) : 0;
    return sum + price;
  }, 0);
  
  return {
    totalItems,
    completedItems,
    pendingItems,
    inProgressItems,
    totalBudget,
    completionPercentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
  };
}
