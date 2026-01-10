import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, date, json, unique } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "client"]).default("user").notNull(),
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
  deletedAt: timestamp("deletedAt"),
  // Contract details
  contractValue: decimal("contractValue", { precision: 15, scale: 2 }),
  contractSignedDate: timestamp("contractSignedDate"),
  contractDeadline: timestamp("contractDeadline"),
  contractType: varchar("contractType", { length: 255 }),
  contractDuration: varchar("contractDuration", { length: 100 }), // e.g., "30 dias", "3 meses"
  contractNotes: text("contractNotes"),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project Phases table - configurable phases for each project
 */
export const projectPhases = mysqlTable("projectPhases", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "on_hold"]).default("not_started").notNull(),
  progress: int("progress").default(0).notNull(),
  assignedTo: int("assignedTo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
}));

export type ProjectPhase = typeof projectPhases.$inferSelect;
export type InsertProjectPhase = typeof projectPhases.$inferInsert;

/**
 * Project Milestones table - important milestones for each project
 */
export const projectMilestones = mysqlTable("projectMilestones", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  phaseId: int("phaseId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate").notNull(),
  completedDate: timestamp("completedDate"),
  status: mysqlEnum("status", ["pending", "completed", "overdue"]).default("pending").notNull(),
  isKeyMilestone: int("isKeyMilestone").default(0).notNull(), // 0 = no, 1 = yes
  dependencies: json("dependencies").$type<number[]>().default([]), // Array of milestone IDs that must be completed before this one
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  phaseIdIdx: index("phaseId_idx").on(table.phaseId),
}));

export type ProjectMilestone = typeof projectMilestones.$inferSelect;
export type InsertProjectMilestone = typeof projectMilestones.$inferInsert;

/**
 * Project Team table - team members assigned to projects
 */
export const projectTeam = mysqlTable("projectTeam", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: varchar("role", { length: 100 }).notNull(), // e.g., "Architect", "Project Manager", "Designer"
  responsibilities: text("responsibilities"),
  displayOrder: int("displayOrder").default(0).notNull(), // Order for drag & drop
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  leftAt: timestamp("leftAt"),
  isActive: int("isActive").default(1).notNull(), // 0 = no, 1 = yes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type ProjectTeamMember = typeof projectTeam.$inferSelect;
export type InsertProjectTeamMember = typeof projectTeam.$inferInsert;

/**
 * Project Documents table - documents attached to projects
 */
export const projectDocuments = mysqlTable("projectDocuments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  phaseId: int("phaseId"), // Optional: associate document with specific phase
  documentType: mysqlEnum("documentType", ["design_review", "project_management"]).default("design_review").notNull(), // Separates technical docs from administrative docs
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileType: varchar("fileType", { length: 100 }), // e.g., "application/pdf", "image/jpeg"
  fileSize: int("fileSize"), // in bytes
  // Design Review categories: plan, drawing, specification, render, approval, photo, report
  // Project Management categories: contract, invoice, receipt, meeting_minutes, correspondence, legal_document
  category: mysqlEnum("category", [
    "plan", "drawing", "specification", "render", "approval", "photo", "report", // Design Review
    "contract", "invoice", "receipt", "meeting_minutes", "correspondence", "legal_document", "other" // Project Management
  ]).default("other").notNull(),
  uploadedById: int("uploadedById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  phaseIdIdx: index("phaseId_idx").on(table.phaseId),
  documentTypeIdx: index("documentType_idx").on(table.documentType),
  categoryIdx: index("category_idx").on(table.category),
}));

export type ProjectDocument = typeof projectDocuments.$inferSelect;
export type InsertProjectDocument = typeof projectDocuments.$inferInsert;

/**
 * Project Gallery table - photo gallery for projects
 */
export const projectGallery = mysqlTable("projectGallery", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  phaseId: int("phaseId"),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  imageKey: varchar("imageKey", { length: 500 }).notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  category: varchar("category", { length: 100 }), // e.g., "Before", "During", "After", "Detail"
  takenAt: timestamp("takenAt"),
  uploadedById: int("uploadedById").notNull(),
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
}));

export type ProjectGalleryImage = typeof projectGallery.$inferSelect;
export type InsertProjectGalleryImage = typeof projectGallery.$inferInsert;

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
  projectId: int("projectId").notNull().references(() => projects.id),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  description: text("description"),
  budgetedAmount: decimal("budgetedAmount", { precision: 15, scale: 2 }).notNull(),
  actualAmount: decimal("actualAmount", { precision: 15, scale: 2 }).default("0.00").notNull(),
  variance: decimal("variance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  variancePercent: decimal("variancePercent", { precision: 10, scale: 2 }).default("0.00"),
  status: mysqlEnum("status", ["draft", "approved", "active", "closed"]).default("draft").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdById: int("createdById").notNull().references(() => users.id),
  approvedById: int("approvedById").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  statusIdx: index("status_idx").on(table.status),
}));

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

/**
 * AI Suggestions table - stores intelligent recommendations
 */
export const aiSuggestions = mysqlTable("aiSuggestions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  type: mysqlEnum("type", ["risk_alert", "resource_optimization", "next_action", "budget_warning", "deadline_alert", "efficiency_tip"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  reasoning: text("reasoning"),
  suggestedAction: text("suggestedAction"),
  impact: mysqlEnum("impact", ["low", "medium", "high"]).default("medium"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "completed"]).default("pending").notNull(),
  acceptedById: int("acceptedById"),
  acceptedAt: timestamp("acceptedAt"),
  completedAt: timestamp("completedAt"),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  statusIdx: index("status_idx").on(table.status),
  typeIdx: index("type_idx").on(table.type),
}));

export type AISuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAISuggestion = typeof aiSuggestions.$inferInsert;

/**
 * Notifications table
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["ai_alert", "deadline_warning", "budget_exceeded", "project_delayed", "task_overdue", "order_pending", "system"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  link: varchar("link", { length: 500 }),
  projectId: int("projectId"),
  taskId: int("taskId"),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Notification preferences table
 */
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  aiAlerts: int("aiAlerts").default(1).notNull(), // 0 = disabled, 1 = enabled
  deadlineWarnings: int("deadlineWarnings").default(1).notNull(),
  budgetAlerts: int("budgetAlerts").default(1).notNull(),
  projectDelays: int("projectDelays").default(1).notNull(),
  taskOverdue: int("taskOverdue").default(1).notNull(),
  orderPending: int("orderPending").default(1).notNull(),
  systemNotifications: int("systemNotifications").default(1).notNull(),
  deadlineWarningDays: int("deadlineWarningDays").default(7).notNull(), // Days before deadline to warn
  budgetThreshold: int("budgetThreshold").default(90).notNull(), // Percentage threshold for budget warnings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * Supplier transactions table - tracks all transactions with suppliers
 */
