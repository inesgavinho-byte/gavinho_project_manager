import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, foreignKey, int, mysqlEnum, date, text, timestamp, json, varchar, decimal, tinyint, bigint } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const absences = mysqlTable("absences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	type: mysqlEnum(['vacation','sick','personal','other']).default('vacation').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date({ mode: 'string' }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date({ mode: 'string' }).notNull(),
	days: int().notNull(),
	reason: text(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	approvedBy: int().references(() => users.id, { onDelete: "set null" } ),
	approvedAt: timestamp({ mode: 'string' }),
	rejectionReason: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("status_idx").on(table.status),
	index("startDate_idx").on(table.startDate),
]);

export const archvizAnnotations = mysqlTable("archvizAnnotations", {
	id: int().autoincrement().notNull(),
	renderId: int().notNull(),
	annotationsData: json().notNull(),
	createdById: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("renderId_idx").on(table.renderId),
	index("createdById_idx").on(table.createdById),
]);

export const archvizComments = mysqlTable("archvizComments", {
	id: int().autoincrement().notNull(),
	renderId: int().notNull(),
	userId: int().notNull(),
	content: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("renderId_idx").on(table.renderId),
	index("userId_idx").on(table.userId),
]);

export const archvizCompartments = mysqlTable("archvizCompartments", {
	id: int().autoincrement().notNull(),
	parentId: int(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	order: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	projectId: int().notNull(),
},
(table) => [
	index("parentId_idx").on(table.parentId),
	index("projectId_idx").on(table.projectId),
]);

export const archvizRenderComments = mysqlTable("archvizRenderComments", {
	id: int().autoincrement().notNull(),
	renderId: int().notNull(),
	userId: int().notNull(),
	comment: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("renderId_idx").on(table.renderId),
	index("userId_idx").on(table.userId),
]);

export const archvizRenderHistory = mysqlTable("archvizRenderHistory", {
	id: int().autoincrement().notNull(),
	renderId: int().notNull(),
	userId: int().notNull(),
	action: mysqlEnum(['created','status_changed','approved','rejected','commented']).notNull(),
	oldValue: text(),
	newValue: text(),
	comment: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("renderId_idx").on(table.renderId),
	index("userId_idx").on(table.userId),
]);

export const archvizRenders = mysqlTable("archvizRenders", {
	id: int().autoincrement().notNull(),
	compartmentId: int(),
	version: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	fileUrl: text().notNull(),
	fileKey: text().notNull(),
	thumbnailUrl: text(),
	mimeType: varchar({ length: 100 }),
	fileSize: int(),
	isFavorite: tinyint().default(0).notNull(),
	status: mysqlEnum(['pending','approved_dc','approved_client']).default('pending').notNull(),
	uploadedById: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	projectId: int().notNull(),
	approvalStatus: mysqlEnum(['pending','in_review','approved','rejected']).default('pending').notNull(),
	approvedById: int(),
	approvedAt: timestamp({ mode: 'string' }),
	rejectionReason: text(),
},
(table) => [
	index("compartmentId_idx").on(table.compartmentId),
	index("uploadedById_idx").on(table.uploadedById),
	index("projectId_idx").on(table.projectId),
]);

export const archvizStatusHistory = mysqlTable("archvizStatusHistory", {
	id: int().autoincrement().notNull(),
	renderId: int().notNull(),
	oldStatus: mysqlEnum(['pending','approved_dc','approved_client']),
	newStatus: mysqlEnum(['pending','approved_dc','approved_client']).notNull(),
	changedById: int().notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("renderId_idx").on(table.renderId),
	index("changedById_idx").on(table.changedById),
	index("createdAt_idx").on(table.createdAt),
]);

export const auditLogs = mysqlTable("auditLogs", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	action: varchar({ length: 100 }).notNull(),
	entityType: varchar({ length: 50 }).notNull(),
	entityId: int(),
	details: text(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("user_idx").on(table.userId),
	index("action_idx").on(table.action),
	index("entity_type_idx").on(table.entityType),
	index("created_at_idx").on(table.createdAt),
]);

export const budgetAlerts = mysqlTable("budgetAlerts", {
	id: int().autoincrement().notNull(),
	budgetId: int().notNull().references(() => budgets.id, { onDelete: "cascade" } ),
	alertType: mysqlEnum(['warning','critical','exceeded']).notNull(),
	threshold: int().notNull(),
	currentPercentage: int().notNull(),
	message: text().notNull(),
	isRead: tinyint().default(0).notNull(),
	readById: int().references(() => users.id, { onDelete: "set null" } ),
	readAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("budgetId_idx").on(table.budgetId),
	index("alertType_idx").on(table.alertType),
	index("isRead_idx").on(table.isRead),
]);

export const budgetItems = mysqlTable("budgetItems", {
	id: int().autoincrement().notNull(),
	budgetId: int().notNull().references(() => budgets.id, { onDelete: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	quantity: decimal({ precision: 10, scale: 2 }).default('1.00').notNull(),
	unitPrice: decimal({ precision: 15, scale: 2 }).notNull(),
	totalPrice: decimal({ precision: 15, scale: 2 }).notNull(),
	unit: varchar({ length: 50 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("budgetId_idx").on(table.budgetId),
]);

export const budgets = mysqlTable("budgets", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" } ),
	category: varchar({ length: 100 }).notNull(),
	description: text(),
	budgetedAmount: decimal({ precision: 15, scale: 2 }).notNull(),
	actualAmount: decimal({ precision: 15, scale: 2 }).default('0.00'),
	variance: decimal({ precision: 15, scale: 2 }).default('0.00'),
	variancePercent: decimal({ precision: 5, scale: 2 }).default('0.00'),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	name: varchar({ length: 255 }).default('').notNull(),
	status: mysqlEnum(['draft','approved','active','closed']).default('draft').notNull(),
	startDate: timestamp({ mode: 'string' }),
	endDate: timestamp({ mode: 'string' }),
	createdById: int().default(1).notNull(),
	approvedById: int(),
	approvedAt: timestamp({ mode: 'string' }),
});

export const clientCompanyProjects = mysqlTable("clientCompanyProjects", {
	id: int().autoincrement().notNull(),
	clientId: int().notNull().references(() => suppliers.id, { onDelete: "cascade" } ),
	projectId: int().notNull().references(() => projects.id, { onDelete: "set null" } ),
	role: varchar({ length: 100 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("clientCompanyProject_idx").on(table.clientId, table.projectId),
]);

export const clientDocuments = mysqlTable("clientDocuments", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	fileUrl: varchar({ length: 512 }).notNull(),
	fileKey: varchar({ length: 512 }).notNull(),
	fileType: varchar({ length: 50 }).notNull(),
	fileSize: int(),
	version: int().default(1).notNull(),
	uploadedBy: int().notNull(),
	uploadedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("projectId_idx").on(table.projectId),
	index("uploadedBy_idx").on(table.uploadedBy),
	index("fileType_idx").on(table.fileType),
]);

export const clientMessages = mysqlTable("clientMessages", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	senderId: int().notNull(),
	message: text().notNull(),
	attachmentUrl: varchar({ length: 512 }),
	isRead: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("projectId_idx").on(table.projectId),
	index("senderId_idx").on(table.senderId),
	index("createdAt_idx").on(table.createdAt),
]);

export const clientProjects = mysqlTable("clientProjects", {
	id: int().autoincrement().notNull(),
	clientId: int().notNull(),
	projectId: int().notNull(),
	accessLevel: mysqlEnum(['view','comment','approve']).default('view').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("clientId_idx").on(table.clientId),
	index("projectId_idx").on(table.projectId),
	index("clientProject_idx").on(table.clientId, table.projectId),
]);

export const collectionMaterials = mysqlTable("collectionMaterials", {
	id: int().autoincrement().notNull(),
	collectionId: int().notNull().references(() => materialCollections.id, { onDelete: "cascade" } ),
	materialId: int().notNull().references(() => libraryMaterials.id, { onDelete: "set null" } ),
	notes: text(),
	displayOrder: int().default(0).notNull(),
	addedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("collectionMaterial_collection_idx").on(table.collectionId),
	index("collectionMaterial_material_idx").on(table.materialId),
	index("unique_collection_material").on(table.collectionId, table.materialId),
	index("collectionMaterial_order_idx").on(table.collectionId, table.displayOrder),
]);

export const commentMentions = mysqlTable("commentMentions", {
	id: int().autoincrement().notNull(),
	commentId: int().notNull(),
	mentionedUserId: int().notNull(),
	mentionedBy: int().notNull(),
	scenarioId: int().notNull(),
	isRead: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("comment_idx").on(table.commentId),
	index("mentioned_user_idx").on(table.mentionedUserId),
]);

export const commentNotifications = mysqlTable("commentNotifications", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" } ),
	materialId: int("material_id").notNull().references(() => libraryMaterials.id, { onDelete: "set null" } ),
	commentId: int("comment_id").notNull().references(() => materialComments.id),
	read: tinyint().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_user_read").on(table.userId, table.read),
	index("idx_material").on(table.materialId),
]);

export const commentReactions = mysqlTable("commentReactions", {
	id: int().autoincrement().notNull(),
	commentId: int("comment_id").notNull().references(() => materialComments.id, { onDelete: "cascade" } ),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "set null" } ),
	emoji: varchar({ length: 10 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("unique_reaction").on(table.commentId, table.userId, table.emoji),
	index("idx_comment").on(table.commentId),
]);

export const constructions = mysqlTable("constructions", {
	id: int().autoincrement().notNull(),
	code: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	projectId: int(),
	client: varchar({ length: 255 }),
	location: varchar({ length: 255 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date({ mode: 'string' }),
	status: mysqlEnum(['not_started','in_progress','on_hold','completed','cancelled']).default('not_started').notNull(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	budget: decimal({ precision: 12, scale: 2 }),
	actualCost: decimal({ precision: 12, scale: 2 }).default('0.00'),
	progress: int().default(0),
	description: text(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	deletedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("code_idx").on(table.code),
	index("projectId_idx").on(table.projectId),
	index("status_idx").on(table.status),
	index("code").on(table.code),
]);

export const contractProcessingHistory = mysqlTable("contractProcessingHistory", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileUrl: text().notNull(),
	fileSize: int().notNull(),
	status: mysqlEnum(['processing','success','error']).notNull(),
	errorMessage: text(),
	extractedData: json(),
	processingStartedAt: timestamp({ mode: 'string' }).notNull(),
	processingCompletedAt: timestamp({ mode: 'string' }),
	processingDurationMs: int(),
	uploadedById: int().notNull(),
	isReprocessing: tinyint().default(0).notNull(),
	originalProcessingId: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const deliveryApprovals = mysqlTable("deliveryApprovals", {
	id: int().autoincrement().notNull(),
	deliveryId: int().notNull(),
	reviewerId: int().notNull(),
	status: mysqlEnum(['approved','rejected','revision_requested']).notNull(),
	comments: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("deliveryId_idx").on(table.deliveryId),
	index("reviewerId_idx").on(table.reviewerId),
]);

export const documentAccessLog = mysqlTable("document_access_log", {
	id: int().autoincrement().notNull(),
	revisionId: int("revision_id").notNull().references(() => documentRevisions.id, { onDelete: "cascade" } ),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "restrict" } ),
	accessType: mysqlEnum("access_type", ['view','download','print','qr_scan']).notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	accessedAt: timestamp("accessed_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_document_access_log_revision").on(table.revisionId),
	index("idx_document_access_log_user").on(table.userId),
	index("idx_document_access_log_date").on(table.accessedAt),
]);

export const documentRevisions = mysqlTable("document_revisions", {
	id: int().autoincrement().notNull(),
	documentId: int("document_id").notNull().references((): AnyMySqlColumn => projectDocuments.id, { onDelete: "cascade" } ),
	revisionNumber: varchar("revision_number", { length: 10 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	revisionDate: date("revision_date", { mode: 'string' }).notNull(),
	fileKey: text("file_key").notNull(),
	fileUrl: text("file_url").notNull(),
	fileName: varchar("file_name", { length: 500 }).notNull(),
	fileSize: bigint("file_size", { mode: "number" }).notNull(),
	fileType: varchar("file_type", { length: 100 }).notNull(),
	thumbnailUrl: text("thumbnail_url"),
	description: text(),
	changeSummary: text("change_summary"),
	status: mysqlEnum(['draft','pending_approval','approved','rejected','superseded']).default('draft').notNull(),
	uploadedBy: int("uploaded_by").notNull().references(() => users.id, { onDelete: "restrict" } ),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	approvedBy: int("approved_by").references(() => users.id, { onDelete: "set null" } ),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
},
(table) => [
	index("unique_document_revision").on(table.documentId, table.revisionNumber),
	index("idx_document_revisions_document").on(table.documentId),
	index("idx_document_revisions_status").on(table.status),
	index("idx_document_revisions_revision").on(table.revisionNumber),
	index("idx_document_revisions_uploaded_at").on(table.uploadedAt),
]);

export const emails = mysqlTable("emails", {
	id: int().autoincrement().notNull(),
	projectId: int().references(() => projects.id, { onDelete: "cascade" } ),
	messageId: varchar({ length: 255 }).notNull(),
	subject: text(),
	fromEmail: varchar({ length: 320 }),
	fromName: varchar({ length: 255 }),
	toEmails: text(),
	ccEmails: text(),
	body: text(),
	category: mysqlEnum(['order','adjudication','purchase','communication','other']).default('other').notNull(),
	receivedAt: timestamp({ mode: 'string' }).notNull(),
	hasAttachments: tinyint().default(0),
	attachmentUrls: text(),
	isRead: tinyint().default(0),
	importedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("emails_messageId_unique").on(table.messageId),
]);

export const expenses = mysqlTable("expenses", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" } ),
	budgetId: int().references(() => budgets.id, { onDelete: "set null" } ),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	amount: decimal({ precision: 15, scale: 2 }).notNull(),
	expenseDate: timestamp({ mode: 'string' }).notNull(),
	supplier: varchar({ length: 255 }),
	invoiceNumber: varchar({ length: 100 }),
	paymentStatus: mysqlEnum(['pending','paid','overdue','cancelled']).default('pending').notNull(),
	paymentDate: timestamp({ mode: 'string' }),
	receiptUrl: text(),
	receiptKey: text(),
	notes: text(),
	createdById: int().notNull().references(() => users.id),
	approvedById: int().references(() => users.id),
	approvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("projectId_idx").on(table.projectId),
	index("budgetId_idx").on(table.budgetId),
	index("expenseDate_idx").on(table.expenseDate),
	index("paymentStatus_idx").on(table.paymentStatus),
]);

export const favoriteMaterials = mysqlTable("favoriteMaterials", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	materialId: int().notNull().references(() => libraryMaterials.id, { onDelete: "set null" } ),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("favoriteMaterial_user_idx").on(table.userId),
	index("favoriteMaterial_material_idx").on(table.materialId),
	index("unique_user_material").on(table.userId, table.materialId),
]);

export const holidays = mysqlTable("holidays", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	year: int().notNull(),
	type: mysqlEnum(['national','regional','company']).default('national').notNull(),
	isRecurring: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("date_idx").on(table.date),
	index("year_idx").on(table.year),
]);

export const library3DModels = mysqlTable("library3DModels", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }).notNull(),
	tags: text(),
	thumbnailUrl: text(),
	modelUrl: text().notNull(),
	fileFormat: varchar({ length: 50 }),
	fileSize: int(),
	createdById: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("library3DModel_category_idx").on(table.category),
	index("library3DModel_fileFormat_idx").on(table.fileFormat),
	index("library3DModel_createdBy_idx").on(table.createdById),
]);

export const libraryInspiration = mysqlTable("libraryInspiration", {
	id: int().autoincrement().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	tags: text(),
	imageUrl: text().notNull(),
	sourceUrl: text(),
	projectId: int().references(() => projects.id, { onDelete: "cascade" } ),
	createdById: int().notNull().references(() => users.id, { onDelete: "set null" } ),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("libraryInspiration_project_idx").on(table.projectId),
	index("libraryInspiration_createdBy_idx").on(table.createdById),
]);

export const libraryMaterials = mysqlTable("libraryMaterials", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }).notNull(),
	tags: text(),
	imageUrl: text(),
	fileUrl: text(),
	supplier: varchar({ length: 255 }),
	price: decimal({ precision: 15, scale: 2 }),
	unit: varchar({ length: 50 }),
	createdById: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	approvalStatus: mysqlEnum(['pending','approved','rejected']).default('approved'),
	approvedBy: int(),
	approvedAt: timestamp({ mode: 'string' }),
	rejectionReason: text(),
},
(table) => [
	index("libraryMaterial_category_idx").on(table.category),
	index("libraryMaterial_supplier_idx").on(table.supplier),
	index("libraryMaterial_createdBy_idx").on(table.createdById),
]);

