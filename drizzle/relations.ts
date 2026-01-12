import { relations } from "drizzle-orm/relations";
import { users, absences, budgets, budgetAlerts, budgetItems, projects, suppliers, clientCompanyProjects, materialCollections, collectionMaterials, libraryMaterials, commentNotifications, materialComments, commentReactions, documentRevisions, documentAccessLog, projectDocuments, emails, expenses, favoriteMaterials, library3DModels, libraryInspiration, materialApprovalHistory, materialPriceHistory, materialSuggestions, notifications, orders, projectInspirationLinks, projectMaterials, projectModels3D, projectMilestones, projectPhases, quantityMaps, reports, revisionApprovals, revisionComments, revisionComparisons, supplierProjects, supplierTransactions, tasks, timesheets, userSkills } from "./schema";

export const absencesRelations = relations(absences, ({one}) => ({
	user_userId: one(users, {
		fields: [absences.userId],
		references: [users.id],
		relationName: "absences_userId_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [absences.approvedBy],
		references: [users.id],
		relationName: "absences_approvedBy_users_id"
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	absences_userId: many(absences, {
		relationName: "absences_userId_users_id"
	}),
	absences_approvedBy: many(absences, {
		relationName: "absences_approvedBy_users_id"
	}),
	budgetAlerts: many(budgetAlerts),
	commentNotifications: many(commentNotifications),
	commentReactions: many(commentReactions),
	documentAccessLogs: many(documentAccessLog),
	documentRevisions_uploadedBy: many(documentRevisions, {
		relationName: "documentRevisions_uploadedBy_users_id"
	}),
	documentRevisions_approvedBy: many(documentRevisions, {
		relationName: "documentRevisions_approvedBy_users_id"
	}),
	expenses_createdById: many(expenses, {
		relationName: "expenses_createdById_users_id"
	}),
	expenses_approvedById: many(expenses, {
		relationName: "expenses_approvedById_users_id"
	}),
	favoriteMaterials: many(favoriteMaterials),
	library3DModels: many(library3DModels),
	libraryInspirations: many(libraryInspiration),
	libraryMaterials: many(libraryMaterials),
	materialApprovalHistories: many(materialApprovalHistory),
	materialCollections: many(materialCollections),
	materialComments: many(materialComments),
	materialSuggestions: many(materialSuggestions),
	notifications: many(notifications),
	orders: many(orders),
	projectInspirationLinks: many(projectInspirationLinks),
	projectMaterials: many(projectMaterials),
	projectModels3DS: many(projectModels3D),
	projectDocuments: many(projectDocuments),
	projects_responsibleId: many(projects, {
		relationName: "projects_responsibleId_users_id"
	}),
	projects_createdById: many(projects, {
		relationName: "projects_createdById_users_id"
	}),
	reports: many(reports),
	revisionApprovals: many(revisionApprovals),
	revisionComments: many(revisionComments),
	revisionComparisons: many(revisionComparisons),
	tasks_assignedToId: many(tasks, {
		relationName: "tasks_assignedToId_users_id"
	}),
	tasks_createdById: many(tasks, {
		relationName: "tasks_createdById_users_id"
	}),
	timesheets_userId: many(timesheets, {
		relationName: "timesheets_userId_users_id"
	}),
	timesheets_approvedBy: many(timesheets, {
		relationName: "timesheets_approvedBy_users_id"
	}),
	userSkills: many(userSkills),
}));

export const budgetAlertsRelations = relations(budgetAlerts, ({one}) => ({
	budget: one(budgets, {
		fields: [budgetAlerts.budgetId],
		references: [budgets.id]
	}),
	user: one(users, {
		fields: [budgetAlerts.readById],
		references: [users.id]
	}),
}));

export const budgetsRelations = relations(budgets, ({one, many}) => ({
	budgetAlerts: many(budgetAlerts),
	budgetItems: many(budgetItems),
	project: one(projects, {
		fields: [budgets.projectId],
		references: [projects.id]
	}),
	expenses: many(expenses),
}));

export const budgetItemsRelations = relations(budgetItems, ({one}) => ({
	budget: one(budgets, {
		fields: [budgetItems.budgetId],
		references: [budgets.id]
	}),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	budgets: many(budgets),
	clientCompanyProjects: many(clientCompanyProjects),
	emails: many(emails),
	expenses: many(expenses),
	libraryInspirations: many(libraryInspiration),
	materialSuggestions: many(materialSuggestions),
	notifications: many(notifications),
	orders: many(orders),
	projectInspirationLinks: many(projectInspirationLinks),
	projectMaterials: many(projectMaterials),
	projectModels3DS: many(projectModels3D),
	projectDocuments: many(projectDocuments),
	projectMilestones: many(projectMilestones),
	projectPhases: many(projectPhases),
	user_responsibleId: one(users, {
		fields: [projects.responsibleId],
		references: [users.id],
		relationName: "projects_responsibleId_users_id"
	}),
	user_createdById: one(users, {
		fields: [projects.createdById],
		references: [users.id],
		relationName: "projects_createdById_users_id"
	}),
	quantityMaps: many(quantityMaps),
	reports: many(reports),
	supplierProjects: many(supplierProjects),
	supplierTransactions: many(supplierTransactions),
	tasks: many(tasks),
	timesheets: many(timesheets),
}));

export const clientCompanyProjectsRelations = relations(clientCompanyProjects, ({one}) => ({
	supplier: one(suppliers, {
		fields: [clientCompanyProjects.clientId],
		references: [suppliers.id]
	}),
	project: one(projects, {
		fields: [clientCompanyProjects.projectId],
		references: [projects.id]
	}),
}));

export const suppliersRelations = relations(suppliers, ({many}) => ({
	clientCompanyProjects: many(clientCompanyProjects),
	orders: many(orders),
	supplierProjects: many(supplierProjects),
	supplierTransactions: many(supplierTransactions),
}));

export const collectionMaterialsRelations = relations(collectionMaterials, ({one}) => ({
	materialCollection: one(materialCollections, {
		fields: [collectionMaterials.collectionId],
		references: [materialCollections.id]
	}),
	libraryMaterial: one(libraryMaterials, {
		fields: [collectionMaterials.materialId],
		references: [libraryMaterials.id]
	}),
}));

export const materialCollectionsRelations = relations(materialCollections, ({one, many}) => ({
	collectionMaterials: many(collectionMaterials),
	user: one(users, {
		fields: [materialCollections.userId],
		references: [users.id]
	}),
}));

export const libraryMaterialsRelations = relations(libraryMaterials, ({one, many}) => ({
	collectionMaterials: many(collectionMaterials),
	commentNotifications: many(commentNotifications),
	favoriteMaterials: many(favoriteMaterials),
	user: one(users, {
		fields: [libraryMaterials.createdById],
		references: [users.id]
	}),
	materialApprovalHistories: many(materialApprovalHistory),
	materialComments: many(materialComments),
	materialPriceHistories: many(materialPriceHistory),
	materialSuggestions: many(materialSuggestions),
	projectMaterials: many(projectMaterials),
}));

export const commentNotificationsRelations = relations(commentNotifications, ({one}) => ({
	user: one(users, {
		fields: [commentNotifications.userId],
		references: [users.id]
	}),
	libraryMaterial: one(libraryMaterials, {
		fields: [commentNotifications.materialId],
		references: [libraryMaterials.id]
	}),
	materialComment: one(materialComments, {
		fields: [commentNotifications.commentId],
		references: [materialComments.id]
	}),
}));

export const materialCommentsRelations = relations(materialComments, ({one, many}) => ({
	commentNotifications: many(commentNotifications),
	commentReactions: many(commentReactions),
	libraryMaterial: one(libraryMaterials, {
		fields: [materialComments.materialId],
		references: [libraryMaterials.id]
	}),
	user: one(users, {
		fields: [materialComments.userId],
		references: [users.id]
	}),
}));

export const commentReactionsRelations = relations(commentReactions, ({one}) => ({
	materialComment: one(materialComments, {
		fields: [commentReactions.commentId],
		references: [materialComments.id]
	}),
	user: one(users, {
		fields: [commentReactions.userId],
		references: [users.id]
	}),
}));

export const documentAccessLogRelations = relations(documentAccessLog, ({one}) => ({
	documentRevision: one(documentRevisions, {
		fields: [documentAccessLog.revisionId],
		references: [documentRevisions.id]
	}),
	user: one(users, {
		fields: [documentAccessLog.userId],
		references: [users.id]
	}),
}));

export const documentRevisionsRelations = relations(documentRevisions, ({one, many}) => ({
	documentAccessLogs: many(documentAccessLog),
	projectDocument: one(projectDocuments, {
		fields: [documentRevisions.documentId],
		references: [projectDocuments.id],
		relationName: "documentRevisions_documentId_projectDocuments_id"
	}),
	user_uploadedBy: one(users, {
		fields: [documentRevisions.uploadedBy],
		references: [users.id],
		relationName: "documentRevisions_uploadedBy_users_id"
	}),
	user_approvedBy: one(users, {
		fields: [documentRevisions.approvedBy],
		references: [users.id],
		relationName: "documentRevisions_approvedBy_users_id"
	}),
	projectDocuments: many(projectDocuments, {
		relationName: "projectDocuments_currentRevisionId_documentRevisions_id"
	}),
	revisionApprovals: many(revisionApprovals),
	revisionComments: many(revisionComments),
	revisionComparisons_revisionFromId: many(revisionComparisons, {
		relationName: "revisionComparisons_revisionFromId_documentRevisions_id"
	}),
	revisionComparisons_revisionToId: many(revisionComparisons, {
		relationName: "revisionComparisons_revisionToId_documentRevisions_id"
	}),
}));

export const projectDocumentsRelations = relations(projectDocuments, ({one, many}) => ({
	documentRevisions: many(documentRevisions, {
		relationName: "documentRevisions_documentId_projectDocuments_id"
	}),
	project: one(projects, {
		fields: [projectDocuments.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [projectDocuments.createdBy],
		references: [users.id]
	}),
	documentRevision: one(documentRevisions, {
		fields: [projectDocuments.currentRevisionId],
		references: [documentRevisions.id],
		relationName: "projectDocuments_currentRevisionId_documentRevisions_id"
	}),
	revisionComparisons: many(revisionComparisons),
}));

export const emailsRelations = relations(emails, ({one}) => ({
	project: one(projects, {
		fields: [emails.projectId],
		references: [projects.id]
	}),
}));

export const expensesRelations = relations(expenses, ({one}) => ({
	project: one(projects, {
		fields: [expenses.projectId],
		references: [projects.id]
	}),
	budget: one(budgets, {
		fields: [expenses.budgetId],
		references: [budgets.id]
	}),
	user_createdById: one(users, {
		fields: [expenses.createdById],
		references: [users.id],
		relationName: "expenses_createdById_users_id"
	}),
	user_approvedById: one(users, {
		fields: [expenses.approvedById],
		references: [users.id],
		relationName: "expenses_approvedById_users_id"
	}),
}));

export const favoriteMaterialsRelations = relations(favoriteMaterials, ({one}) => ({
	user: one(users, {
		fields: [favoriteMaterials.userId],
		references: [users.id]
	}),
	libraryMaterial: one(libraryMaterials, {
		fields: [favoriteMaterials.materialId],
		references: [libraryMaterials.id]
	}),
}));

export const library3DModelsRelations = relations(library3DModels, ({one, many}) => ({
	user: one(users, {
		fields: [library3DModels.createdById],
		references: [users.id]
	}),
	projectModels3DS: many(projectModels3D),
}));

export const libraryInspirationRelations = relations(libraryInspiration, ({one, many}) => ({
	project: one(projects, {
		fields: [libraryInspiration.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [libraryInspiration.createdById],
		references: [users.id]
	}),
	projectInspirationLinks: many(projectInspirationLinks),
}));

export const materialApprovalHistoryRelations = relations(materialApprovalHistory, ({one}) => ({
	libraryMaterial: one(libraryMaterials, {
		fields: [materialApprovalHistory.materialId],
		references: [libraryMaterials.id]
	}),
	user: one(users, {
		fields: [materialApprovalHistory.userId],
		references: [users.id]
	}),
}));

export const materialPriceHistoryRelations = relations(materialPriceHistory, ({one}) => ({
	libraryMaterial: one(libraryMaterials, {
		fields: [materialPriceHistory.materialId],
		references: [libraryMaterials.id]
	}),
}));

export const materialSuggestionsRelations = relations(materialSuggestions, ({one}) => ({
	project: one(projects, {
		fields: [materialSuggestions.projectId],
		references: [projects.id]
	}),
	libraryMaterial: one(libraryMaterials, {
		fields: [materialSuggestions.suggestedMaterialId],
		references: [libraryMaterials.id]
	}),
	user: one(users, {
		fields: [materialSuggestions.respondedById],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [notifications.projectId],
		references: [projects.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	project: one(projects, {
		fields: [orders.projectId],
		references: [projects.id]
	}),
	supplier: one(suppliers, {
		fields: [orders.supplierId],
		references: [suppliers.id]
	}),
	user: one(users, {
		fields: [orders.createdById],
		references: [users.id]
	}),
	supplierTransactions: many(supplierTransactions),
}));

export const projectInspirationLinksRelations = relations(projectInspirationLinks, ({one}) => ({
	project: one(projects, {
		fields: [projectInspirationLinks.projectId],
		references: [projects.id]
	}),
	libraryInspiration: one(libraryInspiration, {
		fields: [projectInspirationLinks.inspirationId],
		references: [libraryInspiration.id]
	}),
	user: one(users, {
		fields: [projectInspirationLinks.addedById],
		references: [users.id]
	}),
}));

export const projectMaterialsRelations = relations(projectMaterials, ({one}) => ({
	project: one(projects, {
		fields: [projectMaterials.projectId],
		references: [projects.id]
	}),
	libraryMaterial: one(libraryMaterials, {
		fields: [projectMaterials.materialId],
		references: [libraryMaterials.id]
	}),
	user: one(users, {
		fields: [projectMaterials.addedById],
		references: [users.id]
	}),
}));

export const projectModels3DRelations = relations(projectModels3D, ({one}) => ({
	project: one(projects, {
		fields: [projectModels3D.projectId],
		references: [projects.id]
	}),
	library3DModel: one(library3DModels, {
		fields: [projectModels3D.modelId],
		references: [library3DModels.id]
	}),
	user: one(users, {
		fields: [projectModels3D.addedById],
		references: [users.id]
	}),
}));

export const projectMilestonesRelations = relations(projectMilestones, ({one}) => ({
	project: one(projects, {
		fields: [projectMilestones.projectId],
		references: [projects.id]
	}),
	projectPhase: one(projectPhases, {
		fields: [projectMilestones.phaseId],
		references: [projectPhases.id]
	}),
}));

export const projectPhasesRelations = relations(projectPhases, ({one, many}) => ({
	projectMilestones: many(projectMilestones),
	project: one(projects, {
		fields: [projectPhases.projectId],
		references: [projects.id]
	}),
}));

export const quantityMapsRelations = relations(quantityMaps, ({one}) => ({
	project: one(projects, {
		fields: [quantityMaps.projectId],
		references: [projects.id]
	}),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	project: one(projects, {
		fields: [reports.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [reports.generatedById],
		references: [users.id]
	}),
}));

export const revisionApprovalsRelations = relations(revisionApprovals, ({one}) => ({
	documentRevision: one(documentRevisions, {
		fields: [revisionApprovals.revisionId],
		references: [documentRevisions.id]
	}),
	user: one(users, {
		fields: [revisionApprovals.approverId],
		references: [users.id]
	}),
}));

export const revisionCommentsRelations = relations(revisionComments, ({one, many}) => ({
	documentRevision: one(documentRevisions, {
		fields: [revisionComments.revisionId],
		references: [documentRevisions.id]
	}),
	user: one(users, {
		fields: [revisionComments.userId],
		references: [users.id]
	}),
	revisionComment: one(revisionComments, {
		fields: [revisionComments.parentCommentId],
		references: [revisionComments.id],
		relationName: "revisionComments_parentCommentId_revisionComments_id"
	}),
	revisionComments: many(revisionComments, {
		relationName: "revisionComments_parentCommentId_revisionComments_id"
	}),
}));

export const revisionComparisonsRelations = relations(revisionComparisons, ({one}) => ({
	projectDocument: one(projectDocuments, {
		fields: [revisionComparisons.documentId],
		references: [projectDocuments.id]
	}),
	documentRevision_revisionFromId: one(documentRevisions, {
		fields: [revisionComparisons.revisionFromId],
		references: [documentRevisions.id],
		relationName: "revisionComparisons_revisionFromId_documentRevisions_id"
	}),
	documentRevision_revisionToId: one(documentRevisions, {
		fields: [revisionComparisons.revisionToId],
		references: [documentRevisions.id],
		relationName: "revisionComparisons_revisionToId_documentRevisions_id"
	}),
	user: one(users, {
		fields: [revisionComparisons.generatedBy],
		references: [users.id]
	}),
}));

export const supplierProjectsRelations = relations(supplierProjects, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplierProjects.supplierId],
		references: [suppliers.id]
	}),
	project: one(projects, {
		fields: [supplierProjects.projectId],
		references: [projects.id]
	}),
}));

export const supplierTransactionsRelations = relations(supplierTransactions, ({one}) => ({
	supplier: one(suppliers, {
		fields: [supplierTransactions.supplierId],
		references: [suppliers.id]
	}),
	order: one(orders, {
		fields: [supplierTransactions.orderId],
		references: [orders.id]
	}),
	project: one(projects, {
		fields: [supplierTransactions.projectId],
		references: [projects.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one}) => ({
	project: one(projects, {
		fields: [tasks.projectId],
		references: [projects.id]
	}),
	user_assignedToId: one(users, {
		fields: [tasks.assignedToId],
		references: [users.id],
		relationName: "tasks_assignedToId_users_id"
	}),
	user_createdById: one(users, {
		fields: [tasks.createdById],
		references: [users.id],
		relationName: "tasks_createdById_users_id"
	}),
}));

export const timesheetsRelations = relations(timesheets, ({one}) => ({
	user_userId: one(users, {
		fields: [timesheets.userId],
		references: [users.id],
		relationName: "timesheets_userId_users_id"
	}),
	project: one(projects, {
		fields: [timesheets.projectId],
		references: [projects.id]
	}),
	user_approvedBy: one(users, {
		fields: [timesheets.approvedBy],
		references: [users.id],
		relationName: "timesheets_approvedBy_users_id"
	}),
}));

export const userSkillsRelations = relations(userSkills, ({one}) => ({
	user: one(users, {
		fields: [userSkills.userId],
		references: [users.id]
	}),
}));