export const supplierTransactions = mysqlTable("supplierTransactions", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  projectId: int("projectId"),
  orderId: int("orderId"),
  type: mysqlEnum("type", ["purchase", "payment", "refund", "credit"]).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  description: text("description"),
  transactionDate: timestamp("transactionDate").notNull(),
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierTransaction = typeof supplierTransactions.$inferSelect;
export type InsertSupplierTransaction = typeof supplierTransactions.$inferInsert;

/**
 * Supplier evaluations table - tracks performance ratings
 */
export const supplierEvaluations = mysqlTable("supplierEvaluations", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  projectId: int("projectId"),
  orderId: int("orderId"),
  qualityRating: int("qualityRating").notNull(), // 1-5
  deliveryRating: int("deliveryRating").notNull(), // 1-5 (punctuality)
  communicationRating: int("communicationRating").notNull(), // 1-5
  priceRating: int("priceRating").notNull(), // 1-5 (value for money)
  overallRating: int("overallRating").notNull(), // 1-5 (calculated average)
  comments: text("comments"),
  wouldRecommend: boolean("wouldRecommend").default(true).notNull(),
  evaluatedById: int("evaluatedById").notNull(),
  evaluatedAt: timestamp("evaluatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierEvaluation = typeof supplierEvaluations.$inferSelect;
export type InsertSupplierEvaluation = typeof supplierEvaluations.$inferInsert;

/**
 * Project predictions table - AI-powered predictions for delays and costs
 */
export const projectPredictions = mysqlTable("projectPredictions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  predictionType: mysqlEnum("predictionType", ["delay", "cost", "risk"]).notNull(),
  
  // Delay predictions
  predictedDelayDays: int("predictedDelayDays"),
  delayProbability: int("delayProbability"), // 0-100%
  predictedCompletionDate: timestamp("predictedCompletionDate"),
  
  // Cost predictions
  predictedFinalCost: decimal("predictedFinalCost", { precision: 15, scale: 2 }),
  costOverrunProbability: int("costOverrunProbability"), // 0-100%
  estimatedCostVariance: decimal("estimatedCostVariance", { precision: 15, scale: 2 }),
  
  // Risk analysis
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  riskFactors: text("riskFactors"), // JSON array of risk factors
  confidence: int("confidence"), // 0-100% confidence in prediction
  
  // Recommendations
  recommendations: text("recommendations"), // JSON array of recommendations
  suggestedActions: text("suggestedActions"), // JSON array of actions
  
  // Metadata
  basedOnHistoricalProjects: int("basedOnHistoricalProjects"), // Number of similar projects analyzed
  analysisDate: timestamp("analysisDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
  typeIdx: index("type_idx").on(table.predictionType),
  riskIdx: index("risk_idx").on(table.riskLevel),
}));

export type ProjectPrediction = typeof projectPredictions.$inferSelect;
export type InsertProjectPrediction = typeof projectPredictions.$inferInsert;

/**
 * What-If Scenarios for resource allocation simulation
 */
export const whatIfScenarios = mysqlTable("whatIfScenarios", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  scenarioName: varchar("scenarioName", { length: 255 }).notNull(),
  description: text("description"),
  
  // Adjustable parameters
  budgetAdjustment: decimal("budgetAdjustment", { precision: 15, scale: 2 }), // +/- amount
  budgetPercentage: int("budgetPercentage"), // percentage change
  teamSizeAdjustment: int("teamSizeAdjustment"), // +/- team members
  timelineAdjustment: int("timelineAdjustment"), // +/- days
  resourceAllocation: text("resourceAllocation"), // JSON: { resource: amount }
  
  // Simulation results
  predictedDuration: int("predictedDuration"), // days
  predictedCost: decimal("predictedCost", { precision: 15, scale: 2 }),
  predictedDelayDays: int("predictedDelayDays"),
  costVariance: decimal("costVariance", { precision: 15, scale: 2 }),
  feasibilityScore: int("feasibilityScore"), // 0-100
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]).notNull().default("medium"),
  
  // Analysis
  impactSummary: text("impactSummary"),
  recommendations: text("recommendations"),
  tradeoffs: text("tradeoffs"), // JSON array
  
  // Predictive Analysis Integration
  successProbability: int("successProbability"), // 0-100 percentage
  criticalFactors: text("criticalFactors"), // JSON array of critical success factors
  riskFactors: text("riskFactors"), // JSON array of identified risks
  mitigationStrategies: text("mitigationStrategies"), // JSON array of mitigation recommendations
  confidenceLevel: mysqlEnum("confidenceLevel", ["low", "medium", "high"]).default("medium"),
  
  // Metadata
  isFavorite: int("isFavorite").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatIfScenario = typeof whatIfScenarios.$inferSelect;
export type InsertWhatIfScenario = typeof whatIfScenarios.$inferInsert;

/**
 * Scenario Shares - Track sharing of what-if scenarios with team members
 */
export const scenarioShares = mysqlTable("scenarioShares", {
  id: int("id").autoincrement().primaryKey(),
  scenarioId: int("scenarioId").notNull(),
  sharedBy: int("sharedBy").notNull(), // user ID who shared
  sharedWith: int("sharedWith").notNull(), // user ID receiving access
  permission: mysqlEnum("permission", ["view", "edit", "admin"]).notNull().default("view"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScenarioShare = typeof scenarioShares.$inferSelect;
export type InsertScenarioShare = typeof scenarioShares.$inferInsert;

/**
 * Scenario Comments - Collaborative discussions on scenarios
 */
export const scenarioComments = mysqlTable("scenarioComments", {
  id: int("id").autoincrement().primaryKey(),
  scenarioId: int("scenarioId").notNull(),
  userId: int("userId").notNull(),
  comment: text("comment").notNull(),
  parentCommentId: int("parentCommentId"), // Para threads de discussão
  replyCount: int("replyCount").default(0).notNull(), // Contador de respostas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScenarioComment = typeof scenarioComments.$inferSelect;
export type InsertScenarioComment = typeof scenarioComments.$inferInsert;

export const activityFeed = mysqlTable("activityFeed", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  actorId: int("actorId").notNull(), // Quem realizou a ação
  activityType: mysqlEnum("activityType", [
    "scenario_created",
    "scenario_updated",
    "scenario_shared",
    "scenario_commented",
    "scenario_favorited",
    "scenario_deleted"
  ]).notNull(),
  scenarioId: int("scenarioId"),
  projectId: int("projectId"),
  metadata: text("metadata"), // JSON com detalhes adicionais
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityFeed = typeof activityFeed.$inferSelect;
export type InsertActivityFeed = typeof activityFeed.$inferInsert;

/**
 * Comment Mentions - Track @mentions in comments
 */
export const commentMentions = mysqlTable("commentMentions", {
  id: int("id").autoincrement().primaryKey(),
  commentId: int("commentId").notNull(),
  mentionedUserId: int("mentionedUserId").notNull(), // User who was mentioned
  mentionedBy: int("mentionedBy").notNull(), // User who created the mention
  scenarioId: int("scenarioId").notNull(), // For context
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  commentIdx: index("comment_idx").on(table.commentId),
  mentionedUserIdx: index("mentioned_user_idx").on(table.mentionedUserId),
}));

export type CommentMention = typeof commentMentions.$inferSelect;
export type InsertCommentMention = typeof commentMentions.$inferInsert;

/**
 * Project Deliveries - Track deliverables and their deadlines
 */
export const projectDeliveries = mysqlTable("projectDeliveries", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  phaseId: int("phaseId"), // Optional: link to specific phase
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["document", "drawing", "render", "model", "report", "specification", "other"]).default("document").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: mysqlEnum("status", ["pending", "in_review", "approved", "rejected", "delivered"]).default("pending").notNull(),
  fileUrl: text("fileUrl"), // URL to uploaded delivery file
  fileKey: varchar("fileKey", { length: 500 }), // S3 key
  fileSize: int("fileSize"), // in bytes
  uploadedAt: timestamp("uploadedAt"),
  uploadedById: int("uploadedById"),
  assignedToId: int("assignedToId"), // Team member responsible
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  notificationSent: int("notificationSent").default(0).notNull(), // 0 = not sent, 1 = sent
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  phaseIdIdx: index("phaseId_idx").on(table.phaseId),
  statusIdx: index("status_idx").on(table.status),
  dueDateIdx: index("dueDate_idx").on(table.dueDate),
}));

export type ProjectDelivery = typeof projectDeliveries.$inferSelect;
export type InsertProjectDelivery = typeof projectDeliveries.$inferInsert;

/**
 * Delivery Approvals - Track approval/rejection history
 */
export const deliveryApprovals = mysqlTable("deliveryApprovals", {
  id: int("id").autoincrement().primaryKey(),
  deliveryId: int("deliveryId").notNull(),
  reviewerId: int("reviewerId").notNull(), // User who reviewed
  status: mysqlEnum("status", ["approved", "rejected", "revision_requested"]).notNull(),
  comments: text("comments"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  deliveryIdIdx: index("deliveryId_idx").on(table.deliveryId),
  reviewerIdIdx: index("reviewerId_idx").on(table.reviewerId),
}));

export type DeliveryApproval = typeof deliveryApprovals.$inferSelect;
export type InsertDeliveryApproval = typeof deliveryApprovals.$inferInsert;


/**
 * Constructions (Obras GB) - Construction projects associated with design projects (GA)
 */
export const constructions = mysqlTable("constructions", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // GB00433, GB00402, etc.
  name: varchar("name", { length: 255 }).notNull(),
  projectId: int("projectId"), // Link to design project (GA)
  client: varchar("client", { length: 255 }),
  location: varchar("location", { length: 255 }),
  startDate: date("startDate"),
  endDate: date("endDate"),
  status: mysqlEnum("status", ["not_started", "in_progress", "on_hold", "completed", "cancelled"]).default("not_started").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  budget: decimal("budget", { precision: 12, scale: 2 }),
  actualCost: decimal("actualCost", { precision: 12, scale: 2 }).default("0.00"),
  progress: int("progress").default(0), // 0-100%
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  deletedAt: timestamp("deletedAt"),
}, (table) => ({
  codeIdx: index("code_idx").on(table.code),
  projectIdIdx: index("projectId_idx").on(table.projectId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Construction = typeof constructions.$inferSelect;
export type InsertConstruction = typeof constructions.$inferInsert;

/**
 * MQT Categories - Main categories of the Bill of Quantities (Mapa de Quantidades)
 */
export const mqtCategories = mysqlTable("mqtCategories", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  code: varchar("code", { length: 20 }).notNull(), // 1, 2, 3, etc.
  namePt: varchar("namePt", { length: 255 }).notNull(), // "Demolições"
  nameEn: varchar("nameEn", { length: 255 }), // "Demolitions"
  order: int("order").notNull(), // Display order
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  orderIdx: index("order_idx").on(table.order),
}));

export type MqtCategory = typeof mqtCategories.$inferSelect;
export type InsertMqtCategory = typeof mqtCategories.$inferInsert;

/**
 * MQT Items - Individual items in the Bill of Quantities
 */
export const mqtItems = mysqlTable("mqtItems", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  categoryId: int("categoryId").notNull(),
  code: varchar("code", { length: 20 }).notNull(), // 1.1, 1.2, 2.1, etc.
  typePt: varchar("typePt", { length: 255 }), // "Demolições"
  typeEn: varchar("typeEn", { length: 255 }), // "Demolitions"
  subtypePt: varchar("subtypePt", { length: 255 }), // "Paredes"
  subtypeEn: varchar("subtypeEn", { length: 255 }), // "Walls"
  zonePt: varchar("zonePt", { length: 255 }), // "Geral", "IS Master 1"
  zoneEn: varchar("zoneEn", { length: 255 }), // "General", "IS Master 1"
  descriptionPt: text("descriptionPt").notNull(), // Main description in Portuguese
  descriptionEn: text("descriptionEn"), // English description (for client proposals)
  unit: varchar("unit", { length: 20 }).notNull(), // m2, m, un, vg, ml
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  quantityExecuted: decimal("quantityExecuted", { precision: 10, scale: 2 }).default("0.00"),
  unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }),
  totalPrice: decimal("totalPrice", { precision: 12, scale: 2 }),
  supplierId: int("supplierId"), // Link to supplier
  status: mysqlEnum("status", ["pending", "ordered", "in_progress", "completed"]).default("pending").notNull(),
  notes: text("notes"),
  order: int("order").notNull(), // Display order within category
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  categoryIdIdx: index("categoryId_idx").on(table.categoryId),
  supplierIdIdx: index("supplierId_idx").on(table.supplierId),
  statusIdx: index("status_idx").on(table.status),
  orderIdx: index("order_idx").on(table.order),
}));