export const libraryTags = mysqlTable("libraryTags", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	category: mysqlEnum(['material','model','inspiration','general']).default('general').notNull(),
	color: varchar({ length: 20 }).default('#C9A882'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("libraryTag_category_idx").on(table.category),
	index("name").on(table.name),
]);

export const materialApprovalHistory = mysqlTable("materialApprovalHistory", {
	id: int().autoincrement().notNull(),
	materialId: int().notNull().references(() => libraryMaterials.id, { onDelete: "cascade" } ),
	userId: int().notNull().references(() => users.id, { onDelete: "set null" } ),
	action: mysqlEnum(['approved','rejected']).notNull(),
	reason: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP'),
});

export const materialCollections = mysqlTable("materialCollections", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	color: varchar({ length: 50 }),
	icon: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("materialCollection_user_idx").on(table.userId),
]);

export const materialComments = mysqlTable("materialComments", {
	id: int().autoincrement().notNull(),
	materialId: int().notNull().references(() => libraryMaterials.id, { onDelete: "cascade" } ),
	userId: int().notNull().references(() => users.id, { onDelete: "set null" } ),
	content: text().notNull(),
	isPinned: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("materialComment_material_idx").on(table.materialId),
	index("materialComment_user_idx").on(table.userId),
	index("materialComment_pinned_idx").on(table.isPinned),
]);

export const materialPriceHistory = mysqlTable("materialPriceHistory", {
	id: int().autoincrement().notNull(),
	materialId: int().notNull().references(() => libraryMaterials.id, { onDelete: "cascade" } ),
	price: decimal({ precision: 10, scale: 2 }).notNull(),
	unit: varchar({ length: 50 }).notNull(),
	supplierName: varchar({ length: 255 }),
	notes: text(),
	recordedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	recordedById: int().notNull(),
},
(table) => [
	index("idx_material_date").on(table.materialId, table.recordedAt),
]);

