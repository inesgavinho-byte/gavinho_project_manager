import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index, date } from "drizzle-orm/mysql-core";

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
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileType: varchar("fileType", { length: 100 }), // e.g., "application/pdf", "image/jpeg"
  fileSize: int("fileSize"), // in bytes
  category: mysqlEnum("category", ["contract", "plan", "license", "invoice", "drawing", "specification", "photo", "report", "other"]).default("other").notNull(),
  uploadedById: int("uploadedById").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdIdx: index("projectId_idx").on(table.projectId),
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
  isRead: int("isRead").default(0).notNull(), // 0 = not read, 1 = read
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
  isRead: int("isRead").default(0).notNull(), // 0 = not read, 1 = read
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
