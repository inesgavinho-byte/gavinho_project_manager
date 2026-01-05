import { getDb } from "./db";
import { constructions, mqtCategories, mqtItems, mqtItemHistory } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import type { InsertConstruction, InsertMqtCategory, InsertMqtItem, InsertMqtItemHistory } from "../drizzle/schema";

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

export async function getMqtItemById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db
    .select()
    .from(mqtItems)
    .where(eq(mqtItems.id, id))
    .limit(1);
  
  return results[0] || null;
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

// ==================== MQT ITEM HISTORY ====================

export async function createMqtItemHistoryEntry(data: InsertMqtItemHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mqtItemHistory).values(data);
  return result[0].insertId;
}

export async function getMqtItemHistory(itemId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(mqtItemHistory)
    .where(eq(mqtItemHistory.itemId, itemId))
    .orderBy(desc(mqtItemHistory.changedAt));
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

// ==================== MQT HISTORY ANALYTICS ====================

export async function getMqtHistoryAnalytics(constructionId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get all items for this construction
  const items = await getMqtItemsByConstruction(constructionId);
  const itemIds = items.map(item => item.id);

  if (itemIds.length === 0) {
    return {
      totalChanges: 0,
      changes24h: 0,
      changes7d: 0,
      changes30d: 0,
      changeRate: 0,
    };
  }

  // Get all history entries for these items
  const allHistory = await db
    .select()
    .from(mqtItemHistory)
    .where(eq(mqtItemHistory.itemId, itemIds[0])); // Simplified for now

  const now = new Date();
  const day24hAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const changes24h = allHistory.filter(h => new Date(h.changedAt) >= day24hAgo).length;
  const changes7d = allHistory.filter(h => new Date(h.changedAt) >= day7Ago).length;
  const changes30d = allHistory.filter(h => new Date(h.changedAt) >= day30Ago).length;

  return {
    totalChanges: allHistory.length,
    changes24h,
    changes7d,
    changes30d,
    changeRate: changes30d > 0 ? (changes30d / 30).toFixed(2) : 0,
  };
}

export async function getMostEditedItems(constructionId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  // Get all items for this construction
  const items = await getMqtItemsByConstruction(constructionId);
  
  // Count changes for each item
  const itemChangeCounts = await Promise.all(
    items.map(async (item) => {
      const history = await getMqtItemHistory(item.id);
      return {
        item,
        changeCount: history.length,
      };
    })
  );

  // Sort by change count and return top N
  return itemChangeCounts
    .filter(ic => ic.changeCount > 0)
    .sort((a, b) => b.changeCount - a.changeCount)
    .slice(0, limit)
    .map(ic => ({
      itemId: ic.item.id,
      code: ic.item.code,
      descriptionPt: ic.item.descriptionPt,
      changeCount: ic.changeCount,
    }));
}

export async function getMostActiveUsers(constructionId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get all items for this construction
  const items = await getMqtItemsByConstruction(constructionId);
  const itemIds = items.map(item => item.id);

  if (itemIds.length === 0) return [];

  // Get all history entries
  const allHistory: any[] = [];
  for (const itemId of itemIds) {
    const history = await getMqtItemHistory(itemId);
    allHistory.push(...history);
  }

  // Count changes per user
  const userCounts: Record<string, number> = {};
  allHistory.forEach(h => {
    const userId = h.userId?.toString() || 'unknown';
    userCounts[userId] = (userCounts[userId] || 0) + 1;
  });

  // Convert to array and sort
  return Object.entries(userCounts)
    .map(([userId, count]) => ({
      userId,
      changeCount: count,
      percentage: ((count / allHistory.length) * 100).toFixed(1),
    }))
    .sort((a, b) => b.changeCount - a.changeCount);
}

export async function getCriticalDeviations(constructionId: number) {
  const db = await getDb();
  if (!db) return [];

  const items = await getMqtItemsByConstruction(constructionId);

  return items
    .filter(item => {
      const planned = parseFloat(item.quantity?.toString() || '0');
      const executed = parseFloat(item.quantityExecuted?.toString() || '0');
      if (planned === 0) return false;
      const percentage = (executed / planned) * 100;
      return percentage > 130 || percentage < 70;
    })
    .map(item => {
      const planned = parseFloat(item.quantity?.toString() || '0');
      const executed = parseFloat(item.quantityExecuted?.toString() || '0');
      const percentage = planned > 0 ? ((executed / planned) * 100).toFixed(1) : '0';
      return {
        itemId: item.id,
        code: item.code,
        descriptionPt: item.descriptionPt,
        planned,
        executed,
        percentage: parseFloat(percentage),
        deviation: parseFloat(percentage) - 100,
      };
    })
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
}

export async function getActivityTimeline(constructionId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return [];

  const items = await getMqtItemsByConstruction(constructionId);
  const itemIds = items.map(item => item.id);

  if (itemIds.length === 0) return [];

  // Get all history entries
  const allHistory: any[] = [];
  for (const itemId of itemIds) {
    const history = await getMqtItemHistory(itemId);
    allHistory.push(...history);
  }

  // Group by date
  const dateGroups: Record<string, number> = {};
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  allHistory
    .filter(h => new Date(h.changedAt) >= startDate)
    .forEach(h => {
      const date = new Date(h.changedAt).toISOString().split('T')[0];
      dateGroups[date] = (dateGroups[date] || 0) + 1;
    });

  // Convert to array and sort by date
  return Object.entries(dateGroups)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