export const materialSuggestions = mysqlTable("materialSuggestions", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" } ),
	suggestedMaterialId: int().notNull().references(() => libraryMaterials.id, { onDelete: "set null" } ),
	reason: text().notNull(),
	confidence: decimal({ precision: 5, scale: 2 }).notNull(),
	status: mysqlEnum(['pending','accepted','rejected']).default('pending').notNull(),
	matchFactors: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	respondedAt: timestamp({ mode: 'string' }),
	respondedById: int().references(() => users.id),
},
(table) => [
	index("materialSuggestion_project_idx").on(table.projectId),
	index("materialSuggestion_material_idx").on(table.suggestedMaterialId),
	index("materialSuggestion_status_idx").on(table.status),
]);

export const mqtCategories = mysqlTable("mqtCategories", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	code: varchar({ length: 20 }).notNull(),
	namePt: varchar({ length: 255 }).notNull(),
	nameEn: varchar({ length: 255 }),
	order: int().notNull(),
	subtotal: decimal({ precision: 12, scale: 2 }).default('0.00'),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("order_idx").on(table.order),
]);

export const mqtImportHistory = mysqlTable("mqtImportHistory", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	userId: int().notNull(),
	source: mysqlEnum(['excel','sheets']).notNull(),
	fileName: varchar({ length: 255 }),
	sheetsUrl: text(),
	itemsImported: int().default(0).notNull(),
	itemsSuccess: int().default(0).notNull(),
	itemsError: int().default(0).notNull(),
	errorLog: text(),
	importedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("userId_idx").on(table.userId),
	index("importedAt_idx").on(table.importedAt),
]);

export const mqtImportItems = mysqlTable("mqtImportItems", {
	id: int().autoincrement().notNull(),
	importId: int().notNull(),
	mqtItemId: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("importId_idx").on(table.importId),
	index("mqtItemId_idx").on(table.mqtItemId),
]);

export const mqtItemHistory = mysqlTable("mqtItemHistory", {
	id: int().autoincrement().notNull(),
	itemId: int().notNull(),
	userId: int().notNull(),
	oldValue: decimal({ precision: 10, scale: 2 }),
	newValue: decimal({ precision: 10, scale: 2 }).notNull(),
	changedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("itemId_idx").on(table.itemId),
	index("userId_idx").on(table.userId),
	index("changedAt_idx").on(table.changedAt),
]);

export const mqtItems = mysqlTable("mqtItems", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	categoryId: int().notNull(),
	code: varchar({ length: 20 }).notNull(),
	typePt: varchar({ length: 255 }),
	typeEn: varchar({ length: 255 }),
	subtypePt: varchar({ length: 255 }),
	subtypeEn: varchar({ length: 255 }),
	zonePt: varchar({ length: 255 }),
	zoneEn: varchar({ length: 255 }),
	descriptionPt: text().notNull(),
	descriptionEn: text(),
	unit: varchar({ length: 20 }).notNull(),
	quantity: decimal({ precision: 10, scale: 2 }).notNull(),
	quantityExecuted: decimal({ precision: 10, scale: 2 }).default('0.00'),
	unitPrice: decimal({ precision: 12, scale: 2 }),
	totalPrice: decimal({ precision: 12, scale: 2 }),
	supplierId: int(),
	status: mysqlEnum(['pending','ordered','in_progress','completed']).default('pending').notNull(),
	notes: text(),
	order: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("categoryId_idx").on(table.categoryId),
	index("supplierId_idx").on(table.supplierId),
	index("status_idx").on(table.status),
	index("order_idx").on(table.order),
]);

export const mqtValidationRules = mysqlTable("mqtValidationRules", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	ruleType: mysqlEnum(['price_min','price_max','code_pattern','quantity_min','quantity_max','duplicate_check']).notNull(),
	field: varchar({ length: 100 }).notNull(),
	condition: text(),
	severity: mysqlEnum(['error','warning','info']).default('warning').notNull(),
	message: text(),
	enabled: tinyint().default(1).notNull(),
	category: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("enabled_idx").on(table.enabled),
]);

export const notificationPreferences = mysqlTable("notificationPreferences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	aiAlerts: int().default(1).notNull(),
	deadlineWarnings: int().default(1).notNull(),
	budgetAlerts: int().default(1).notNull(),
	projectDelays: int().default(1).notNull(),
	taskOverdue: int().default(1).notNull(),
	orderPending: int().default(1).notNull(),
	systemNotifications: int().default(1).notNull(),
	deadlineWarningDays: int().default(7).notNull(),
	budgetThreshold: int().default(90).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId").on(table.userId),
]);

export const notifications = mysqlTable("notifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	projectId: int().references(() => projects.id, { onDelete: "cascade" } ),
	type: mysqlEnum(['deadline','delay','budget_alert','order_update','task_assigned','other']).default('other').notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	priority: mysqlEnum(['low','medium','high']).default('medium').notNull(),
	isRead: tinyint().default(0).notNull(),
	actionUrl: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const orders = mysqlTable("orders", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" } ),
	supplierId: int().references(() => suppliers.id),
	orderNumber: varchar({ length: 100 }),
	description: text().notNull(),
	orderType: mysqlEnum(['material','service','equipment','other']).default('material').notNull(),
	status: mysqlEnum(['pending','approved','ordered','in_transit','delivered','cancelled']).default('pending').notNull(),
	quantity: decimal({ precision: 15, scale: 3 }),
	unit: varchar({ length: 50 }),
	unitPrice: decimal({ precision: 15, scale: 2 }),
	totalAmount: decimal({ precision: 15, scale: 2 }).notNull(),
	orderDate: timestamp({ mode: 'string' }),
	expectedDeliveryDate: timestamp({ mode: 'string' }),
	actualDeliveryDate: timestamp({ mode: 'string' }),
	notes: text(),
	createdById: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const projectClientAccess = mysqlTable("projectClientAccess", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	clientUserId: int().notNull(),
	accessLevel: mysqlEnum(['view','comment','upload']).default('view').notNull(),
	grantedById: int().notNull(),
	grantedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	revokedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("project_idx").on(table.projectId),
	index("client_idx").on(table.clientUserId),
]);

export const projectDeliveries = mysqlTable("projectDeliveries", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	phaseId: int(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	type: mysqlEnum(['document','drawing','render','model','report','specification','other']).default('document').notNull(),
	dueDate: timestamp({ mode: 'string' }).notNull(),
	status: mysqlEnum(['pending','in_review','approved','rejected','delivered']).default('pending').notNull(),
	fileUrl: text(),
	fileKey: varchar({ length: 500 }),
	fileSize: int(),
	uploadedAt: timestamp({ mode: 'string' }),
	uploadedById: int(),
	assignedToId: int(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	notificationSent: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("projectId_idx").on(table.projectId),
	index("phaseId_idx").on(table.phaseId),
	index("status_idx").on(table.status),
	index("dueDate_idx").on(table.dueDate),
]);

export const projectDocuments = mysqlTable("projectDocuments", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	phaseId: int(),
	documentType: mysqlEnum(['design_review','project_management']).default('design_review').notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	fileUrl: text().notNull(),
	fileKey: varchar({ length: 500 }).notNull(),
	fileType: varchar({ length: 100 }),
	fileSize: int(),
	category: mysqlEnum(['plan','drawing','specification','render','approval','photo','report','contract','invoice','receipt','meeting_minutes','correspondence','legal_document','other']).default('other').notNull(),
	uploadedById: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("projectId_idx").on(table.projectId),
	index("category_idx").on(table.category),
	index("phaseId_idx").on(table.phaseId),
	index("documentType_idx").on(table.documentType),
]);

export const projectGallery = mysqlTable("projectGallery", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	phaseId: int(),
	title: varchar({ length: 255 }),
	description: text(),
	imageUrl: text().notNull(),
	imageKey: varchar({ length: 500 }).notNull(),
	thumbnailUrl: text(),
	category: varchar({ length: 100 }),
	takenAt: timestamp({ mode: 'string' }),
	uploadedById: int().notNull(),
	order: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("projectId_idx").on(table.projectId),
]);

export const projectInspirationLinks = mysqlTable("projectInspirationLinks", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" } ),
	inspirationId: int().notNull().references(() => libraryInspiration.id, { onDelete: "set null" } ),
	notes: text(),
	addedById: int().notNull().references(() => users.id),
	addedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("projectInspiration_project_idx").on(table.projectId),
	index("projectInspiration_inspiration_idx").on(table.inspirationId),
]);

export const projectMaterials = mysqlTable("projectMaterials", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" } ),
	materialId: int().notNull().references(() => libraryMaterials.id, { onDelete: "set null" } ),
	quantity: decimal({ precision: 10, scale: 2 }).notNull(),
	unitPrice: decimal({ precision: 15, scale: 2 }),
	totalPrice: decimal({ precision: 15, scale: 2 }),
	notes: text(),
	status: mysqlEnum(['planned','ordered','delivered','installed']).default('planned').notNull(),
	addedById: int().notNull().references(() => users.id),
	addedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("projectMaterial_project_idx").on(table.projectId),
	index("projectMaterial_material_idx").on(table.materialId),
	index("projectMaterial_status_idx").on(table.status),
]);

