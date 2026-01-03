import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  projects, 
  InsertProject,
  quantityMaps,
  InsertQuantityMap,
  suppliers,
  InsertSupplier,
  orders,
  InsertOrder,
  tasks,
  InsertTask,
  emails,
  InsertEmail,
  budgets,
  InsertBudget,
  notifications,
  InsertNotification,
  aiSuggestions,
  InsertAISuggestion,
  reports,
  InsertReport,
  supplierTransactions,
  InsertSupplierTransaction
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Projects
export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(projects).values(project);
}

export async function updateProject(id: number, project: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(project).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(eq(projects.id, id));
}

// Quantity Maps
export async function getQuantityMapsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(quantityMaps).where(eq(quantityMaps.projectId, projectId));
}

export async function createQuantityMap(map: InsertQuantityMap) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(quantityMaps).values(map);
}

export async function updateQuantityMap(id: number, map: Partial<InsertQuantityMap>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(quantityMaps).set(map).where(eq(quantityMaps.id, id));
}

// Suppliers
export async function getAllSuppliers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
}

export async function getSupplierById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return result[0];
}

export async function createSupplier(supplier: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(suppliers).values(supplier);
}

export async function updateSupplier(id: number, supplier: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(suppliers).set(supplier).where(eq(suppliers.id, id));
}

// Orders
export async function getOrdersByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(orders).where(eq(orders.projectId, projectId)).orderBy(desc(orders.createdAt));
}

export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(orders).values(order);
}

export async function updateOrder(id: number, order: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(orders).set(order).where(eq(orders.id, id));
}

// Tasks
export async function getTasksByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(tasks.kanbanOrder);
}

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(tasks).values(task);
}

export async function updateTask(id: number, task: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(task).where(eq(tasks.id, id));
}

// Budgets
export async function getBudgetsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(budgets).where(eq(budgets.projectId, projectId));
}

export async function createBudget(budget: InsertBudget) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(budgets).values(budget);
}

export async function updateBudget(id: number, budget: Partial<InsertBudget>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(budgets).set(budget).where(eq(budgets.id, id));
}

// Notifications
export async function getNotificationsByUser(userId: number, unreadOnly: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  
  if (unreadOnly) {
    return await db.select().from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt));
  }
  
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(notifications).values(notification);
}

export async function markNotificationAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

// AI Suggestions
export async function getAISuggestionsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(aiSuggestions)
    .where(eq(aiSuggestions.projectId, projectId))
    .orderBy(desc(aiSuggestions.createdAt));
}

export async function createAISuggestion(suggestion: InsertAISuggestion) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(aiSuggestions).values(suggestion);
}

export async function updateAISuggestion(id: number, suggestion: Partial<InsertAISuggestion>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiSuggestions).set(suggestion).where(eq(aiSuggestions.id, id));
}

// Dashboard Stats
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  
  const [projectStats] = await db.select({
    total: sql<number>`count(*)`,
    planning: sql<number>`sum(case when status = 'planning' then 1 else 0 end)`,
    inProgress: sql<number>`sum(case when status = 'in_progress' then 1 else 0 end)`,
    completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
    onHold: sql<number>`sum(case when status = 'on_hold' then 1 else 0 end)`,
  }).from(projects);
  
  return projectStats;
}

// Emails
export async function getEmailsByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emails)
    .where(eq(emails.projectId, projectId))
    .orderBy(desc(emails.receivedAt));
}

export async function createEmail(email: InsertEmail) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(emails).values(email);
}