export type MqtItem = typeof mqtItems.$inferSelect;
export type InsertMqtItem = typeof mqtItems.$inferInsert;

/**
 * MQT Item History - Track changes to quantity executed
 */
export const mqtItemHistory = mysqlTable("mqtItemHistory", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(), // Reference to mqtItems.id
  userId: int("userId").notNull(), // User who made the change
  oldValue: decimal("oldValue", { precision: 10, scale: 2 }), // Previous quantityExecuted
  newValue: decimal("newValue", { precision: 10, scale: 2 }).notNull(), // New quantityExecuted
  changedAt: timestamp("changedAt").defaultNow().notNull(),
}, (table) => ({
  itemIdIdx: index("itemId_idx").on(table.itemId),
  userIdIdx: index("userId_idx").on(table.userId),
  changedAtIdx: index("changedAt_idx").on(table.changedAt),
}));

export type MqtItemHistory = typeof mqtItemHistory.$inferSelect;
export type InsertMqtItemHistory = typeof mqtItemHistory.$inferInsert;


/**
 * ArchViz Compartments - Organize renders by compartments/rooms
 */
export const archvizCompartments = mysqlTable("archvizCompartments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  parentId: int("parentId"), // For hierarchical organization (sub-compartments)
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  parentIdIdx: index("parentId_idx").on(table.parentId),
}));

export type ArchvizCompartment = typeof archvizCompartments.$inferSelect;
export type InsertArchvizCompartment = typeof archvizCompartments.$inferInsert;

/**
 * ArchViz Renders - Store 3D renders with versioning
 */
export const archvizRenders = mysqlTable("archvizRenders", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  compartmentId: int("compartmentId"),
  version: int("version").notNull(), // Auto-increment per compartment
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileKey: text("fileKey").notNull(), // S3 key for deletion
  thumbnailUrl: text("thumbnailUrl"), // Thumbnail URL
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"), // In bytes
  isFavorite: boolean("isFavorite").default(false).notNull(),
  status: mysqlEnum("status", ["pending", "approved_dc", "approved_client"]).default("pending").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "in_review", "approved", "rejected"]).default("pending").notNull(),
  approvedById: int("approvedById"),
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
  uploadedById: int("uploadedById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  compartmentIdIdx: index("compartmentId_idx").on(table.compartmentId),
  uploadedByIdIdx: index("uploadedById_idx").on(table.uploadedById),
}));

export type ArchvizRender = typeof archvizRenders.$inferSelect;
export type InsertArchvizRender = typeof archvizRenders.$inferInsert;

/**
 * ArchViz Annotations - Visual annotations on renders
 */
export const archvizAnnotations = mysqlTable("archvizAnnotations", {
  id: int("id").autoincrement().primaryKey(),
  renderId: int("renderId").notNull(),
  annotationsData: json("annotationsData").notNull(), // JSON array of annotations
  createdById: int("createdById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  renderIdIdx: index("renderId_idx").on(table.renderId),
  createdByIdIdx: index("createdById_idx").on(table.createdById),
}));

export type ArchvizAnnotation = typeof archvizAnnotations.$inferSelect;
export type InsertArchvizAnnotation = typeof archvizAnnotations.$inferInsert;

/**
 * ArchViz Comments - Comments on renders
 */
export const archvizComments = mysqlTable("archvizComments", {
  id: int("id").autoincrement().primaryKey(),
  renderId: int("renderId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  renderIdIdx: index("renderId_idx").on(table.renderId),
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type ArchvizComment = typeof archvizComments.$inferSelect;
export type InsertArchvizComment = typeof archvizComments.$inferInsert;

/**
 * ArchViz Status History - Track all status changes for renders
 */
export const archvizStatusHistory = mysqlTable("archvizStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  renderId: int("renderId").notNull(),
  oldStatus: mysqlEnum("oldStatus", ["pending", "approved_dc", "approved_client"]),
  newStatus: mysqlEnum("newStatus", ["pending", "approved_dc", "approved_client"]).notNull(),
  changedById: int("changedById").notNull(),
  notes: text("notes"), // Optional notes about the change
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  renderIdIdx: index("renderId_idx").on(table.renderId),
  changedByIdIdx: index("changedById_idx").on(table.changedById),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type ArchvizStatusHistory = typeof archvizStatusHistory.$inferSelect;
export type InsertArchvizStatusHistory = typeof archvizStatusHistory.$inferInsert;


/**
 * MQT Import History - Track all MQT imports
 */
export const mqtImportHistory = mysqlTable("mqtImportHistory", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  userId: int("userId").notNull(),
  source: mysqlEnum("source", ["excel", "sheets"]).notNull(),
  fileName: varchar("fileName", { length: 255 }),
  sheetsUrl: text("sheetsUrl"),
  itemsImported: int("itemsImported").notNull().default(0),
  itemsSuccess: int("itemsSuccess").notNull().default(0),
  itemsError: int("itemsError").notNull().default(0),
  errorLog: text("errorLog"), // JSON string with errors
  importedAt: timestamp("importedAt").defaultNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  userIdIdx: index("userId_idx").on(table.userId),
  importedAtIdx: index("importedAt_idx").on(table.importedAt),
}));

export type MqtImportHistory = typeof mqtImportHistory.$inferSelect;
export type InsertMqtImportHistory = typeof mqtImportHistory.$inferInsert;

/**
 * MQT Import Items - Track which items were added in each import
 */
export const mqtImportItems = mysqlTable("mqtImportItems", {
  id: int("id").autoincrement().primaryKey(),
  importId: int("importId").notNull(),
  mqtItemId: int("mqtItemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  importIdIdx: index("importId_idx").on(table.importId),
  mqtItemIdIdx: index("mqtItemId_idx").on(table.mqtItemId),
}));

export type MqtImportItem = typeof mqtImportItems.$inferSelect;
export type InsertMqtImportItem = typeof mqtImportItems.$inferInsert;


/**
 * MQT Validation Rules - Customizable validation rules for MQT imports
 */
export const mqtValidationRules = mysqlTable("mqtValidationRules", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  ruleType: mysqlEnum("ruleType", ["price_min", "price_max", "code_pattern", "quantity_min", "quantity_max", "duplicate_check"]).notNull(),
  field: varchar("field", { length: 100 }).notNull(), // e.g., "unitPrice", "code", "quantity"
  condition: text("condition"), // JSON with rule parameters (e.g., {"min": 0, "max": 1000} or {"pattern": "^[A-Z]{2}\\d{4}$"})
  severity: mysqlEnum("severity", ["error", "warning", "info"]).notNull().default("warning"),
  message: text("message"), // Custom error message
  enabled: boolean("enabled").notNull().default(true),
  category: varchar("category", { length: 255 }), // Optional: apply rule only to specific category
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  enabledIdx: index("enabled_idx").on(table.enabled),
}));

export type MqtValidationRule = typeof mqtValidationRules.$inferSelect;
export type InsertMqtValidationRule = typeof mqtValidationRules.$inferInsert;


// ============= CLIENT PORTAL TABLES =============

export const clientProjects = mysqlTable("clientProjects", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => users.id),
  projectId: int("projectId").notNull().references(() => projects.id),
  accessLevel: mysqlEnum("accessLevel", ["view", "comment", "approve"]).default("view").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  clientIdIdx: index("clientId_idx").on(table.clientId),
  projectIdIdx: index("projectId_idx").on(table.projectId),
  clientProjectIdx: index("clientProject_idx").on(table.clientId, table.projectId),
}));

export type ClientProject = typeof clientProjects.$inferSelect;
export type InsertClientProject = typeof clientProjects.$inferInsert;

export const clientMessages = mysqlTable("clientMessages", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id),
  senderId: int("senderId").notNull().references(() => users.id),
  message: text("message").notNull(),
  attachmentUrl: varchar("attachmentUrl", { length: 512 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  senderIdIdx: index("senderId_idx").on(table.senderId),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type ClientMessage = typeof clientMessages.$inferSelect;
export type InsertClientMessage = typeof clientMessages.$inferInsert;

export const clientDocuments = mysqlTable("clientDocuments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(), // pdf, docx, xlsx, etc
  fileSize: int("fileSize"), // in bytes
  version: int("version").default(1).notNull(),
  uploadedBy: int("uploadedBy").notNull().references(() => users.id),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  uploadedByIdx: index("uploadedBy_idx").on(table.uploadedBy),
  fileTypeIdx: index("fileType_idx").on(table.fileType),
}));

