import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Outlook integration
  outlookAccessToken: text("outlookAccessToken"),
  outlookRefreshToken: text("outlookRefreshToken"),
  outlookTokenExpiry: timestamp("outlookTokenExpiry"),
  outlookEmail: varchar("outlookEmail", { length: 320 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["planning", "in_progress", "on_hold", "completed", "cancelled"]).default("planning").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  progress: int("progress").default(0).notNull(),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  actualCost: decimal("actualCost", { precision: 15, scale: 2 }).default("0.00"),
  clientName: varchar("clientName", { length: 255 }),
  location: text("location"),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Suppliers table
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  taxId: varchar("taxId", { length: 50 }),
  category: varchar("category", { length: 100 }),
  rating: int("rating").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Orders table
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  supplierId: int("supplierId"),
  orderNumber: varchar("orderNumber", { length: 100 }),
  description: text("description").notNull(),
  orderType: mysqlEnum("orderType", ["material", "service", "equipment", "other"]).default("material").notNull(),
  status: mysqlEnum("status", ["pending", "ordered", "in_transit", "delivered", "cancelled"]).default("pending").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 3 }),
  unit: varchar("unit", { length: 50 }),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  orderDate: timestamp("orderDate"),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  actualDeliveryDate: timestamp("actualDeliveryDate"),
  notes: text("notes"),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Tasks table
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["todo", "in_progress", "review", "done", "cancelled"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  urgency: mysqlEnum("urgency", ["low", "medium", "high"]).default("medium").notNull(),
  importance: mysqlEnum("importance", ["low", "medium", "high"]).default("medium").notNull(),
  assignedTo: int("assignedTo"),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  kanbanOrder: int("kanbanOrder").default(0),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Budgets table
 */
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  description: text("description"),
  budgetedAmount: decimal("budgetedAmount", { precision: 15, scale: 2 }).notNull(),
  actualAmount: decimal("actualAmount", { precision: 15, scale: 2 }).default("0.00").notNull(),
  variance: decimal("variance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  variancePercent: decimal("variancePercent", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

/**
 * Quantity Maps table
 */
export const quantityMaps = mysqlTable("quantityMaps", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 50 }).notNull(),
  plannedQuantity: decimal("plannedQuantity", { precision: 15, scale: 3 }).notNull(),
  executedQuantity: decimal("executedQuantity", { precision: 15, scale: 3 }).default("0.000").notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }),
  totalPlanned: decimal("totalPlanned", { precision: 15, scale: 2 }),
  totalExecuted: decimal("totalExecuted", { precision: 15, scale: 2 }),
  importSource: mysqlEnum("importSource", ["manual", "excel", "google_sheets"]).default("manual").notNull(),
  importedAt: timestamp("importedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuantityMap = typeof quantityMaps.$inferSelect;
export type InsertQuantityMap = typeof quantityMaps.$inferInsert;

/**
 * Notifications table
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  type: mysqlEnum("type", ["deadline", "budget_alert", "task_update", "email", "other"]).default("other").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Emails table - stores synchronized Outlook emails
 */
export const emails = mysqlTable("emails", {
  id: int("id").autoincrement().primaryKey(),
  outlookId: varchar("outlookId", { length: 255 }).notNull().unique(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  subject: text("subject").notNull(),
  fromEmail: varchar("fromEmail", { length: 320 }).notNull(),
  fromName: varchar("fromName", { length: 255 }),
  toEmails: text("toEmails"),
  ccEmails: text("ccEmails"),
  bodyPreview: text("bodyPreview"),
  bodyContent: text("bodyContent"),
  receivedDateTime: timestamp("receivedDateTime").notNull(),
  hasAttachments: boolean("hasAttachments").default(false).notNull(),
  category: mysqlEnum("category", ["order", "adjudication", "purchase", "communication", "other"]).default("other").notNull(),
  classificationConfidence: decimal("classificationConfidence", { precision: 3, scale: 2 }),
  classificationReasoning: text("classificationReasoning"),
  suggestedActions: text("suggestedActions"),
  isProcessed: boolean("isProcessed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  projectIdIdx: index("projectId_idx").on(table.projectId),
  categoryIdx: index("category_idx").on(table.category),
  receivedDateTimeIdx: index("receivedDateTime_idx").on(table.receivedDateTime),
}));

export type Email = typeof emails.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;
