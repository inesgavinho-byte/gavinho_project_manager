import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

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
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table - Core entity for construction projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["planning", "in_progress", "on_hold", "completed", "cancelled"]).default("planning").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  actualEndDate: timestamp("actualEndDate"),
  progress: int("progress").default(0).notNull(), // 0-100
  budget: decimal("budget", { precision: 15, scale: 2 }),
  actualCost: decimal("actualCost", { precision: 15, scale: 2 }).default("0.00"),
  responsibleId: int("responsibleId").references(() => users.id),
  clientName: varchar("clientName", { length: 255 }),
  location: text("location"),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Quantity Maps - Material quantities planned vs executed
 */
export const quantityMaps = mysqlTable("quantityMaps", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }),
  unit: varchar("unit", { length: 50 }).notNull(),
  plannedQuantity: decimal("plannedQuantity", { precision: 15, scale: 3 }).notNull(),
  executedQuantity: decimal("executedQuantity", { precision: 15, scale: 3 }).default("0.000"),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }),
  totalPlanned: decimal("totalPlanned", { precision: 15, scale: 2 }),
  totalExecuted: decimal("totalExecuted", { precision: 15, scale: 2 }),
  notes: text("notes"),
  importSource: varchar("importSource", { length: 100 }), // 'google_sheets', 'excel', 'manual'
  importedAt: timestamp("importedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuantityMap = typeof quantityMaps.$inferSelect;
export type InsertQuantityMap = typeof quantityMaps.$inferInsert;

/**
 * Suppliers - Vendor management
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
  rating: int("rating").default(0), // 0-5
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Orders - Purchase orders and procurement tracking
 */
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  supplierId: int("supplierId").references(() => suppliers.id),
  orderNumber: varchar("orderNumber", { length: 100 }),
  description: text("description").notNull(),
  orderType: mysqlEnum("orderType", ["material", "service", "equipment", "other"]).default("material").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "ordered", "in_transit", "delivered", "cancelled"]).default("pending").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 3 }),
  unit: varchar("unit", { length: 50 }),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  orderDate: timestamp("orderDate"),
  expectedDeliveryDate: timestamp("expectedDeliveryDate"),
  actualDeliveryDate: timestamp("actualDeliveryDate"),
  notes: text("notes"),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

/**
 * Tasks - Project tasks with priority matrix
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["backlog", "todo", "in_progress", "review", "done"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  urgency: mysqlEnum("urgency", ["low", "medium", "high"]).default("medium").notNull(),
  importance: mysqlEnum("importance", ["low", "medium", "high"]).default("medium").notNull(),
  assignedToId: int("assignedToId").references(() => users.id),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  estimatedHours: decimal("estimatedHours", { precision: 8, scale: 2 }),
  actualHours: decimal("actualHours", { precision: 8, scale: 2 }),
  kanbanOrder: int("kanbanOrder").default(0),
  createdById: int("createdById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Emails - Integrated emails from Outlook
 */
export const emails = mysqlTable("emails", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").references(() => projects.id, { onDelete: "cascade" }),
  messageId: varchar("messageId", { length: 255 }).notNull().unique(),
  subject: text("subject"),
  fromEmail: varchar("fromEmail", { length: 320 }),
  fromName: varchar("fromName", { length: 255 }),
  toEmails: text("toEmails"), // JSON array
  ccEmails: text("ccEmails"), // JSON array
  body: text("body"),
  category: mysqlEnum("category", ["order", "adjudication", "purchase", "communication", "other"]).default("other").notNull(),
  receivedAt: timestamp("receivedAt").notNull(),
  hasAttachments: boolean("hasAttachments").default(false),
  attachmentUrls: text("attachmentUrls"), // JSON array
  isRead: boolean("isRead").default(false),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Email = typeof emails.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;

/**
 * Budgets - Detailed budget tracking per project
 */
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  budgetedAmount: decimal("budgetedAmount", { precision: 15, scale: 2 }).notNull(),
  actualAmount: decimal("actualAmount", { precision: 15, scale: 2 }).default("0.00"),
  variance: decimal("variance", { precision: 15, scale: 2 }).default("0.00"),
  variancePercent: decimal("variancePercent", { precision: 5, scale: 2 }).default("0.00"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

/**
 * Notifications - System notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: int("projectId").references(() => projects.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["deadline", "delay", "budget_alert", "order_update", "task_assigned", "other"]).default("other").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * AI Suggestions - Intelligent action recommendations
 */
export const aiSuggestions = mysqlTable("aiSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  suggestionType: mysqlEnum("suggestionType", ["action", "communication", "resource", "risk", "optimization"]).default("action").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  reasoning: text("reasoning"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "completed"]).default("pending").notNull(),
  acceptedById: int("acceptedById").references(() => users.id),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AISuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAISuggestion = typeof aiSuggestions.$inferInsert;

/**
 * Reports - Generated reports and exports
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").references(() => projects.id, { onDelete: "cascade" }),
  reportType: mysqlEnum("reportType", ["progress", "budget", "timeline", "resources", "custom"]).default("progress").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  format: mysqlEnum("format", ["pdf", "excel", "json"]).default("pdf").notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }),
  parameters: text("parameters"), // JSON
  generatedById: int("generatedById").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Supplier Transactions - Track all transactions with suppliers
 */
export const supplierTransactions = mysqlTable("supplierTransactions", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  orderId: int("orderId").references(() => orders.id),
  projectId: int("projectId").references(() => projects.id),
  transactionType: mysqlEnum("transactionType", ["payment", "refund", "adjustment"]).default("payment").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  transactionDate: timestamp("transactionDate").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 100 }),
  referenceNumber: varchar("referenceNumber", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupplierTransaction = typeof supplierTransactions.$inferSelect;
export type InsertSupplierTransaction = typeof supplierTransactions.$inferInsert;