export type ClientDocument = typeof clientDocuments.$inferSelect;
export type InsertClientDocument = typeof clientDocuments.$inferInsert;


/**
 * HR - Holidays (Feriados Nacionais)
 */
export const holidays = mysqlTable("holidays", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  date: date("date").notNull(),
  year: int("year").notNull(),
  type: mysqlEnum("type", ["national", "regional", "company"]).default("national").notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(), // true for holidays that repeat yearly
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dateIdx: index("date_idx").on(table.date),
  yearIdx: index("year_idx").on(table.year),
}));

export type Holiday = typeof holidays.$inferSelect;
export type InsertHoliday = typeof holidays.$inferInsert;

/**
 * HR - Absences (Férias e Ausências)
 */
export const absences = mysqlTable("absences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  type: mysqlEnum("type", ["vacation", "sick", "personal", "other"]).default("vacation").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  days: int("days").notNull(), // Total days of absence
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  startDateIdx: index("startDate_idx").on(table.startDate),
}));

export type Absence = typeof absences.$inferSelect;
export type InsertAbsence = typeof absences.$inferInsert;

/**
 * HR - Timesheets (Registro de Horas)
 */
export const timesheets = mysqlTable("timesheets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  projectId: int("projectId").references(() => projects.id),
  date: date("date").notNull(),
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull(), // Hours worked (e.g., 8.50)
  description: text("description"),
  taskType: varchar("taskType", { length: 100 }), // e.g., "Design", "Development", "Meeting"
  isBillable: boolean("isBillable").default(true).notNull(),
  status: mysqlEnum("status", ["draft", "submitted", "approved"]).default("draft").notNull(),
  approvedBy: int("approvedBy").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  projectIdIdx: index("projectId_idx").on(table.projectId),
  dateIdx: index("date_idx").on(table.date),
  statusIdx: index("status_idx").on(table.status),
}));

export type Timesheet = typeof timesheets.$inferSelect;
export type InsertTimesheet = typeof timesheets.$inferInsert;

/**
 * ArchViz Render Comments - Feedback and comments on renders
 */
export const archvizRenderComments = mysqlTable("archvizRenderComments", {
  id: int("id").autoincrement().primaryKey(),
  renderId: int("renderId").notNull(),
  userId: int("userId").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  renderIdIdx: index("renderId_idx").on(table.renderId),
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type ArchvizRenderComment = typeof archvizRenderComments.$inferSelect;
export type InsertArchvizRenderComment = typeof archvizRenderComments.$inferInsert;

/**
 * ArchViz Render History - Track all changes to renders
 */
export const archvizRenderHistory = mysqlTable("archvizRenderHistory", {
  id: int("id").autoincrement().primaryKey(),
  renderId: int("renderId").notNull(),
  userId: int("userId").notNull(),
  action: mysqlEnum("action", ["created", "status_changed", "approved", "rejected", "commented"]).notNull(),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  renderIdIdx: index("renderId_idx").on(table.renderId),
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type ArchvizRenderHistory = typeof archvizRenderHistory.$inferSelect;
export type InsertArchvizRenderHistory = typeof archvizRenderHistory.$inferInsert;


// ============================================================================
// SITE MANAGEMENT MODULE - Gestão de Obra
// ============================================================================

/**
 * Site Workers - Trabalhadores em obra
 */
export const siteWorkers = mysqlTable("siteWorkers", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  userId: int("userId"), // Link to users table if they have account
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["worker", "foreman", "technician", "engineer"]).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  company: varchar("company", { length: 255 }), // For external workers
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type SiteWorker = typeof siteWorkers.$inferSelect;
export type InsertSiteWorker = typeof siteWorkers.$inferInsert;

/**
 * Site Attendance - Picagem de ponto
 */
export const siteAttendance = mysqlTable("siteAttendance", {
  id: int("id").autoincrement().primaryKey(),
  workerId: int("workerId").notNull(),
  constructionId: int("constructionId").notNull(),
  checkIn: timestamp("checkIn").notNull(),
  checkOut: timestamp("checkOut"),
  location: text("location"), // GPS coordinates
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  workerIdIdx: index("workerId_idx").on(table.workerId),
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  checkInIdx: index("checkIn_idx").on(table.checkIn),
}));

export type SiteAttendance = typeof siteAttendance.$inferSelect;
export type InsertSiteAttendance = typeof siteAttendance.$inferInsert;

/**
 * Site Work Hours - Registo de horas trabalhadas por tarefa
 */
export const siteWorkHours = mysqlTable("siteWorkHours", {
  id: int("id").autoincrement().primaryKey(),
  workerId: int("workerId").notNull(),
  constructionId: int("constructionId").notNull(),
  date: date("date").notNull(),
  taskDescription: text("taskDescription").notNull(),
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  workerIdIdx: index("workerId_idx").on(table.workerId),
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  dateIdx: index("date_idx").on(table.date),
}));

export type SiteWorkHours = typeof siteWorkHours.$inferSelect;
export type InsertSiteWorkHours = typeof siteWorkHours.$inferInsert;

/**
 * Site Material Requests - Requisição de materiais
 */
export const siteMaterialRequests = mysqlTable("siteMaterialRequests", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  requestedBy: int("requestedBy").notNull(),
  materialName: varchar("materialName", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  urgency: mysqlEnum("urgency", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "delivered"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  requestedByIdx: index("requestedBy_idx").on(table.requestedBy),
  statusIdx: index("status_idx").on(table.status),
}));

export type SiteMaterialRequest = typeof siteMaterialRequests.$inferSelect;
export type InsertSiteMaterialRequest = typeof siteMaterialRequests.$inferInsert;

/**
 * Site Material Usage - Consumo de materiais
 */
export const siteMaterialUsage = mysqlTable("siteMaterialUsage", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  usedBy: int("usedBy").notNull(),
  materialName: varchar("materialName", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  location: varchar("location", { length: 255 }), // Where in the site
  notes: text("notes"),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  usedByIdx: index("usedBy_idx").on(table.usedBy),
  dateIdx: index("date_idx").on(table.date),
}));

export type SiteMaterialUsage = typeof siteMaterialUsage.$inferSelect;
export type InsertSiteMaterialUsage = typeof siteMaterialUsage.$inferInsert;

/**
 * Site Tools - Ferramentas
 */
export const siteTools = mysqlTable("siteTools", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId"),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serialNumber", { length: 100 }),
  purchaseDate: date("purchaseDate"),
  purchasePrice: decimal("purchasePrice", { precision: 10, scale: 2 }),
  status: mysqlEnum("status", ["available", "in_use", "maintenance", "broken", "retired"]).default("available").notNull(),
  condition: mysqlEnum("condition", ["excellent", "good", "fair", "poor"]).default("good").notNull(),
  lastMaintenanceDate: date("lastMaintenanceDate"),
  nextMaintenanceDate: date("nextMaintenanceDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  codeIdx: index("code_idx").on(table.code),
  statusIdx: index("status_idx").on(table.status),
}));

export type SiteTool = typeof siteTools.$inferSelect;
export type InsertSiteTool = typeof siteTools.$inferInsert;

/**
 * Site Tool Assignments - Atribuição de ferramentas a trabalhadores
 */
export const siteToolAssignments = mysqlTable("siteToolAssignments", {
  id: int("id").autoincrement().primaryKey(),
  toolId: int("toolId").notNull(),
  workerId: int("workerId").notNull(),
  constructionId: int("constructionId").notNull(),
  assignedAt: timestamp("assignedAt").notNull(),
  returnedAt: timestamp("returnedAt"),
  assignedBy: int("assignedBy").notNull(),
  returnCondition: mysqlEnum("returnCondition", ["excellent", "good", "fair", "poor", "damaged"]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  toolIdIdx: index("toolId_idx").on(table.toolId),
  workerIdIdx: index("workerId_idx").on(table.workerId),
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
}));

export type SiteToolAssignment = typeof siteToolAssignments.$inferSelect;
export type InsertSiteToolAssignment = typeof siteToolAssignments.$inferInsert;

/**
 * Site Tool Maintenance - Manutenção de ferramentas
 */
export const siteToolMaintenance = mysqlTable("siteToolMaintenance", {
  id: int("id").autoincrement().primaryKey(),
  toolId: int("toolId").notNull(),
  type: mysqlEnum("type", ["preventive", "corrective", "replacement"]).notNull(),
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  requestedBy: int("requestedBy"),
  performedBy: varchar("performedBy", { length: 255 }),
  status: mysqlEnum("status", ["requested", "in_progress", "completed", "cancelled"]).default("requested").notNull(),
  requestedAt: timestamp("requestedAt").notNull(),
  completedAt: timestamp("completedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  toolIdIdx: index("toolId_idx").on(table.toolId),
  statusIdx: index("status_idx").on(table.status),
}));