export const projectMilestones = mysqlTable("projectMilestones", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	phaseId: int(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	dueDate: timestamp({ mode: 'string' }).notNull(),
	completedDate: timestamp({ mode: 'string' }),
	status: mysqlEnum(['pending','completed','overdue']).default('pending').notNull(),
	isKeyMilestone: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	dependencies: json(),
},
(table) => [
	index("projectId_idx").on(table.projectId),
	index("phaseId_idx").on(table.phaseId),
]);

export const projectModels3D = mysqlTable("projectModels3D", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" } ),
	modelId: int().notNull().references(() => library3DModels.id, { onDelete: "set null" } ),
	location: varchar({ length: 255 }),
	notes: text(),
	addedById: int().notNull().references(() => users.id),
	addedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("projectModel_project_idx").on(table.projectId),
	index("projectModel_model_idx").on(table.modelId),
]);

export const projectPhases = mysqlTable("projectPhases", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	order: int().notNull(),
	startDate: timestamp({ mode: 'string' }),
	endDate: timestamp({ mode: 'string' }),
	status: mysqlEnum(['not_started','in_progress','completed','on_hold']).default('not_started').notNull(),
	progress: int().default(0).notNull(),
	assignedTo: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("projectId_idx").on(table.projectId),
]);

export const projectTeam = mysqlTable("projectTeam", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull(),
	userId: int().notNull(),
	role: varchar({ length: 100 }).notNull(),
	responsibilities: text(),
	joinedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	leftAt: timestamp({ mode: 'string' }),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	displayOrder: int().default(0).notNull(),
},
(table) => [
	index("projectId_idx").on(table.projectId),
	index("userId_idx").on(table.userId),
]);



export const projects = mysqlTable("projects", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	status: mysqlEnum(['planning','in_progress','on_hold','completed','cancelled']).default('planning').notNull(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	startDate: timestamp({ mode: 'string' }),
	endDate: timestamp({ mode: 'string' }),
	actualEndDate: timestamp({ mode: 'string' }),
	progress: int().default(0).notNull(),
	budget: decimal({ precision: 15, scale: 2 }),
	actualCost: decimal({ precision: 15, scale: 2 }).default('0.00'),
	responsibleId: int().references(() => users.id),
	clientName: varchar({ length: 255 }),
	location: text(),
	createdById: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	briefing: text(),
	objectives: text(),
	restrictions: text(),
	projectType: varchar({ length: 100 }),
	area: decimal({ precision: 10, scale: 2 }),
	clientId: int(),
	teamLead: int(),
	currentPhase: varchar({ length: 100 }),
	completionPercentage: int().default(0),
	estimatedRevenue: decimal({ precision: 15, scale: 2 }),
	actualRevenue: decimal({ precision: 15, scale: 2 }).default('0.00'),
	profitMargin: decimal({ precision: 5, scale: 2 }),
	tags: text(),
	coverImage: varchar({ length: 500 }),
	isArchived: int().default(0),
	deletedAt: timestamp({ mode: 'string' }),
	contractValue: varchar({ length: 255 }),
	contractSignedDate: timestamp({ mode: 'string' }),
	contractDeadline: timestamp({ mode: 'string' }),
	contractType: varchar({ length: 255 }),
	contractDuration: varchar({ length: 255 }),
	contractNotes: text(),
	contractFileUrl: text(),
	contractFileName: varchar({ length: 255 }),
},
(table) => [
	index("idx_projects_status").on(table.status),
	index("idx_projects_type").on(table.projectType),
	index("idx_projects_team_lead").on(table.teamLead),
	index("idx_projects_client").on(table.clientId),
	index("idx_projects_archived").on(table.isArchived),
]);