export type SiteToolMaintenance = typeof siteToolMaintenance.$inferSelect;
export type InsertSiteToolMaintenance = typeof siteToolMaintenance.$inferInsert;

/**
 * Site Work Photos - Fotografias de trabalhos executados
 */
export const siteWorkPhotos = mysqlTable("siteWorkPhotos", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  uploaderType: mysqlEnum("uploaderType", ["worker", "subcontractor", "director", "inspector", "safety"]).notNull(),
  photoUrl: varchar("photoUrl", { length: 500 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  tags: text("tags"), // JSON array of tags
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  uploadedByIdx: index("uploadedBy_idx").on(table.uploadedBy),
  dateIdx: index("date_idx").on(table.date),
}));

export type SiteWorkPhoto = typeof siteWorkPhotos.$inferSelect;
export type InsertSiteWorkPhoto = typeof siteWorkPhotos.$inferInsert;

/**
 * Site Incidents - Ocorrências em obra
 */
export const siteIncidents = mysqlTable("siteIncidents", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  reportedBy: int("reportedBy").notNull(),
  type: mysqlEnum("type", ["safety", "quality", "delay", "damage", "theft", "other"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }),
  photos: text("photos"), // JSON array of photo URLs
  status: mysqlEnum("status", ["open", "investigating", "resolved", "closed"]).default("open").notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  resolution: text("resolution"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  reportedByIdx: index("reportedBy_idx").on(table.reportedBy),
  statusIdx: index("status_idx").on(table.status),
  dateIdx: index("date_idx").on(table.date),
}));

export type SiteIncident = typeof siteIncidents.$inferSelect;
export type InsertSiteIncident = typeof siteIncidents.$inferInsert;

/**
 * Site Subcontractors - Subempreiteiros
 */
export const siteSubcontractors = mysqlTable("siteSubcontractors", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactPerson: varchar("contactPerson", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }),
  nif: varchar("nif", { length: 50 }),
  specialty: varchar("specialty", { length: 255 }).notNull(),
  contractValue: decimal("contractValue", { precision: 12, scale: 2 }),
  startDate: date("startDate"),
  endDate: date("endDate"),
  status: mysqlEnum("status", ["active", "inactive", "completed"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  statusIdx: index("status_idx").on(table.status),
}));

export type SiteSubcontractor = typeof siteSubcontractors.$inferSelect;
export type InsertSiteSubcontractor = typeof siteSubcontractors.$inferInsert;

/**
 * Site Subcontractor Work - Trabalhos de subempreiteiros
 */
export const siteSubcontractorWork = mysqlTable("siteSubcontractorWork", {
  id: int("id").autoincrement().primaryKey(),
  subcontractorId: int("subcontractorId").notNull(),
  constructionId: int("constructionId").notNull(),
  date: date("date").notNull(),
  workDescription: text("workDescription").notNull(),
  teamSize: int("teamSize"),
  hoursWorked: decimal("hoursWorked", { precision: 5, scale: 2 }),
  progress: decimal("progress", { precision: 5, scale: 2 }), // Percentage
  photos: text("photos"), // JSON array of photo URLs
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  subcontractorIdIdx: index("subcontractorId_idx").on(table.subcontractorId),
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  dateIdx: index("date_idx").on(table.date),
}));

export type SiteSubcontractorWork = typeof siteSubcontractorWork.$inferSelect;
export type InsertSiteSubcontractorWork = typeof siteSubcontractorWork.$inferInsert;

/**
 * Site Visits - Visitas à obra (Direção/Fiscalização)
 */
export const siteVisits = mysqlTable("siteVisits", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  visitedBy: int("visitedBy").notNull(),
  visitorType: mysqlEnum("visitorType", ["director", "inspector", "client", "architect", "engineer"]).notNull(),
  date: timestamp("date").notNull(),
  duration: int("duration"), // Minutes
  purpose: text("purpose"),
  observations: text("observations"),
  photos: text("photos"), // JSON array of photo URLs
  attendees: text("attendees"), // JSON array of attendee names
  reportGenerated: boolean("reportGenerated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  visitedByIdx: index("visitedBy_idx").on(table.visitedBy),
  dateIdx: index("date_idx").on(table.date),
}));

export type SiteVisit = typeof siteVisits.$inferSelect;
export type InsertSiteVisit = typeof siteVisits.$inferInsert;

/**
 * Site Non-Compliances - Não conformidades
 */
export const siteNonCompliances = mysqlTable("siteNonCompliances", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  reportedBy: int("reportedBy").notNull(),
  reporterType: mysqlEnum("reporterType", ["director", "inspector", "safety", "quality"]).notNull(),
  type: mysqlEnum("type", ["quality", "safety", "environmental", "contractual", "other"]).notNull(),
  severity: mysqlEnum("severity", ["minor", "major", "critical"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }),
  responsibleParty: varchar("responsibleParty", { length: 255 }), // Who is responsible
  photos: text("photos"), // JSON array of photo URLs
  correctiveAction: text("correctiveAction"),
  deadline: date("deadline"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  reportGenerated: boolean("reportGenerated").default(false).notNull(),
  reportUrl: varchar("reportUrl", { length: 500 }),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  reportedByIdx: index("reportedBy_idx").on(table.reportedBy),
  statusIdx: index("status_idx").on(table.status),
  dateIdx: index("date_idx").on(table.date),
}));

export type SiteNonCompliance = typeof siteNonCompliances.$inferSelect;
export type InsertSiteNonCompliance = typeof siteNonCompliances.$inferInsert;

/**
 * Site Quantity Map - Mapa de quantidades
 */
export const siteQuantityMap = mysqlTable("siteQuantityMap", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  item: varchar("item", { length: 255 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 50 }).notNull(),
  plannedQuantity: decimal("plannedQuantity", { precision: 12, scale: 2 }).notNull(),
  currentQuantity: decimal("currentQuantity", { precision: 12, scale: 2 }).default("0").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  categoryIdx: index("category_idx").on(table.category),
}));

export type SiteQuantityMap = typeof siteQuantityMap.$inferSelect;
export type InsertSiteQuantityMap = typeof siteQuantityMap.$inferInsert;

/**
 * Site Quantity Progress - Evolução de quantidades
 */
export const siteQuantityProgress = mysqlTable("siteQuantityProgress", {
  id: int("id").autoincrement().primaryKey(),
  quantityMapId: int("quantityMapId").notNull(),
  constructionId: int("constructionId").notNull(),
  updatedBy: int("updatedBy").notNull(),
  date: date("date").notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  photos: text("photos"), // JSON array of photo URLs
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  quantityMapIdIdx: index("quantityMapId_idx").on(table.quantityMapId),
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  dateIdx: index("date_idx").on(table.date),
}));

export type SiteQuantityProgress = typeof siteQuantityProgress.$inferSelect;
export type InsertSiteQuantityProgress = typeof siteQuantityProgress.$inferInsert;

/**
 * Site Safety Audits - Auditorias de segurança
 */
export const siteSafetyAudits = mysqlTable("siteSafetyAudits", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  auditedBy: int("auditedBy").notNull(),
  date: timestamp("date").notNull(),
  type: mysqlEnum("type", ["routine", "special", "incident_followup"]).notNull(),
  checklist: text("checklist"), // JSON array of checklist items
  findings: text("findings"),
  nonCompliances: text("nonCompliances"), // JSON array of non-compliance IDs
  recommendations: text("recommendations"),
  photos: text("photos"), // JSON array of photo URLs
  score: int("score"), // Overall safety score 0-100
  status: mysqlEnum("status", ["draft", "completed", "approved"]).default("draft").notNull(),
  reportGenerated: boolean("reportGenerated").default(false).notNull(),
  reportUrl: varchar("reportUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  auditedByIdx: index("auditedBy_idx").on(table.auditedBy),
  dateIdx: index("date_idx").on(table.date),
}));

export type SiteSafetyAudit = typeof siteSafetyAudits.$inferSelect;
export type InsertSiteSafetyAudit = typeof siteSafetyAudits.$inferInsert;

/**
 * Site Safety Incidents - Acidentes/Incidentes de segurança
 */
export const siteSafetyIncidents = mysqlTable("siteSafetyIncidents", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  reportedBy: int("reportedBy").notNull(),
  date: timestamp("date").notNull(),
  type: mysqlEnum("type", ["accident", "near_miss", "unsafe_condition", "unsafe_act"]).notNull(),
  severity: mysqlEnum("severity", ["minor", "moderate", "serious", "fatal"]).notNull(),
  injuredPerson: varchar("injuredPerson", { length: 255 }),
  injuryType: varchar("injuryType", { length: 255 }),
  bodyPart: varchar("bodyPart", { length: 255 }),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }),
  witnesses: text("witnesses"), // JSON array of witness names
  immediateAction: text("immediateAction"),
  rootCause: text("rootCause"),
  correctiveAction: text("correctiveAction"),
  preventiveAction: text("preventiveAction"),
  photos: text("photos"), // JSON array of photo URLs
  medicalAttention: boolean("medicalAttention").default(false).notNull(),
  workDaysLost: int("workDaysLost").default(0).notNull(),
  status: mysqlEnum("status", ["reported", "investigating", "closed"]).default("reported").notNull(),
  investigatedBy: int("investigatedBy"),
  investigatedAt: timestamp("investigatedAt"),
  reportGenerated: boolean("reportGenerated").default(false).notNull(),
  reportUrl: varchar("reportUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  reportedByIdx: index("reportedBy_idx").on(table.reportedBy),
  dateIdx: index("date_idx").on(table.date),
  statusIdx: index("status_idx").on(table.status),
}));

export type SiteSafetyIncident = typeof siteSafetyIncidents.$inferSelect;
export type InsertSiteSafetyIncident = typeof siteSafetyIncidents.$inferInsert;

/**
 * Site PPE - Equipamentos de Proteção Individual
 */
export const sitePPE = mysqlTable("sitePPE", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId"),
  type: varchar("type", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 100 }),
  size: varchar("size", { length: 50 }),
  quantity: int("quantity").notNull(),
  minQuantity: int("minQuantity").default(0).notNull(),
  assignedTo: int("assignedTo"), // Worker ID
  assignedAt: timestamp("assignedAt"),
  expiryDate: date("expiryDate"),
  status: mysqlEnum("status", ["available", "assigned", "expired", "damaged"]).default("available").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  assignedToIdx: index("assignedTo_idx").on(table.assignedTo),
  statusIdx: index("status_idx").on(table.status),
}));

export type SitePPE = typeof sitePPE.$inferSelect;
export type InsertSitePPE = typeof sitePPE.$inferInsert;


/**
 * Site Productivity Goals - Metas de Produtividade
 */
export const siteProductivityGoals = mysqlTable("siteProductivityGoals", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  workerId: int("workerId").notNull(),
  dailyGoal: decimal("dailyGoal", { precision: 10, scale: 2 }).notNull(),
  weeklyGoal: decimal("weeklyGoal", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }).default("unidades").notNull(),
  active: boolean("active").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  workerIdIdx: index("workerId_idx").on(table.workerId),
  activeIdx: index("active_idx").on(table.active),
}));

export type SiteProductivityGoal = typeof siteProductivityGoals.$inferSelect;
export type InsertSiteProductivityGoal = typeof siteProductivityGoals.$inferInsert;

/**
 * Site Productivity Alerts - Alertas de Produtividade
 */
export const siteProductivityAlerts = mysqlTable("siteProductivityAlerts", {
  id: int("id").autoincrement().primaryKey(),
  constructionId: int("constructionId").notNull(),
  workerId: int("workerId").notNull(),
  date: date("date").notNull(),
  actualQuantity: decimal("actualQuantity", { precision: 10, scale: 2 }).notNull(),
  goalQuantity: decimal("goalQuantity", { precision: 10, scale: 2 }).notNull(),
  percentageAchieved: decimal("percentageAchieved", { precision: 5, scale: 2 }).notNull(),
  alertType: mysqlEnum("alertType", ["above_goal", "below_goal", "on_target"]).notNull(),
  status: mysqlEnum("status", ["unread", "read", "acknowledged"]).default("unread").notNull(),
  notifiedAt: timestamp("notifiedAt"),
  acknowledgedBy: int("acknowledgedBy"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  workerIdIdx: index("workerId_idx").on(table.workerId),
  dateIdx: index("date_idx").on(table.date),
  alertTypeIdx: index("alertType_idx").on(table.alertType),
  statusIdx: index("status_idx").on(table.status),
}));

export type SiteProductivityAlert = typeof siteProductivityAlerts.$inferSelect;
export type InsertSiteProductivityAlert = typeof siteProductivityAlerts.$inferInsert;



/**
 * Budget Items - Itens Detalhados de Orçamento
 */
export const budgetItems = mysqlTable("budgetItems", {
  id: int("id").autoincrement().primaryKey(),
  budgetId: int("budgetId").notNull().references(() => budgets.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1.00").notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 15, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  budgetIdIdx: index("budgetId_idx").on(table.budgetId),
}));

export type BudgetItem = typeof budgetItems.$inferSelect;
export type InsertBudgetItem = typeof budgetItems.$inferInsert;

/**
 * Expenses - Despesas Reais
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id),
  budgetId: int("budgetId").references(() => budgets.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  expenseDate: timestamp("expenseDate").notNull(),
  supplier: varchar("supplier", { length: 255 }),
  invoiceNumber: varchar("invoiceNumber", { length: 100 }),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "paid", "overdue", "cancelled"]).default("pending").notNull(),
  paymentDate: timestamp("paymentDate"),
  receiptUrl: text("receiptUrl"),
  receiptKey: text("receiptKey"),
  notes: text("notes"),
  createdById: int("createdById").notNull().references(() => users.id),
  approvedById: int("approvedById").references(() => users.id),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  budgetIdIdx: index("budgetId_idx").on(table.budgetId),
  expenseDateIdx: index("expenseDate_idx").on(table.expenseDate),
  paymentStatusIdx: index("paymentStatus_idx").on(table.paymentStatus),
}));

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Budget Alerts - Alertas de Desvios Orçamentários
 */
export const budgetAlerts = mysqlTable("budgetAlerts", {
  id: int("id").autoincrement().primaryKey(),
  budgetId: int("budgetId").notNull().references(() => budgets.id, { onDelete: "cascade" }),
  alertType: mysqlEnum("alertType", ["warning", "critical", "exceeded"]).notNull(),
  threshold: int("threshold").notNull(), // Percentage threshold (e.g., 80, 90, 100)
  currentPercentage: int("currentPercentage").notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readById: int("readById").references(() => users.id),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  budgetIdIdx: index("budgetId_idx").on(table.budgetId),
  alertTypeIdx: index("alertType_idx").on(table.alertType),
  isReadIdx: index("isRead_idx").on(table.isRead),
}));

export type BudgetAlert = typeof budgetAlerts.$inferSelect;
export type InsertBudgetAlert = typeof budgetAlerts.$inferInsert;


/**
 * Client Company-Project relationship (many-to-many)
 * Links client companies (from suppliers table with category="client") to projects
 */
export const clientCompanyProjects = mysqlTable("clientCompanyProjects", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 100 }), // e.g., "Cliente Final", "Investidor", "Promotor"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  clientProjectIdx: index("clientCompanyProject_idx").on(table.clientId, table.projectId),
}));

export type ClientCompanyProject = typeof clientCompanyProjects.$inferSelect;
export type InsertClientCompanyProject = typeof clientCompanyProjects.$inferInsert;

/**
 * Supplier-Project relationship (many-to-many)
 */
export const supplierProjects = mysqlTable("supplierProjects", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }), // e.g., "Materiais", "Mão de Obra", "Equipamentos"
  totalValue: decimal("totalValue", { precision: 15, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  supplierProjectIdx: index("supplierProject_idx").on(table.supplierId, table.projectId),
}));

export type SupplierProject = typeof supplierProjects.$inferSelect;
export type InsertSupplierProject = typeof supplierProjects.$inferInsert;


/**
 * Library Tags - Centralized tag management for all library items
 */
export const libraryTags = mysqlTable("libraryTags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  category: mysqlEnum("category", ["material", "model", "inspiration", "general"]).default("general").notNull(),
  color: varchar("color", { length: 20 }).default("#C9A882"), // Default GAVINHO gold
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("libraryTag_category_idx").on(table.category),
}));
export type LibraryTag = typeof libraryTags.$inferSelect;
export type InsertLibraryTag = typeof libraryTags.$inferInsert;

/**
 * Library Materials - Physical materials, finishes, and products
 */
export const libraryMaterials = mysqlTable("libraryMaterials", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Art Deco", "Clássico", "Contemporâneo", etc.
  tags: text("tags"), // JSON array of tag IDs
  imageUrl: text("imageUrl"),
  fileUrl: text("fileUrl"), // PDF specs, technical sheets
  supplier: varchar("supplier", { length: 255 }),
  price: decimal("price", { precision: 15, scale: 2 }),
  unit: varchar("unit", { length: 50 }), // e.g., "m²", "unidade", "kg"
  createdById: int("createdById").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("approved"),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
}, (table) => ({
  categoryIdx: index("libraryMaterial_category_idx").on(table.category),
  supplierIdx: index("libraryMaterial_supplier_idx").on(table.supplier),
  createdByIdx: index("libraryMaterial_createdBy_idx").on(table.createdById),
}));
export type LibraryMaterial = typeof libraryMaterials.$inferSelect;
export type InsertLibraryMaterial = typeof libraryMaterials.$inferInsert;

/**
 * Library 3D Models - 3D models, BIM objects, and digital assets
 */
export const library3DModels = mysqlTable("library3DModels", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  tags: text("tags"), // JSON array of tag IDs
  thumbnailUrl: text("thumbnailUrl"),
  modelUrl: text("modelUrl").notNull(), // S3 URL to 3D model file
  fileFormat: varchar("fileFormat", { length: 50 }), // e.g., ".skp", ".3ds", ".obj", ".fbx"
  fileSize: int("fileSize"), // Size in bytes
  createdById: int("createdById").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  categoryIdx: index("library3DModel_category_idx").on(table.category),
  fileFormatIdx: index("library3DModel_fileFormat_idx").on(table.fileFormat),
  createdByIdx: index("library3DModel_createdBy_idx").on(table.createdById),
}));
export type Library3DModel = typeof library3DModels.$inferSelect;
export type InsertLibrary3DModel = typeof library3DModels.$inferInsert;