export const quantityMaps = mysqlTable("quantityMaps", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" } ),
	description: varchar({ length: 500 }).notNull(),
	category: varchar({ length: 100 }),
	unit: varchar({ length: 50 }).notNull(),
	plannedQuantity: decimal({ precision: 15, scale: 3 }).notNull(),
	executedQuantity: decimal({ precision: 15, scale: 3 }).default('0.000'),
	unitPrice: decimal({ precision: 15, scale: 2 }),
	totalPlanned: decimal({ precision: 15, scale: 2 }),
	totalExecuted: decimal({ precision: 15, scale: 2 }),
	notes: text(),
	importSource: varchar({ length: 100 }),
	importedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const reports = mysqlTable("reports", {
	id: int().autoincrement().notNull(),
	projectId: int().references(() => projects.id, { onDelete: "cascade" } ),
	reportType: mysqlEnum(['progress','budget','timeline','resources','custom']).default('progress').notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	format: mysqlEnum(['pdf','excel','json']).default('pdf').notNull(),
	fileUrl: varchar({ length: 500 }),
	parameters: text(),
	generatedById: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const revisionApprovals = mysqlTable("revision_approvals", {
	id: int().autoincrement().notNull(),
	revisionId: int("revision_id").notNull().references(() => documentRevisions.id, { onDelete: "cascade" } ),
	approverId: int("approver_id").notNull().references(() => users.id, { onDelete: "restrict" } ),
	approvalStatus: mysqlEnum("approval_status", ['pending','approved','rejected','changes_requested']).notNull(),
	comments: text(),
	approvalLevel: int("approval_level").default(1).notNull(),
	requestedAt: timestamp("requested_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
	signatureData: text("signature_data"),
},
(table) => [
	index("idx_revision_approvals_revision").on(table.revisionId),
	index("idx_revision_approvals_approver").on(table.approverId),
	index("idx_revision_approvals_status").on(table.approvalStatus),
]);

export const revisionComments = mysqlTable("revision_comments", {
	id: int().autoincrement().notNull(),
	revisionId: int("revision_id").notNull().references(() => documentRevisions.id, { onDelete: "cascade" } ),
	userId: int("user_id").notNull().references(() => users.id, { onDelete: "restrict" } ),
	comment: text().notNull(),
	parentCommentId: int("parent_comment_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_revision_comments_revision").on(table.revisionId),
	index("idx_revision_comments_user").on(table.userId),
	foreignKey({
			columns: [table.parentCommentId],
			foreignColumns: [table.id],
			name: "fk_revision_comments_parent"
		}).onDelete("cascade"),
]);

export const revisionComparisons = mysqlTable("revision_comparisons", {
	id: int().autoincrement().notNull(),
	documentId: int("document_id").notNull().references(() => projectDocuments.id, { onDelete: "cascade" } ),
	revisionFromId: int("revision_from_id").notNull().references(() => documentRevisions.id, { onDelete: "cascade" } ),
	revisionToId: int("revision_to_id").notNull().references(() => documentRevisions.id, { onDelete: "cascade" } ),
	comparisonType: mysqlEnum("comparison_type", ['visual_diff','metadata_diff','text_diff']).notNull(),
	comparisonData: json("comparison_data"),
	comparisonImageUrl: text("comparison_image_url"),
	generatedAt: timestamp("generated_at", { mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	generatedBy: int("generated_by").references(() => users.id, { onDelete: "set null" } ),
},
(table) => [
	index("unique_comparison").on(table.revisionFromId, table.revisionToId, table.comparisonType),
	index("idx_revision_comparisons_document").on(table.documentId),
]);

export const siteAttendance = mysqlTable("siteAttendance", {
	id: int().autoincrement().notNull(),
	workerId: int().notNull(),
	constructionId: int().notNull(),
	checkIn: timestamp({ mode: 'string' }).notNull(),
	checkOut: timestamp({ mode: 'string' }),
	location: text(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("workerId_idx").on(table.workerId),
	index("constructionId_idx").on(table.constructionId),
	index("checkIn_idx").on(table.checkIn),
]);

export const siteIncidents = mysqlTable("siteIncidents", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	reportedBy: int().notNull(),
	type: mysqlEnum(['safety','quality','delay','damage','theft','other']).notNull(),
	severity: mysqlEnum(['low','medium','high','critical']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	location: varchar({ length: 255 }),
	photos: text(),
	status: mysqlEnum(['open','investigating','resolved','closed']).default('open').notNull(),
	resolvedBy: int(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolution: text(),
	date: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("reportedBy_idx").on(table.reportedBy),
	index("status_idx").on(table.status),
	index("date_idx").on(table.date),
]);

export const siteMaterialRequests = mysqlTable("siteMaterialRequests", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	requestedBy: int().notNull(),
	materialName: varchar({ length: 255 }).notNull(),
	quantity: decimal({ precision: 10, scale: 2 }).notNull(),
	unit: varchar({ length: 50 }).notNull(),
	urgency: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	reason: text(),
	status: mysqlEnum(['pending','approved','rejected','delivered']).default('pending').notNull(),
	approvedBy: int(),
	approvedAt: timestamp({ mode: 'string' }),
	deliveredAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("requestedBy_idx").on(table.requestedBy),
	index("status_idx").on(table.status),
]);

export const siteMaterialUsage = mysqlTable("siteMaterialUsage", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	usedBy: int().notNull(),
	materialName: varchar({ length: 255 }).notNull(),
	quantity: decimal({ precision: 10, scale: 2 }).notNull(),
	unit: varchar({ length: 50 }).notNull(),
	location: varchar({ length: 255 }),
	notes: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("usedBy_idx").on(table.usedBy),
	index("date_idx").on(table.date),
]);

export const siteNonCompliances = mysqlTable("siteNonCompliances", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	reportedBy: int().notNull(),
	reporterType: mysqlEnum(['director','inspector','safety','quality']).notNull(),
	type: mysqlEnum(['quality','safety','environmental','contractual','other']).notNull(),
	severity: mysqlEnum(['minor','major','critical']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	location: varchar({ length: 255 }),
	responsibleParty: varchar({ length: 255 }),
	photos: text(),
	correctiveAction: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	deadline: date({ mode: 'string' }),
	status: mysqlEnum(['open','in_progress','resolved','closed']).default('open').notNull(),
	resolvedBy: int(),
	resolvedAt: timestamp({ mode: 'string' }),
	verifiedBy: int(),
	verifiedAt: timestamp({ mode: 'string' }),
	reportGenerated: tinyint().default(0).notNull(),
	reportUrl: varchar({ length: 500 }),
	date: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("reportedBy_idx").on(table.reportedBy),
	index("status_idx").on(table.status),
	index("date_idx").on(table.date),
]);

export const sitePpe = mysqlTable("sitePPE", {
	id: int().autoincrement().notNull(),
	constructionId: int(),
	type: varchar({ length: 100 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 100 }),
	size: varchar({ length: 50 }),
	quantity: int().notNull(),
	minQuantity: int().default(0).notNull(),
	assignedTo: int(),
	assignedAt: timestamp({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	expiryDate: date({ mode: 'string' }),
	status: mysqlEnum(['available','assigned','expired','damaged']).default('available').notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("assignedTo_idx").on(table.assignedTo),
	index("status_idx").on(table.status),
]);

export const siteProductivityAlerts = mysqlTable("siteProductivityAlerts", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	workerId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	actualQuantity: decimal({ precision: 10, scale: 2 }).notNull(),
	goalQuantity: decimal({ precision: 10, scale: 2 }).notNull(),
	percentageAchieved: decimal({ precision: 5, scale: 2 }).notNull(),
	alertType: mysqlEnum(['above_goal','below_goal','on_target']).notNull(),
	status: mysqlEnum(['unread','read','acknowledged']).default('unread').notNull(),
	notifiedAt: timestamp({ mode: 'string' }),
	acknowledgedBy: int(),
	acknowledgedAt: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("workerId_idx").on(table.workerId),
	index("date_idx").on(table.date),
	index("alertType_idx").on(table.alertType),
	index("status_idx").on(table.status),
]);

export const siteProductivityGoals = mysqlTable("siteProductivityGoals", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	workerId: int().notNull(),
	dailyGoal: decimal({ precision: 10, scale: 2 }).notNull(),
	weeklyGoal: decimal({ precision: 10, scale: 2 }),
	unit: varchar({ length: 50 }).default('unidades').notNull(),
	active: tinyint().default(1).notNull(),
	createdBy: int().notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("workerId_idx").on(table.workerId),
	index("active_idx").on(table.active),
]);

export const siteQuantityMap = mysqlTable("siteQuantityMap", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	category: varchar({ length: 255 }).notNull(),
	item: varchar({ length: 255 }).notNull(),
	description: text(),
	unit: varchar({ length: 50 }).notNull(),
	plannedQuantity: decimal({ precision: 12, scale: 2 }).notNull(),
	currentQuantity: decimal({ precision: 12, scale: 2 }).default('0').notNull(),
	unitPrice: decimal({ precision: 10, scale: 2 }),
	order: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("category_idx").on(table.category),
]);

export const siteQuantityProgress = mysqlTable("siteQuantityProgress", {
	id: int().autoincrement().notNull(),
	quantityMapId: int().notNull(),
	constructionId: int().notNull(),
	updatedBy: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	quantity: decimal({ precision: 12, scale: 2 }).notNull(),
	notes: text(),
	photos: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	approvedBy: int(),
	approvedAt: timestamp({ mode: 'string' }),
	rejectionReason: text(),
},
(table) => [
	index("quantityMapId_idx").on(table.quantityMapId),
	index("constructionId_idx").on(table.constructionId),
	index("date_idx").on(table.date),
]);

export const siteSafetyAudits = mysqlTable("siteSafetyAudits", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	auditedBy: int().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	type: mysqlEnum(['routine','special','incident_followup']).notNull(),
	checklist: text(),
	findings: text(),
	nonCompliances: text(),
	recommendations: text(),
	photos: text(),
	score: int(),
	status: mysqlEnum(['draft','completed','approved']).default('draft').notNull(),
	reportGenerated: tinyint().default(0).notNull(),
	reportUrl: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("auditedBy_idx").on(table.auditedBy),
	index("date_idx").on(table.date),
]);

export const siteSafetyIncidents = mysqlTable("siteSafetyIncidents", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	reportedBy: int().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	type: mysqlEnum(['accident','near_miss','unsafe_condition','unsafe_act']).notNull(),
	severity: mysqlEnum(['minor','moderate','serious','fatal']).notNull(),
	injuredPerson: varchar({ length: 255 }),
	injuryType: varchar({ length: 255 }),
	bodyPart: varchar({ length: 255 }),
	description: text().notNull(),
	location: varchar({ length: 255 }),
	witnesses: text(),
	immediateAction: text(),
	rootCause: text(),
	correctiveAction: text(),
	preventiveAction: text(),
	photos: text(),
	medicalAttention: tinyint().default(0).notNull(),
	workDaysLost: int().default(0).notNull(),
	status: mysqlEnum(['reported','investigating','closed']).default('reported').notNull(),
	investigatedBy: int(),
	investigatedAt: timestamp({ mode: 'string' }),
	reportGenerated: tinyint().default(0).notNull(),
	reportUrl: varchar({ length: 500 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("reportedBy_idx").on(table.reportedBy),
	index("date_idx").on(table.date),
	index("status_idx").on(table.status),
]);

export const siteSubcontractorWork = mysqlTable("siteSubcontractorWork", {
	id: int().autoincrement().notNull(),
	subcontractorId: int().notNull(),
	constructionId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	workDescription: text().notNull(),
	teamSize: int(),
	hoursWorked: decimal({ precision: 5, scale: 2 }),
	progress: decimal({ precision: 5, scale: 2 }),
	photos: text(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	approvedBy: int(),
	approvedAt: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("subcontractorId_idx").on(table.subcontractorId),
	index("constructionId_idx").on(table.constructionId),
	index("date_idx").on(table.date),
]);

export const siteSubcontractors = mysqlTable("siteSubcontractors", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	companyName: varchar({ length: 255 }).notNull(),
	contactPerson: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 255 }),
	nif: varchar({ length: 50 }),
	specialty: varchar({ length: 255 }).notNull(),
	contractValue: decimal({ precision: 12, scale: 2 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	startDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	endDate: date({ mode: 'string' }),
	status: mysqlEnum(['active','inactive','completed']).default('active').notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("status_idx").on(table.status),
]);

export const siteToolAssignments = mysqlTable("siteToolAssignments", {
	id: int().autoincrement().notNull(),
	toolId: int().notNull(),
	workerId: int().notNull(),
	constructionId: int().notNull(),
	assignedAt: timestamp({ mode: 'string' }).notNull(),
	returnedAt: timestamp({ mode: 'string' }),
	assignedBy: int().notNull(),
	returnCondition: mysqlEnum(['excellent','good','fair','poor','damaged']),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("toolId_idx").on(table.toolId),
	index("workerIdIdx").on(table.workerId),
	index("constructionId_idx").on(table.constructionId),
]);

export const siteToolMaintenance = mysqlTable("siteToolMaintenance", {
	id: int().autoincrement().notNull(),
	toolId: int().notNull(),
	type: mysqlEnum(['preventive','corrective','replacement']).notNull(),
	description: text().notNull(),
	cost: decimal({ precision: 10, scale: 2 }),
	requestedBy: int(),
	performedBy: varchar({ length: 255 }),
	status: mysqlEnum(['requested','in_progress','completed','cancelled']).default('requested').notNull(),
	requestedAt: timestamp({ mode: 'string' }).notNull(),
	completedAt: timestamp({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("toolId_idx").on(table.toolId),
	index("status_idx").on(table.status),
]);

export const siteTools = mysqlTable("siteTools", {
	id: int().autoincrement().notNull(),
	constructionId: int(),
	name: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 100 }).notNull(),
	category: varchar({ length: 100 }),
	brand: varchar({ length: 100 }),
	model: varchar({ length: 100 }),
	serialNumber: varchar({ length: 100 }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	purchaseDate: date({ mode: 'string' }),
	purchasePrice: decimal({ precision: 10, scale: 2 }),
	status: mysqlEnum(['available','in_use','maintenance','broken','retired']).default('available').notNull(),
	condition: mysqlEnum(['excellent','good','fair','poor']).default('good').notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	lastMaintenanceDate: date({ mode: 'string' }),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	nextMaintenanceDate: date({ mode: 'string' }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("code_idx").on(table.code),
	index("status_idx").on(table.status),
]);

export const siteVisits = mysqlTable("siteVisits", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	visitedBy: int().notNull(),
	visitorType: mysqlEnum(['director','inspector','client','architect','engineer']).notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	duration: int(),
	purpose: text(),
	observations: text(),
	photos: text(),
	attendees: text(),
	reportGenerated: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("visitedBy_idx").on(table.visitedBy),
	index("date_idx").on(table.date),
]);

export const siteWorkHours = mysqlTable("siteWorkHours", {
	id: int().autoincrement().notNull(),
	workerId: int().notNull(),
	constructionId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	taskDescription: text().notNull(),
	hours: decimal({ precision: 5, scale: 2 }).notNull(),
	status: mysqlEnum(['pending','approved','rejected']).default('pending').notNull(),
	approvedBy: int(),
	approvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("workerId_idx").on(table.workerId),
	index("constructionId_idx").on(table.constructionId),
	index("date_idx").on(table.date),
]);

export const siteWorkPhotos = mysqlTable("siteWorkPhotos", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	uploadedBy: int().notNull(),
	uploaderType: mysqlEnum(['worker','subcontractor','director','inspector','safety']).notNull(),
	photoUrl: varchar({ length: 500 }).notNull(),
	description: text(),
	location: varchar({ length: 255 }),
	tags: text(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	latitude: decimal({ precision: 10, scale: 8 }),
	longitude: decimal({ precision: 11, scale: 8 }),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("uploadedBy_idx").on(table.uploadedBy),
	index("date_idx").on(table.date),
]);

export const siteWorkers = mysqlTable("siteWorkers", {
	id: int().autoincrement().notNull(),
	constructionId: int().notNull(),
	userId: int(),
	name: varchar({ length: 255 }).notNull(),
	role: mysqlEnum(['worker','foreman','technician','engineer']).notNull(),
	phone: varchar({ length: 50 }),
	email: varchar({ length: 255 }),
	company: varchar({ length: 255 }),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("constructionId_idx").on(table.constructionId),
	index("userId_idx").on(table.userId),
]);

export const supplierProjects = mysqlTable("supplierProjects", {
	id: int().autoincrement().notNull(),
	supplierId: int().notNull().references(() => suppliers.id, { onDelete: "cascade" } ),
	projectId: int().notNull().references(() => projects.id, { onDelete: "set null" } ),
	category: varchar({ length: 100 }),
	totalValue: decimal({ precision: 15, scale: 2 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("supplierProject_idx").on(table.supplierId, table.projectId),
]);

export const supplierTransactions = mysqlTable("supplierTransactions", {
	id: int().autoincrement().notNull(),
	supplierId: int().notNull().references(() => suppliers.id, { onDelete: "cascade" } ),
	orderId: int().references(() => orders.id),
	projectId: int().references(() => projects.id),
	transactionType: mysqlEnum(['payment','refund','adjustment']).default('payment').notNull(),
	amount: decimal({ precision: 15, scale: 2 }).notNull(),
	description: text(),
	transactionDate: timestamp({ mode: 'string' }).notNull(),
	paymentMethod: varchar({ length: 100 }),
	referenceNumber: varchar({ length: 100 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const supplierEvaluations = mysqlTable("supplierEvaluations", {
	id: int().autoincrement().notNull(),
	supplierId: int().notNull().references(() => suppliers.id, { onDelete: "cascade" } ),
	projectId: int().references(() => projects.id),
	rating: int().notNull(), // 1-5 scale
	quality: int(), // 1-5 scale
	timeliness: int(), // 1-5 scale
	communication: int(), // 1-5 scale
	comments: text(),
	evaluatedAt: timestamp({ mode: 'string' }).notNull(),
	evaluatedBy: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
});

export const suppliers = mysqlTable("suppliers", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	contactPerson: varchar({ length: 255 }),
	email: varchar({ length: 320 }),
	phone: varchar({ length: 50 }),
	address: text(),
	taxId: varchar({ length: 50 }),
	category: varchar({ length: 100 }),
	rating: int().default(0),
	notes: text(),
	isActive: tinyint().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const taskAssignments = mysqlTable("taskAssignments", {
	id: int().autoincrement().notNull(),
	taskId: int().notNull(),
	userId: int().notNull(),
	assignedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	assignedBy: int().notNull(),
	role: varchar({ length: 100 }),
	estimatedHours: decimal({ precision: 10, scale: 2 }),
},
(table) => [
	index("taskId_idx").on(table.taskId),
	index("userId_idx").on(table.userId),
	index("unique_task_user").on(table.taskId, table.userId),
]);

export const tasks = mysqlTable("tasks", {
	id: int().autoincrement().notNull(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" } ),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	status: mysqlEnum(['backlog','todo','in_progress','review','done']).default('todo').notNull(),
	priority: mysqlEnum(['low','medium','high','urgent']).default('medium').notNull(),
	urgency: mysqlEnum(['low','medium','high']).default('medium').notNull(),
	importance: mysqlEnum(['low','medium','high']).default('medium').notNull(),
	assignedToId: int().references(() => users.id),
	dueDate: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	estimatedHours: decimal({ precision: 8, scale: 2 }),
	actualHours: decimal({ precision: 8, scale: 2 }),
	kanbanOrder: int().default(0),
	createdById: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const timeTracking = mysqlTable("timeTracking", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	taskId: int(),
	projectId: int(),
	description: text(),
	hours: decimal({ precision: 10, scale: 2 }).notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("taskId_idx").on(table.taskId),
	index("projectId_idx").on(table.projectId),
	index("date_idx").on(table.date),
]);

export const timesheets = mysqlTable("timesheets", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	projectId: int().references(() => projects.id, { onDelete: "set null" } ),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	hours: decimal({ precision: 5, scale: 2 }).notNull(),
	description: text(),
	taskType: varchar({ length: 100 }),
	isBillable: tinyint().default(1).notNull(),
	status: mysqlEnum(['draft','submitted','approved']).default('draft').notNull(),
	approvedBy: int().references(() => users.id),
	approvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("projectId_idx").on(table.projectId),
	index("date_idx").on(table.date),
	index("status_idx").on(table.status),
]);

export const userAvailability = mysqlTable("userAvailability", {
	id: int().autoincrement().notNull(),
	userId: int().notNull(),
	// you can use { mode: 'date' }, if you want to have Date as type for this column
	date: date({ mode: 'string' }).notNull(),
	status: mysqlEnum(['available','busy','off','vacation']).default('available').notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
	index("date_idx").on(table.date),
	index("unique_user_date").on(table.userId, table.date),
]);

export const userSkills = mysqlTable("userSkills", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	skillName: varchar({ length: 100 }).notNull(),
	proficiencyLevel: mysqlEnum(['beginner','intermediate','advanced','expert']).default('intermediate').notNull(),
	yearsOfExperience: decimal({ precision: 4, scale: 1 }).default('0').notNull(),
	description: text(),
	endorsements: int().default(0).notNull(),
	isEndorsed: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("unique_user_skill").on(table.userId, table.skillName),
	index("idx_userId").on(table.userId),
	index("idx_proficiencyLevel").on(table.proficiencyLevel),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin','client']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	outlookAccessToken: text(),
	outlookRefreshToken: text(),
	outlookTokenExpiry: timestamp({ mode: 'string' }),
	outlookEmail: varchar({ length: 320 }),
},
(table) => [
	index("users_openId_unique").on(table.openId),
]);
export const userNotificationPreferences = mysqlTable("userNotificationPreferences", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id, { onDelete: "cascade" } ),
	// Tipos de notificacoes
	enabledSupplierEvaluated: tinyint().default(1).notNull(),
	enabledProjectStatusChanged: tinyint().default(1).notNull(),
	enabledProjectCompleted: tinyint().default(1).notNull(),
	enabledDeadlineAlert: tinyint().default(1).notNull(),
	enabledBudgetAlert: tinyint().default(1).notNull(),
	enabledOrderUpdate: tinyint().default(1).notNull(),
	enabledTaskAssigned: tinyint().default(1).notNull(),
	// Frequencia de notificacoes
	frequency: mysqlEnum(['immediate','daily','weekly']).default('immediate').notNull(),
	// Preferencias de canal
	enableEmailNotifications: tinyint().default(1).notNull(),
	enablePushNotifications: tinyint().default(1).notNull(),
	enableInAppNotifications: tinyint().default(1).notNull(),
	// Timestamps
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("userId_idx").on(table.userId),
]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;
export type InsertUserNotificationPreferences = typeof userNotificationPreferences.$inferInsert;

export type SupplierTransaction = typeof supplierTransactions.$inferSelect;
export type InsertSupplierTransaction = typeof supplierTransactions.$inferInsert;

export type SupplierEvaluation = typeof supplierEvaluations.$inferSelect;
export type InsertSupplierEvaluation = typeof supplierEvaluations.$inferInsert;

// ============================================
// MQT (Mapas de Quantidades) Tables
// ============================================

export const mqtImports = mysqlTable("mqtImports", {
	id: int().autoincrement().notNull().primaryKey(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	importedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	importedBy: int().notNull().references(() => users.id, { onDelete: "set null" }),
	source: mysqlEnum(['google_sheets', 'excel']).notNull(),
	sourceUrl: varchar({ length: 500 }),
	fileName: varchar({ length: 255 }),
	status: mysqlEnum(['pending', 'processing', 'completed', 'failed']).default('pending').notNull(),
	errorMessage: text(),
	totalRows: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("projectId_idx").on(table.projectId),
	index("status_idx").on(table.status),
	index("importedBy_idx").on(table.importedBy),
]);

export const mqtLines = mysqlTable("mqtLines", {
	id: int().autoincrement().notNull().primaryKey(),
	importId: int().notNull().references(() => mqtImports.id, { onDelete: "cascade" }),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	itemCode: varchar({ length: 100 }).notNull(),
	itemDescription: varchar({ length: 500 }),
	plannedQuantity: decimal({ precision: 10, scale: 2 }),
	executedQuantity: decimal({ precision: 10, scale: 2 }),
	unit: varchar({ length: 50 }),
	variance: decimal({ precision: 10, scale: 2 }),
	variancePercentage: decimal({ precision: 5, scale: 2 }),
	status: mysqlEnum(['on_track', 'warning', 'critical']).default('on_track').notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("importId_idx").on(table.importId),
	index("projectId_idx").on(table.projectId),
	index("itemCode_idx").on(table.itemCode),
	index("status_idx").on(table.status),
]);

export const mqtAlerts = mysqlTable("mqtAlerts", {
	id: int().autoincrement().notNull().primaryKey(),
	mqtLineId: int().notNull().references(() => mqtLines.id, { onDelete: "cascade" }),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	alertType: mysqlEnum(['variance_high', 'variance_critical', 'missing_data']).notNull(),
	severity: mysqlEnum(['low', 'medium', 'high', 'critical']).notNull(),
	message: text(),
	isResolved: tinyint().default(0).notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolvedBy: int().references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
	index("mqtLineId_idx").on(table.mqtLineId),
	index("projectId_idx").on(table.projectId),
	index("severity_idx").on(table.severity),
	index("isResolved_idx").on(table.isResolved),
]);

export const mqtHistory = mysqlTable("mqtHistory", {
	id: int().autoincrement().notNull().primaryKey(),
	mqtLineId: int().notNull().references(() => mqtLines.id, { onDelete: "cascade" }),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	action: mysqlEnum(['created', 'updated', 'reverted']).notNull(),
	previousValues: json(),
	newValues: json(),
	changedBy: int().notNull().references(() => users.id, { onDelete: "set null" }),
	changedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
	index("mqtLineId_idx").on(table.mqtLineId),
	index("projectId_idx").on(table.projectId),
	index("changedBy_idx").on(table.changedBy),
]);

// Note: orders, orderItems, orderStatusHistory, orderAlerts already exist in schema
// They are used for order tracking and management

// ============================================
// Email Tracking for Orders and Purchases
// ============================================

export const emailTracking = mysqlTable("emailTracking", {
	id: int().autoincrement().notNull().primaryKey(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	orderId: int().references(() => orders.id, { onDelete: "set null" }),
	emailId: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 500 }).notNull(),
	sender: varchar({ length: 255 }).notNull(),
	recipient: varchar({ length: 255 }).notNull(),
	receivedAt: timestamp({ mode: 'string' }).notNull(),
	category: mysqlEnum(['purchase_order', 'invoice', 'delivery_notice', 'payment', 'other']).notNull(),
	content: text(),
	extractedData: json(),
	isProcessed: tinyint().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
	index("projectId_idx").on(table.projectId),
	index("orderId_idx").on(table.orderId),
	index("category_idx").on(table.category),
	index("isProcessed_idx").on(table.isProcessed),
	index("emailId_idx").on(table.emailId),
]);

// ============================================
// Type Exports for Projects
// ============================================

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ============================================
// Type Exports for MQT and Orders
// ============================================

export type MqtImport = typeof mqtImports.$inferSelect;
export type InsertMqtImport = typeof mqtImports.$inferInsert;

export type MqtLine = typeof mqtLines.$inferSelect;
export type InsertMqtLine = typeof mqtLines.$inferInsert;

export type MqtAlert = typeof mqtAlerts.$inferSelect;
export type InsertMqtAlert = typeof mqtAlerts.$inferInsert;

export type MqtHistory = typeof mqtHistory.$inferSelect;
export type InsertMqtHistory = typeof mqtHistory.$inferInsert;

export type EmailTracking = typeof emailTracking.$inferSelect;
export type InsertEmailTracking = typeof emailTracking.$inferInsert;

export const emailHistory = mysqlTable("emailHistory", {
	id: int().autoincrement().notNull().primaryKey(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	eventType: mysqlEnum(['delivery', 'adjudication', 'payment', 'reminder', 'other']).notNull(),
	recipientEmail: varchar({ length: 320 }).notNull(),
	recipientName: varchar({ length: 255 }),
	subject: varchar({ length: 500 }).notNull(),
	body: text(),
	status: mysqlEnum(['sent', 'delivered', 'bounced', 'failed', 'pending']).default('pending').notNull(),
	sentAt: timestamp({ mode: 'string' }).notNull(),
	deliveredAt: timestamp({ mode: 'string' }),
	bouncedAt: timestamp({ mode: 'string' }),
	failedAt: timestamp({ mode: 'string' }),
	errorMessage: text(),
	openedAt: timestamp({ mode: 'string' }),
	clickedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("projectId_idx").on(table.projectId),
	index("status_idx").on(table.status),
	index("eventType_idx").on(table.eventType),
	index("sentAt_idx").on(table.sentAt),
	index("recipientEmail_idx").on(table.recipientEmail),
]);

export type EmailHistory = typeof emailHistory.$inferSelect;
export type InsertEmailHistory = typeof emailHistory.$inferInsert;


// ============================================
// Email Alerts Table
// ============================================

export const emailAlerts = mysqlTable("emailAlerts", {
	id: int().autoincrement().notNull().primaryKey(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	emailHistoryId: int().references(() => emailHistory.id, { onDelete: "cascade" }),
	alertType: mysqlEnum(['delivery_failure', 'high_bounce_rate', 'delayed_delivery', 'suspicious_pattern', 'anomaly_detected']).notNull(),
	severity: mysqlEnum(['low', 'medium', 'high', 'critical']).default('medium').notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	recipientEmail: varchar({ length: 320 }),
	isRead: tinyint().default(0).notNull(),
	isResolved: tinyint().default(0).notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("projectId_idx").on(table.projectId),
	index("alertType_idx").on(table.alertType),
	index("severity_idx").on(table.severity),
	index("isRead_idx").on(table.isRead),
	index("createdAt_idx").on(table.createdAt),
]);

export type EmailAlert = typeof emailAlerts.$inferSelect;
export type InsertEmailAlert = typeof emailAlerts.$inferInsert;

// ============================================
// Email Analytics Table (Métricas Silenciosas)
// ============================================

export const emailAnalytics = mysqlTable("emailAnalytics", {
	id: int().autoincrement().notNull().primaryKey(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	date: date().notNull(),
	totalSent: int().default(0).notNull(),
	totalDelivered: int().default(0).notNull(),
	totalBounced: int().default(0).notNull(),
	totalFailed: int().default(0).notNull(),
	totalOpened: int().default(0).notNull(),
	totalClicked: int().default(0).notNull(),
	deliveryRate: decimal({ precision: 5, scale: 2 }).default('0.00').notNull(),
	bounceRate: decimal({ precision: 5, scale: 2 }).default('0.00').notNull(),
	openRate: decimal({ precision: 5, scale: 2 }).default('0.00').notNull(),
	clickRate: decimal({ precision: 5, scale: 2 }).default('0.00').notNull(),
	avgDeliveryTime: int(), // em minutos
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("projectId_idx").on(table.projectId),
	index("date_idx").on(table.date),
]);

export type EmailAnalytic = typeof emailAnalytics.$inferSelect;
export type InsertEmailAnalytic = typeof emailAnalytics.$inferInsert;

// ============================================
// Email Anomalies Table (Detecção de IA)
// ============================================

export const emailAnomalies = mysqlTable("emailAnomalies", {
	id: int().autoincrement().notNull().primaryKey(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	anomalyType: mysqlEnum(['high_bounce_rate', 'low_delivery_rate', 'unusual_pattern', 'recipient_issue', 'domain_issue', 'content_issue']).notNull(),
	severity: mysqlEnum(['low', 'medium', 'high', 'critical']).default('medium').notNull(),
	description: text().notNull(),
	affectedRecipients: int().default(0).notNull(),
	affectedEmails: int().default(0).notNull(),
	detectionDate: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	startDate: timestamp({ mode: 'string' }),
	endDate: timestamp({ mode: 'string' }),
	isActive: tinyint().default(1).notNull(),
	recommendation: text(),
	confidence: decimal({ precision: 3, scale: 2 }).default('0.00').notNull(), // 0.00 a 1.00
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("projectId_idx").on(table.projectId),
	index("anomalyType_idx").on(table.anomalyType),
	index("severity_idx").on(table.severity),
	index("isActive_idx").on(table.isActive),
	index("detectionDate_idx").on(table.detectionDate),
]);

export type EmailAnomaly = typeof emailAnomalies.$inferSelect;
export type InsertEmailAnomaly = typeof emailAnomalies.$inferInsert;

// ============================================
// Email Trends Table (Tendências para IA)
// ============================================

export const emailTrends = mysqlTable("emailTrends", {
	id: int().autoincrement().notNull().primaryKey(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	recipientDomain: varchar({ length: 255 }),
	eventType: mysqlEnum(['delivery', 'adjudication', 'payment', 'reminder', 'other']),
	trendType: mysqlEnum(['bounce_increase', 'delivery_decrease', 'engagement_increase', 'engagement_decrease', 'seasonal_pattern']).notNull(),
	startDate: date().notNull(),
	endDate: date().notNull(),
	baselineValue: decimal({ precision: 5, scale: 2 }).notNull(),
	currentValue: decimal({ precision: 5, scale: 2 }).notNull(),
	percentageChange: decimal({ precision: 5, scale: 2 }).notNull(),
	dataPoints: int().default(0).notNull(),
	confidence: decimal({ precision: 3, scale: 2 }).default('0.00').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("projectId_idx").on(table.projectId),
	index("trendType_idx").on(table.trendType),
	index("startDate_idx").on(table.startDate),
]);

export type EmailTrend = typeof emailTrends.$inferSelect;
export type InsertEmailTrend = typeof emailTrends.$inferInsert;


	// ============================================
	// Project Phases Extended Tables (Fases Configuráveis)
	// ============================================
export const phaseMilestones = mysqlTable("phaseMilestones", {
	id: int().autoincrement().notNull().primaryKey(),
	phaseId: int().notNull().references(() => projectPhases.id, { onDelete: "cascade" }),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	dueDate: date().notNull(),
	completionDate: date(),
	status: mysqlEnum(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']).default('pending').notNull(),
	priority: mysqlEnum(['low', 'medium', 'high', 'critical']).default('medium').notNull(),
	assignedTo: int().references(() => users.id, { onDelete: "set null" }),
	deliverables: text(), // JSON array
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("phaseId_idx").on(table.phaseId),
	index("projectId_idx").on(table.projectId),
	index("status_idx").on(table.status),
	index("dueDate_idx").on(table.dueDate),
	index("assignedTo_idx").on(table.assignedTo),
]);

export type PhaseMilestone = typeof phaseMilestones.$inferSelect;
export type InsertPhaseMilestone = typeof phaseMilestones.$inferInsert;

// ============================================
// Phase Activity Log Table
// ============================================
export const phaseActivityLog = mysqlTable("phaseActivityLog", {
	id: int().autoincrement().notNull().primaryKey(),
	phaseId: int().notNull().references(() => projectPhases.id, { onDelete: "cascade" }),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	activityType: mysqlEnum(['status_change', 'progress_update', 'budget_update', 'milestone_completed', 'risk_identified', 'note_added', 'assignment_changed']).notNull(),
	description: text().notNull(),
	previousValue: text(),
	newValue: text(),
	changedBy: int().notNull().references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
	index("phaseId_idx").on(table.phaseId),
	index("projectId_idx").on(table.projectId),
	index("activityType_idx").on(table.activityType),
	index("createdAt_idx").on(table.createdAt),
]);

export type PhaseActivityLog = typeof phaseActivityLog.$inferSelect;
export type InsertPhaseActivityLog = typeof phaseActivityLog.$inferInsert;

// ============================================
// Phase Template Table (Para reutilização)
// ============================================
export const phaseTemplates = mysqlTable("phaseTemplates", {
	id: int().autoincrement().notNull().primaryKey(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	industryType: varchar({ length: 255 }), // Ex: "construction", "design", "renovation"
	phases: text().notNull(), // JSON array de fases padrão
	isPublic: tinyint().default(0).notNull(),
	createdBy: int().notNull().references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("industryType_idx").on(table.industryType),
	index("isPublic_idx").on(table.isPublic),
	index("createdBy_idx").on(table.createdBy),
]);

export type PhaseTemplate = typeof phaseTemplates.$inferSelect;
export type InsertPhaseTemplate = typeof phaseTemplates.$inferInsert;


// ============================================
// Scheduled Email Reports Table
// ============================================
export const scheduledEmailReports = mysqlTable("scheduledEmailReports", {
	id: int().autoincrement().notNull().primaryKey(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	frequency: mysqlEnum(['daily', 'weekly', 'monthly', 'custom']).default('weekly').notNull(),
	dayOfWeek: int(), // 0-6 (Sunday-Saturday) para weekly
	dayOfMonth: int(), // 1-31 para monthly
	time: varchar({ length: 5 }), // HH:MM formato
	recipients: text().notNull(), // JSON array de emails
	includeMetrics: tinyint().default(1).notNull(),
	includeTrends: tinyint().default(1).notNull(),
	includeAlerts: tinyint().default(1).notNull(),
	includeInsights: tinyint().default(1).notNull(),
	dateRange: mysqlEnum(['last_7_days', 'last_30_days', 'last_90_days', 'custom']).default('last_30_days').notNull(),
	customStartDate: date(),
	customEndDate: date(),
	isActive: tinyint().default(1).notNull(),
	lastSentAt: timestamp({ mode: 'string' }),
	nextSendAt: timestamp({ mode: 'string' }),
	createdBy: int().notNull().references(() => users.id, { onDelete: "set null" }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("projectId_idx").on(table.projectId),
	index("frequency_idx").on(table.frequency),
	index("isActive_idx").on(table.isActive),
	index("nextSendAt_idx").on(table.nextSendAt),
]);

export type ScheduledEmailReport = typeof scheduledEmailReports.$inferSelect;
export type InsertScheduledEmailReport = typeof scheduledEmailReports.$inferInsert;

// ============================================
// Email Report Logs Table
// ============================================
export const emailReportLogs = mysqlTable("emailReportLogs", {
	id: int().autoincrement().notNull().primaryKey(),
	reportId: int().notNull().references(() => scheduledEmailReports.id, { onDelete: "cascade" }),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	sentAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	recipients: text().notNull(), // JSON array de emails que receberam
	status: mysqlEnum(['success', 'failed', 'partial']).default('success').notNull(),
	errorMessage: text(),
	reportData: text(), // JSON com dados do relatório
	emailsSent: int().default(0).notNull(),
	emailsFailed: int().default(0).notNull(),
}, (table) => [
	index("reportId_idx").on(table.reportId),
	index("projectId_idx").on(table.projectId),
	index("sentAt_idx").on(table.sentAt),
	index("status_idx").on(table.status),
]);

export type EmailReportLog = typeof emailReportLogs.$inferSelect;
export type InsertEmailReportLog = typeof emailReportLogs.$inferInsert;

// ============================================
// CRM Contacts Integration Table
// ============================================
export const crmContacts = mysqlTable("crmContacts", {
	id: int().autoincrement().notNull().primaryKey(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	type: mysqlEnum(['client', 'supplier', 'partner', 'other']).notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	company: varchar({ length: 255 }),
	role: varchar({ length: 100 }),
	address: text(),
	notes: text(),
	tags: text(), // JSON array
	emailCount: int().default(0).notNull(),
	lastEmailDate: date(),
	sentimentScore: decimal({ precision: 3, scale: 2 }).default('0.00'), // -1.00 a 1.00
	communicationStatus: mysqlEnum(['active', 'inactive', 'archived']).default('active').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("projectId_idx").on(table.projectId),
	index("type_idx").on(table.type),
	index("email_idx").on(table.email),
	index("sentimentScore_idx").on(table.sentimentScore),
	index("communicationStatus_idx").on(table.communicationStatus),
]);

export type CRMContact = typeof crmContacts.$inferSelect;
export type InsertCRMContact = typeof crmContacts.$inferInsert;

// ============================================
// Email Sentiment Analysis Table
// ============================================
export const emailSentimentAnalysis = mysqlTable("emailSentimentAnalysis", {
	id: int().autoincrement().notNull().primaryKey(),
	emailId: int().notNull().references(() => emailTracking.id, { onDelete: "cascade" }),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	contactId: int().references(() => crmContacts.id, { onDelete: "set null" }),
	sentiment: mysqlEnum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive']).notNull(),
	sentimentScore: decimal({ precision: 3, scale: 2 }).notNull(), // -1.00 a 1.00
	confidence: decimal({ precision: 3, scale: 2 }).notNull(), // 0.00 a 1.00
	keywords: text(), // JSON array de palavras-chave detectadas
	emotions: text(), // JSON array de emoções detectadas
	urgency: mysqlEnum(['low', 'medium', 'high', 'critical']).default('medium').notNull(),
	requiresAction: tinyint().default(0).notNull(),
	actionTaken: text(),
	analyzedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
	index("emailId_idx").on(table.emailId),
	index("projectId_idx").on(table.projectId),
	index("contactId_idx").on(table.contactId),
	index("sentiment_idx").on(table.sentiment),
	index("urgency_idx").on(table.urgency),
	index("requiresAction_idx").on(table.requiresAction),
]);

export type EmailSentimentAnalysis = typeof emailSentimentAnalysis.$inferSelect;
export type InsertEmailSentimentAnalysis = typeof emailSentimentAnalysis.$inferInsert;

// ============================================
// Sentiment Alerts Table
// ============================================
export const sentimentAlerts = mysqlTable("sentimentAlerts", {
	id: int().autoincrement().notNull().primaryKey(),
	projectId: int().notNull().references(() => projects.id, { onDelete: "cascade" }),
	contactId: int().references(() => crmContacts.id, { onDelete: "cascade" }),
	sentimentAnalysisId: int().notNull().references(() => emailSentimentAnalysis.id, { onDelete: "cascade" }),
	alertType: mysqlEnum(['negative_sentiment', 'urgent_issue', 'sentiment_trend', 'communication_gap']).notNull(),
	severity: mysqlEnum(['low', 'medium', 'high', 'critical']).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	recommendedAction: text(),
	isRead: tinyint().default(0).notNull(),
	isResolved: tinyint().default(0).notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("projectId_idx").on(table.projectId),
	index("contactId_idx").on(table.contactId),
	index("alertType_idx").on(table.alertType),
	index("severity_idx").on(table.severity),
	index("isRead_idx").on(table.isRead),
	index("isResolved_idx").on(table.isResolved),
]);

export type SentimentAlert = typeof sentimentAlerts.$inferSelect;
export type InsertSentimentAlert = typeof sentimentAlerts.$inferInsert;