/**
 * Library Inspiration - Inspiration images, mood boards, and references
 */
export const libraryInspiration = mysqlTable("libraryInspiration", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  tags: text("tags"), // JSON array of tag IDs
  imageUrl: text("imageUrl").notNull(),
  sourceUrl: text("sourceUrl"), // Original source URL if applicable
  projectId: int("projectId").references(() => projects.id), // Optional link to project
  createdById: int("createdById").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("libraryInspiration_project_idx").on(table.projectId),
  createdByIdx: index("libraryInspiration_createdBy_idx").on(table.createdById),
}));
export type LibraryInspiration = typeof libraryInspiration.$inferSelect;
export type InsertLibraryInspiration = typeof libraryInspiration.$inferInsert;

/**
 * Project Materials - Materials from library associated with projects
 */
export const projectMaterials = mysqlTable("projectMaterials", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  materialId: int("materialId").notNull().references(() => libraryMaterials.id, { onDelete: "cascade" }),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 15, scale: 2 }), // Can override library price
  totalPrice: decimal("totalPrice", { precision: 15, scale: 2 }), // quantity * unitPrice
  notes: text("notes"),
  status: mysqlEnum("status", ["planned", "ordered", "delivered", "installed"]).default("planned").notNull(),
  addedById: int("addedById").notNull().references(() => users.id),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectMaterial_project_idx").on(table.projectId),
  materialIdIdx: index("projectMaterial_material_idx").on(table.materialId),
  statusIdx: index("projectMaterial_status_idx").on(table.status),
}));
export type ProjectMaterial = typeof projectMaterials.$inferSelect;
export type InsertProjectMaterial = typeof projectMaterials.$inferInsert;

/**
 * Project 3D Models - 3D models from library associated with projects
 */
export const projectModels3D = mysqlTable("projectModels3D", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  modelId: int("modelId").notNull().references(() => library3DModels.id, { onDelete: "cascade" }),
  location: varchar("location", { length: 255 }), // Where in the project this model is used
  notes: text("notes"),
  addedById: int("addedById").notNull().references(() => users.id),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectModel_project_idx").on(table.projectId),
  modelIdIdx: index("projectModel_model_idx").on(table.modelId),
}));
export type ProjectModel3D = typeof projectModels3D.$inferSelect;
export type InsertProjectModel3D = typeof projectModels3D.$inferInsert;

/**
 * Project Inspiration - Inspiration images from library associated with projects
 */
export const projectInspirationLinks = mysqlTable("projectInspirationLinks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  inspirationId: int("inspirationId").notNull().references(() => libraryInspiration.id, { onDelete: "cascade" }),
  notes: text("notes"),
  addedById: int("addedById").notNull().references(() => users.id),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectInspiration_project_idx").on(table.projectId),
  inspirationIdIdx: index("projectInspiration_inspiration_idx").on(table.inspirationId),
}));
export type ProjectInspirationLink = typeof projectInspirationLinks.$inferSelect;
export type InsertProjectInspirationLink = typeof projectInspirationLinks.$inferInsert;


// Material Price History
export const materialPriceHistory = mysqlTable("materialPriceHistory", {
  id: int("id").primaryKey().autoincrement(),
  materialId: int("materialId").notNull().references(() => libraryMaterials.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // m², m, un, kg, l
  supplierName: varchar("supplierName", { length: 255 }),
  notes: text("notes"),
  recordedAt: timestamp("recordedAt").notNull().defaultNow(),
  recordedById: int("recordedById").notNull().references(() => users.id),
});

export type MaterialPriceHistory = typeof materialPriceHistory.$inferSelect;
export type InsertMaterialPriceHistory = typeof materialPriceHistory.$inferInsert;

/**
 * Material Suggestions - AI-powered material suggestions for projects
 */
export const materialSuggestions = mysqlTable("materialSuggestions", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  suggestedMaterialId: int("suggestedMaterialId").notNull().references(() => libraryMaterials.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(), // Why this material was suggested
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100 score
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  matchFactors: text("matchFactors"), // JSON: {budget: true, style: true, history: false}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
  respondedById: int("respondedById").references(() => users.id),
}, (table) => ({
  projectIdIdx: index("materialSuggestion_project_idx").on(table.projectId),
  materialIdIdx: index("materialSuggestion_material_idx").on(table.suggestedMaterialId),
  statusIdx: index("materialSuggestion_status_idx").on(table.status),
}));

export type MaterialSuggestion = typeof materialSuggestions.$inferSelect;
export type InsertMaterialSuggestion = typeof materialSuggestions.$inferInsert;

/**
 * Material Collections - User-created collections to organize materials
 */
export const materialCollections = mysqlTable("materialCollections", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 50 }), // Hex color for visual identification
  icon: varchar("icon", { length: 50 }), // Icon name from lucide-react
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("materialCollection_user_idx").on(table.userId),
}));

export type MaterialCollection = typeof materialCollections.$inferSelect;
export type InsertMaterialCollection = typeof materialCollections.$inferInsert;

/**
 * Collection Materials - Materials within collections
 */
export const collectionMaterials = mysqlTable("collectionMaterials", {
  id: int("id").primaryKey().autoincrement(),
  collectionId: int("collectionId").notNull().references(() => materialCollections.id, { onDelete: "cascade" }),
  materialId: int("materialId").notNull().references(() => libraryMaterials.id, { onDelete: "cascade" }),
  notes: text("notes"), // User notes about why this material is in this collection
  displayOrder: int("displayOrder").notNull().default(0),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
}, (table) => ({
  collectionIdIdx: index("collectionMaterial_collection_idx").on(table.collectionId),
  materialIdIdx: index("collectionMaterial_material_idx").on(table.materialId),
  // Unique constraint: same material can't be added twice to same collection
  uniqueCollectionMaterial: index("unique_collection_material").on(table.collectionId, table.materialId),
}));

export type CollectionMaterial = typeof collectionMaterials.$inferSelect;
export type InsertCollectionMaterial = typeof collectionMaterials.$inferInsert;

/**
 * Favorite Materials - User's favorite materials for quick access
 */
export const favoriteMaterials = mysqlTable("favoriteMaterials", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  materialId: int("materialId").notNull().references(() => libraryMaterials.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("favoriteMaterial_user_idx").on(table.userId),
  materialIdIdx: index("favoriteMaterial_material_idx").on(table.materialId),
  // Unique constraint: same material can't be favorited twice by same user
  uniqueUserMaterial: index("unique_user_material").on(table.userId, table.materialId),
}));

export type FavoriteMaterial = typeof favoriteMaterials.$inferSelect;
export type InsertFavoriteMaterial = typeof favoriteMaterials.$inferInsert;


/**
 * Material Comments - User comments and discussions on materials
 */
export const materialComments = mysqlTable("materialComments", {
  id: int("id").primaryKey().autoincrement(),
  materialId: int("materialId").notNull().references(() => libraryMaterials.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isPinned: boolean("isPinned").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull().onUpdateNow(),
}, (table) => ({
  materialIdIdx: index("materialComment_material_idx").on(table.materialId),
  userIdIdx: index("materialComment_user_idx").on(table.userId),
  pinnedIdx: index("materialComment_pinned_idx").on(table.isPinned),
}));

export type MaterialComment = typeof materialComments.$inferSelect;
export type InsertMaterialComment = typeof materialComments.$inferInsert;


export const commentNotifications = mysqlTable("commentNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  materialId: int("material_id").notNull().references(() => libraryMaterials.id, { onDelete: "cascade" }),
  commentId: int("comment_id").notNull().references(() => materialComments.id, { onDelete: "cascade" }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const commentReactions = mysqlTable("commentReactions", {
  id: int("id").autoincrement().primaryKey(),
  commentId: int("comment_id").notNull().references(() => materialComments.id, { onDelete: "cascade" }),
  userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  emoji: varchar("emoji", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueReaction: unique().on(table.commentId, table.userId, table.emoji),
}));


/**
 * Material Approval History - Track approval/rejection actions
 */
export const materialApprovalHistory = mysqlTable("materialApprovalHistory", {
  id: int("id").autoincrement().primaryKey(),
  materialId: int("materialId").notNull().references(() => libraryMaterials.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: mysqlEnum("action", ["approved", "rejected"]).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MaterialApprovalHistory = typeof materialApprovalHistory.$inferSelect;
export type InsertMaterialApprovalHistory = typeof materialApprovalHistory.$inferInsert;


/**
 * Time Tracking - Track hours worked by team members
 */
export const timeTracking = mysqlTable("timeTracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: int("projectId").references(() => projects.id, { onDelete: "set null" }),
  taskId: int("taskId"),
  description: text("description").notNull(),
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("timeTracking_user_idx").on(table.userId),
  projectIdIdx: index("timeTracking_project_idx").on(table.projectId),
  dateIdx: index("timeTracking_date_idx").on(table.date),
}));

export type TimeTracking = typeof timeTracking.$inferSelect;
export type InsertTimeTracking = typeof timeTracking.$inferInsert;

/**
 * Task Assignments - Assign tasks to team members
 */
export const taskAssignments = mysqlTable("taskAssignments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  dueDate: timestamp("dueDate"),
  estimatedHours: decimal("estimatedHours", { precision: 5, scale: 2 }),
  actualHours: decimal("actualHours", { precision: 5, scale: 2 }).default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("taskAssignments_project_idx").on(table.projectId),
  userIdIdx: index("taskAssignments_user_idx").on(table.userId),
  statusIdx: index("taskAssignments_status_idx").on(table.status),
  dueDateIdx: index("taskAssignments_dueDate_idx").on(table.dueDate),
}));

export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = typeof taskAssignments.$inferInsert;

/**
 * User Availability - Track team member availability calendar
 */
export const userAvailability = mysqlTable("userAvailability", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  status: mysqlEnum("status", ["available", "busy", "off", "vacation"]).default("available").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userAvailability_user_idx").on(table.userId),
  dateIdx: index("userAvailability_date_idx").on(table.date),
  uniqueUserDate: unique().on(table.userId, table.date),
}));

export type UserAvailability = typeof userAvailability.$inferSelect;
export type InsertUserAvailability = typeof userAvailability.$inferInsert;


/**
 * Cost Predictions table - AI-powered cost predictions for projects
 */
export const costPredictions = mysqlTable("costPredictions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  predictedCost: decimal("predictedCost", { precision: 15, scale: 2 }).notNull(),
  confidenceLevel: mysqlEnum("confidenceLevel", ["low", "medium", "high"]).notNull(),
  confidenceScore: int("confidenceScore").notNull(), // 0-100
  overrunRisk: mysqlEnum("overrunRisk", ["low", "medium", "high", "critical"]).notNull(),
  overrunProbability: int("overrunProbability").notNull(), // 0-100
  analysisDate: timestamp("analysisDate").defaultNow().notNull(),
  basedOnProjects: json("basedOnProjects").$type<number[]>().default([]), // Array of similar project IDs
  factors: json("factors").$type<{
    complexity: number;
    duration: number;
    teamSize: number;
    location: string;
    projectType: string;
    historicalAccuracy: number;
  }>().notNull(),
  recommendations: json("recommendations").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  analysisDateIdx: index("analysisDate_idx").on(table.analysisDate),
  overrunRiskIdx: index("overrunRisk_idx").on(table.overrunRisk),
}));

export type CostPrediction = typeof costPredictions.$inferSelect;
export type InsertCostPrediction = typeof costPredictions.$inferInsert;


/**
 * Report Templates table - Customizable report templates
 */
export const reportTemplates = mysqlTable("reportTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdById: int("createdById").notNull().references(() => users.id),
  isPublic: int("isPublic").default(0).notNull(), // 0 = private, 1 = public
  
  // Report Configuration
  reportType: mysqlEnum("reportType", ["progress", "financial", "resources", "timeline", "custom"]).notNull(),
  metrics: json("metrics").$type<string[]>().default([]), // Array of metric IDs to include
  chartTypes: json("chartTypes").$type<{
    metricId: string;
    chartType: "line" | "bar" | "pie" | "area" | "table";
  }[]>().default([]),
  filters: json("filters").$type<{
    projectIds?: number[];
    dateRange?: { start: string; end: string };
    status?: string[];
    priority?: string[];
  }>().notNull(),
  
  // Layout Configuration
  layout: json("layout").$type<{
    sections: {
      id: string;
      type: "header" | "metrics" | "chart" | "table" | "text";
      order: number;
      config: any;
    }[];
  }>().notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  createdByIdIdx: index("createdById_idx").on(table.createdById),
  reportTypeIdx: index("reportType_idx").on(table.reportType),
  isPublicIdx: index("isPublic_idx").on(table.isPublic),
}));

export type ReportTemplate = typeof reportTemplates.$inferSelect;
export type InsertReportTemplate = typeof reportTemplates.$inferInsert;

/**
 * Report Executions table - History of generated reports
 */
export const reportExecutions = mysqlTable("reportExecutions", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull().references(() => reportTemplates.id, { onDelete: "cascade" }),
  executedById: int("executedById").notNull().references(() => users.id),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  
  // Execution Parameters
  parameters: json("parameters").$type<{
    projectIds?: number[];
    dateRange?: { start: string; end: string };
    customFilters?: any;
  }>().notNull(),
  
  // Generated Data
  data: json("data").$type<any>().notNull(),
  
  // Export Information
  exportFormat: mysqlEnum("exportFormat", ["pdf", "excel", "csv", "json"]).notNull(),
  fileUrl: text("fileUrl"), // S3 URL if exported
  fileSize: int("fileSize"), // File size in bytes
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  templateIdIdx: index("templateId_idx").on(table.templateId),
  executedByIdIdx: index("executedById_idx").on(table.executedById),
  executedAtIdx: index("executedAt_idx").on(table.executedAt),
}));

export type ReportExecution = typeof reportExecutions.$inferSelect;
export type InsertReportExecution = typeof reportExecutions.$inferInsert;


/**
 * Calendar Events table - Events, deadlines, and appointments
 */
export const calendarEvents = mysqlTable("calendarEvents", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Date and Time
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  allDay: int("allDay").default(0).notNull(), // 0 = specific time, 1 = all day event
  
  // Event Type and Category
  eventType: mysqlEnum("eventType", [
    "meeting",
    "deadline",
    "delivery",
    "site_visit",
    "presentation",
    "milestone",
    "personal",
    "other"
  ]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  
  // Relations
  projectId: int("projectId").references(() => projects.id, { onDelete: "cascade" }),
  // deliveryId: int("deliveryId").references(() => deliveries.id, { onDelete: "cascade" }), // Table deliveries not defined
  constructionId: int("constructionId").references(() => constructions.id, { onDelete: "cascade" }),
  createdById: int("createdById").notNull().references(() => users.id),
  
  // Location
  location: varchar("location", { length: 255 }),
  
  // Recurrence
  isRecurring: int("isRecurring").default(0).notNull(),
  recurrenceRule: json("recurrenceRule").$type<{
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: string;
    daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  }>(),
  
  // Reminders
  reminderMinutes: int("reminderMinutes"), // Minutes before event to send reminder
  
  // Status
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "postponed"]).default("scheduled").notNull(),
  
  // Color coding
  color: varchar("color", { length: 7 }).default("#C9A882"), // Hex color for visual distinction
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
  deliveryIdIdx: index("deliveryId_idx").on(table.deliveryId),
  constructionIdIdx: index("constructionId_idx").on(table.constructionId),
  createdByIdIdx: index("createdById_idx").on(table.createdById),
  startDateIdx: index("startDate_idx").on(table.startDate),
  endDateIdx: index("endDate_idx").on(table.endDate),
  eventTypeIdx: index("eventType_idx").on(table.eventType),
  statusIdx: index("status_idx").on(table.status),
}));

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Audit Logs - Track sensitive operations for compliance and security
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // User who performed the action
  action: varchar("action", { length: 100 }).notNull(), // e.g., "view_budget", "update_contract", "change_role"
  entityType: varchar("entityType", { length: 50 }).notNull(), // e.g., "budget", "contract", "user"
  entityId: int("entityId"), // ID of the affected entity
  details: text("details"), // JSON with additional context
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 or IPv6
  userAgent: text("userAgent"), // Browser/client info
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  actionIdx: index("action_idx").on(table.action),
  entityTypeIdx: index("entity_type_idx").on(table.entityType),
  createdAtIdx: index("created_at_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Project Client Access - Associate clients with specific projects
 */
export const projectClientAccess = mysqlTable("projectClientAccess", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  clientUserId: int("clientUserId").notNull(), // User with role "client"
  accessLevel: mysqlEnum("accessLevel", ["view", "comment", "upload"]).default("view").notNull(),
  grantedById: int("grantedById").notNull(), // Admin who granted access
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
}, (table) => ({
  projectIdx: index("project_idx").on(table.projectId),
  clientIdx: index("client_idx").on(table.clientUserId),
}));

export type ProjectClientAccess = typeof projectClientAccess.$inferSelect;
export type InsertProjectClientAccess = typeof projectClientAccess.$inferInsert;

/**
 * Contract Processing History
 * Tracks all contract uploads and processing attempts
 */
export const contractProcessingHistory = mysqlTable("contractProcessingHistory", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  status: mysqlEnum("status", ["processing", "success", "error"]).notNull(),
  errorMessage: text("errorMessage"),
  
  // Extracted data (stored as JSON for flexibility)
  extractedData: json("extractedData"),
  
  // Processing metadata
  processingStartedAt: timestamp("processingStartedAt").notNull(),
  processingCompletedAt: timestamp("processingCompletedAt"),
  processingDurationMs: int("processingDurationMs"), // duration in milliseconds
  
  // User who triggered the upload
  uploadedById: int("uploadedById").notNull(),
  
  // Reprocessing tracking
  isReprocessing: int("isReprocessing").default(0).notNull(), // 0 = false, 1 = true
  originalProcessingId: int("originalProcessingId"), // reference to original if this is a reprocess
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContractProcessingHistory = typeof contractProcessingHistory.$inferSelect;
export type InsertContractProcessingHistory = typeof contractProcessingHistory.$inferInsert;
