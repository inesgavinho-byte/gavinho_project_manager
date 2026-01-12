CREATE TABLE `absences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('vacation','sick','personal','other') NOT NULL DEFAULT 'vacation',
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`days` int NOT NULL,
	`reason` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `absences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activityFeed` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actorId` int NOT NULL,
	`activityType` enum('scenario_created','scenario_updated','scenario_shared','scenario_commented','scenario_favorited','scenario_deleted') NOT NULL,
	`scenarioId` int,
	`projectId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activityFeed_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aiSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`type` enum('risk_alert','resource_optimization','next_action','budget_warning','deadline_alert','efficiency_tip') NOT NULL,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`reasoning` text,
	`suggestedAction` text,
	`impact` enum('low','medium','high') DEFAULT 'medium',
	`confidence` decimal(3,2),
	`status` enum('pending','accepted','rejected','completed') NOT NULL DEFAULT 'pending',
	`acceptedById` int,
	`acceptedAt` timestamp,
	`completedAt` timestamp,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiSuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `archvizAnnotations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`renderId` int NOT NULL,
	`annotationsData` json NOT NULL,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `archvizAnnotations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `archvizComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`renderId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `archvizComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `archvizCompartments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`parentId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `archvizCompartments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `archvizRenderComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`renderId` int NOT NULL,
	`userId` int NOT NULL,
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `archvizRenderComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `archvizRenderHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`renderId` int NOT NULL,
	`userId` int NOT NULL,
	`action` enum('created','status_changed','approved','rejected','commented') NOT NULL,
	`oldValue` text,
	`newValue` text,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `archvizRenderHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `archvizRenders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`compartmentId` int,
	`version` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`fileUrl` text NOT NULL,
	`fileKey` text NOT NULL,
	`thumbnailUrl` text,
	`mimeType` varchar(100),
	`fileSize` int,
	`isFavorite` boolean NOT NULL DEFAULT false,
	`status` enum('pending','approved_dc','approved_client') NOT NULL DEFAULT 'pending',
	`approvalStatus` enum('pending','in_review','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedById` int,
	`approvedAt` timestamp,
	`rejectionReason` text,
	`uploadedById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `archvizRenders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `archvizStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`renderId` int NOT NULL,
	`oldStatus` enum('pending','approved_dc','approved_client'),
	`newStatus` enum('pending','approved_dc','approved_client') NOT NULL,
	`changedById` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `archvizStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(255) NOT NULL,
	`description` text,
	`budgetedAmount` decimal(15,2) NOT NULL,
	`actualAmount` decimal(15,2) NOT NULL DEFAULT '0.00',
	`variance` decimal(15,2) NOT NULL DEFAULT '0.00',
	`variancePercent` decimal(10,2) DEFAULT '0.00',
	`status` enum('draft','approved','active','closed') NOT NULL DEFAULT 'draft',
	`startDate` timestamp,
	`endDate` timestamp,
	`createdById` int NOT NULL,
	`approvedById` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checklistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`checklistId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`isCompleted` int NOT NULL DEFAULT 0,
	`completedBy` int,
	`completedAt` timestamp,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checklistItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientDeliveryApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`clientId` int NOT NULL,
	`status` enum('pending','approved','rejected','revision_requested') NOT NULL DEFAULT 'pending',
	`feedback` text,
	`rejectionReason` text,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientDeliveryApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`fileUrl` varchar(512) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`fileSize` int,
	`version` int NOT NULL DEFAULT 1,
	`uploadedBy` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`senderId` int NOT NULL,
	`message` text NOT NULL,
	`attachmentUrl` varchar(512),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clientMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`projectId` int NOT NULL,
	`accessLevel` enum('view','comment','approve') NOT NULL DEFAULT 'view',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commentMentions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`mentionedUserId` int NOT NULL,
	`mentionedBy` int NOT NULL,
	`scenarioId` int NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commentMentions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `constructions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`projectId` int,
	`client` varchar(255),
	`location` varchar(255),
	`startDate` date,
	`endDate` date,
	`status` enum('not_started','in_progress','on_hold','completed','cancelled') NOT NULL DEFAULT 'not_started',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`budget` decimal(12,2),
	`actualCost` decimal(12,2) DEFAULT '0.00',
	`progress` int DEFAULT 0,
	`description` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	CONSTRAINT `constructions_id` PRIMARY KEY(`id`),
	CONSTRAINT `constructions_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `deliveryApprovals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`status` enum('approved','rejected','revision_requested') NOT NULL,
	`comments` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliveryApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveryAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`performedBy` int NOT NULL,
	`oldValue` text,
	`newValue` text,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliveryAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveryChecklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`deliveryType` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveryChecklists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveryNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`type` enum('deadline_reminder','approval_request','approval_received','rejection_notice','revision_requested','follow_up') NOT NULL,
	`recipientId` int NOT NULL,
	`message` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliveryNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveryReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`reminderType` enum('1_day_before','3_days_before','7_days_before','1_day_after','3_days_after','7_days_after') NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`sentAt` timestamp,
	`status` enum('pending','sent','skipped') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliveryReminders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveryReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`phaseId` int,
	`reportDate` date NOT NULL,
	`totalDeliveries` int NOT NULL DEFAULT 0,
	`onTimeDeliveries` int NOT NULL DEFAULT 0,
	`lateDeliveries` int NOT NULL DEFAULT 0,
	`complianceRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`totalApprovals` int NOT NULL DEFAULT 0,
	`approvedDeliveries` int NOT NULL DEFAULT 0,
	`rejectedDeliveries` int NOT NULL DEFAULT 0,
	`revisionRequested` int NOT NULL DEFAULT 0,
	`acceptanceRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`avgApprovalTime` int,
	`avgTimeToRevision` int,
	`avgDaysLate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`maxDaysLate` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveryReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveryVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`version` int NOT NULL,
	`versionNotes` text,
	`fileUrl` text,
	`fileKey` varchar(500),
	`fileSize` int,
	`uploadedById` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliveryVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`outlookId` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`subject` text NOT NULL,
	`fromEmail` varchar(320) NOT NULL,
	`fromName` varchar(255),
	`toEmails` text,
	`ccEmails` text,
	`bodyPreview` text,
	`bodyContent` text,
	`receivedDateTime` timestamp NOT NULL,
	`hasAttachments` boolean NOT NULL DEFAULT false,
	`category` enum('order','adjudication','purchase','communication','other') NOT NULL DEFAULT 'other',
	`classificationConfidence` decimal(3,2),
	`classificationReasoning` text,
	`suggestedActions` text,
	`isProcessed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emails_id` PRIMARY KEY(`id`),
	CONSTRAINT `emails_outlookId_unique` UNIQUE(`outlookId`)
);
--> statement-breakpoint
CREATE TABLE `holidays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`date` date NOT NULL,
	`year` int NOT NULL,
	`type` enum('national','regional','company') NOT NULL DEFAULT 'national',
	`isRecurring` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `holidays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mqtCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`namePt` varchar(255) NOT NULL,
	`nameEn` varchar(255),
	`order` int NOT NULL,
	`subtotal` decimal(12,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mqtCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mqtImportHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`userId` int NOT NULL,
	`source` enum('excel','sheets') NOT NULL,
	`fileName` varchar(255),
	`sheetsUrl` text,
	`itemsImported` int NOT NULL DEFAULT 0,
	`itemsSuccess` int NOT NULL DEFAULT 0,
	`itemsError` int NOT NULL DEFAULT 0,
	`errorLog` text,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mqtImportHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mqtImportItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`importId` int NOT NULL,
	`mqtItemId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mqtImportItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mqtItemHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`userId` int NOT NULL,
	`oldValue` decimal(10,2),
	`newValue` decimal(10,2) NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mqtItemHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mqtItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`categoryId` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`typePt` varchar(255),
	`typeEn` varchar(255),
	`subtypePt` varchar(255),
	`subtypeEn` varchar(255),
	`zonePt` varchar(255),
	`zoneEn` varchar(255),
	`descriptionPt` text NOT NULL,
	`descriptionEn` text,
	`unit` varchar(20) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`quantityExecuted` decimal(10,2) DEFAULT '0.00',
	`unitPrice` decimal(12,2),
	`totalPrice` decimal(12,2),
	`supplierId` int,
	`status` enum('pending','ordered','in_progress','completed') NOT NULL DEFAULT 'pending',
	`notes` text,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mqtItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mqtValidationRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`ruleType` enum('price_min','price_max','code_pattern','quantity_min','quantity_max','duplicate_check') NOT NULL,
	`field` varchar(100) NOT NULL,
	`condition` text,
	`severity` enum('error','warning','info') NOT NULL DEFAULT 'warning',
	`message` text,
	`enabled` boolean NOT NULL DEFAULT true,
	`category` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mqtValidationRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`aiAlerts` int NOT NULL DEFAULT 1,
	`deadlineWarnings` int NOT NULL DEFAULT 1,
	`budgetAlerts` int NOT NULL DEFAULT 1,
	`projectDelays` int NOT NULL DEFAULT 1,
	`taskOverdue` int NOT NULL DEFAULT 1,
	`orderPending` int NOT NULL DEFAULT 1,
	`systemNotifications` int NOT NULL DEFAULT 1,
	`deadlineWarningDays` int NOT NULL DEFAULT 7,
	`budgetThreshold` int NOT NULL DEFAULT 90,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('ai_alert','deadline_warning','budget_exceeded','project_delayed','task_overdue','order_pending','system') NOT NULL,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(500),
	`projectId` int,
	`taskId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`supplierId` int,
	`orderNumber` varchar(100),
	`description` text NOT NULL,
	`orderType` enum('material','service','equipment','other') NOT NULL DEFAULT 'material',
	`status` enum('pending','ordered','in_transit','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`quantity` decimal(15,3),
	`unit` varchar(50),
	`unitPrice` decimal(15,2),
	`totalAmount` decimal(15,2) NOT NULL,
	`orderDate` timestamp,
	`expectedDeliveryDate` timestamp,
	`actualDeliveryDate` timestamp,
	`notes` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectDeliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`phaseId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`type` enum('document','drawing','render','model','report','specification','other') NOT NULL DEFAULT 'document',
	`dueDate` timestamp NOT NULL,
	`status` enum('pending','in_review','approved','rejected','delivered') NOT NULL DEFAULT 'pending',
	`fileUrl` text,
	`fileKey` varchar(500),
	`fileSize` int,
	`uploadedAt` timestamp,
	`uploadedById` int,
	`assignedToId` int,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`notificationSent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectDeliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`phaseId` int,
	`documentType` enum('design_review','project_management') NOT NULL DEFAULT 'design_review',
	`name` varchar(255) NOT NULL,
	`description` text,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileType` varchar(100),
	`fileSize` int,
	`category` enum('plan','drawing','specification','render','approval','photo','report','contract','invoice','receipt','meeting_minutes','correspondence','legal_document','other') NOT NULL DEFAULT 'other',
	`uploadedById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectGallery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`phaseId` int,
	`title` varchar(255),
	`description` text,
	`imageUrl` text NOT NULL,
	`imageKey` varchar(500) NOT NULL,
	`thumbnailUrl` text,
	`category` varchar(100),
	`takenAt` timestamp,
	`uploadedById` int NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectGallery_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`phaseId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`dueDate` timestamp NOT NULL,
	`completedDate` timestamp,
	`status` enum('pending','completed','overdue') NOT NULL DEFAULT 'pending',
	`isKeyMilestone` int NOT NULL DEFAULT 0,
	`dependencies` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectMilestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectPhases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`order` int NOT NULL,
	`startDate` timestamp,
	`endDate` timestamp,
	`status` enum('not_started','in_progress','completed','on_hold') NOT NULL DEFAULT 'not_started',
	`progress` int NOT NULL DEFAULT 0,
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectPhases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectPredictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`predictionType` enum('delay','cost','risk') NOT NULL,
	`predictedDelayDays` int,
	`delayProbability` int,
	`predictedCompletionDate` timestamp,
	`predictedFinalCost` decimal(15,2),
	`costOverrunProbability` int,
	`estimatedCostVariance` decimal(15,2),
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`riskFactors` text,
	`confidence` int,
	`recommendations` text,
	`suggestedActions` text,
	`basedOnHistoricalProjects` int,
	`analysisDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectPredictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectTeam` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(100) NOT NULL,
	`responsibilities` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`leftAt` timestamp,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectTeam_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('planning','in_progress','on_hold','completed','cancelled') NOT NULL DEFAULT 'planning',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`startDate` timestamp,
	`endDate` timestamp,
	`progress` int NOT NULL DEFAULT 0,
	`budget` decimal(15,2),
	`actualCost` decimal(15,2) DEFAULT '0.00',
	`clientName` varchar(255),
	`location` text,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`deletedAt` timestamp,
	`contractValue` decimal(15,2),
	`contractSignedDate` timestamp,
	`contractDeadline` timestamp,
	`contractType` varchar(255),
	`contractDuration` varchar(100),
	`contractNotes` text,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quantityMaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100),
	`unit` varchar(50) NOT NULL,
	`plannedQuantity` decimal(15,3) NOT NULL,
	`executedQuantity` decimal(15,3) NOT NULL DEFAULT '0.000',
	`unitPrice` decimal(15,2),
	`totalPlanned` decimal(15,2),
	`totalExecuted` decimal(15,2),
	`importSource` enum('manual','excel','google_sheets') NOT NULL DEFAULT 'manual',
	`importedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quantityMaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarioComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`userId` int NOT NULL,
	`comment` text NOT NULL,
	`parentCommentId` int,
	`replyCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scenarioComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scenarioShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scenarioId` int NOT NULL,
	`sharedBy` int NOT NULL,
	`sharedWith` int NOT NULL,
	`permission` enum('view','edit','admin') NOT NULL DEFAULT 'view',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenarioShares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteAttendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerId` int NOT NULL,
	`constructionId` int NOT NULL,
	`checkIn` timestamp NOT NULL,
	`checkOut` timestamp,
	`location` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siteAttendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteMaterialRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`materialName` varchar(255) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`urgency` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`reason` text,
	`status` enum('pending','approved','rejected','delivered') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteMaterialRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteMaterialUsage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`usedBy` int NOT NULL,
	`materialName` varchar(255) NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`location` varchar(255),
	`notes` text,
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siteMaterialUsage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteToolAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toolId` int NOT NULL,
	`workerId` int NOT NULL,
	`constructionId` int NOT NULL,
	`assignedAt` timestamp NOT NULL,
	`returnedAt` timestamp,
	`assignedBy` int NOT NULL,
	`returnCondition` enum('excellent','good','fair','poor','damaged'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siteToolAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteToolMaintenance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`toolId` int NOT NULL,
	`type` enum('preventive','corrective','replacement') NOT NULL,
	`description` text NOT NULL,
	`cost` decimal(10,2),
	`requestedBy` int,
	`performedBy` varchar(255),
	`status` enum('requested','in_progress','completed','cancelled') NOT NULL DEFAULT 'requested',
	`requestedAt` timestamp NOT NULL,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteToolMaintenance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteTools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int,
	`name` varchar(255) NOT NULL,
	`code` varchar(100) NOT NULL,
	`category` varchar(100),
	`brand` varchar(100),
	`model` varchar(100),
	`serialNumber` varchar(100),
	`purchaseDate` date,
	`purchasePrice` decimal(10,2),
	`status` enum('available','in_use','maintenance','broken','retired') NOT NULL DEFAULT 'available',
	`condition` enum('excellent','good','fair','poor') NOT NULL DEFAULT 'good',
	`lastMaintenanceDate` date,
	`nextMaintenanceDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteTools_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteWorkHours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workerId` int NOT NULL,
	`constructionId` int NOT NULL,
	`date` date NOT NULL,
	`taskDescription` text NOT NULL,
	`hours` decimal(5,2) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteWorkHours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteWorkers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`role` enum('worker','foreman','technician','engineer') NOT NULL,
	`phone` varchar(50),
	`email` varchar(255),
	`company` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteWorkers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierEvaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`projectId` int,
	`orderId` int,
	`qualityRating` int NOT NULL,
	`deliveryRating` int NOT NULL,
	`communicationRating` int NOT NULL,
	`priceRating` int NOT NULL,
	`overallRating` int NOT NULL,
	`comments` text,
	`wouldRecommend` boolean NOT NULL DEFAULT true,
	`evaluatedById` int NOT NULL,
	`evaluatedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplierEvaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`projectId` int,
	`orderId` int,
	`type` enum('purchase','payment','refund','credit') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'EUR',
	`description` text,
	`transactionDate` timestamp NOT NULL,
	`dueDate` timestamp,
	`paidDate` timestamp,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supplierTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`contactPerson` varchar(255),
	`email` varchar(320),
	`phone` varchar(50),
	`address` text,
	`taxId` varchar(50),
	`category` varchar(100),
	`rating` int DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('todo','in_progress','review','done','cancelled') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`urgency` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`importance` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`assignedTo` int,
	`dueDate` timestamp,
	`completedAt` timestamp,
	`kanbanOrder` int DEFAULT 0,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timesheets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`date` date NOT NULL,
	`hours` decimal(5,2) NOT NULL,
	`description` text,
	`taskType` varchar(100),
	`isBillable` boolean NOT NULL DEFAULT true,
	`status` enum('draft','submitted','approved') NOT NULL DEFAULT 'draft',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timesheets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userActivityLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actionType` varchar(100) NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`description` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userActivityLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailNotifications` int NOT NULL DEFAULT 1,
	`pushNotifications` int NOT NULL DEFAULT 1,
	`notificationFrequency` enum('realtime','hourly','daily','weekly') NOT NULL DEFAULT 'realtime',
	`theme` enum('light','dark','auto') NOT NULL DEFAULT 'light',
	`language` varchar(10) NOT NULL DEFAULT 'pt',
	`timezone` varchar(50) NOT NULL DEFAULT 'Europe/Lisbon',
	`dateFormat` varchar(20) NOT NULL DEFAULT 'DD/MM/YYYY',
	`defaultView` varchar(50) NOT NULL DEFAULT 'dashboard',
	`showCompletedProjects` int NOT NULL DEFAULT 1,
	`projectsPerPage` int NOT NULL DEFAULT 12,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `userPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin','client') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	`outlookAccessToken` text,
	`outlookRefreshToken` text,
	`outlookTokenExpiry` timestamp,
	`outlookEmail` varchar(320),
	`profilePicture` text,
	`bio` text,
	`phone` varchar(50),
	`location` varchar(255),
	`dateOfBirth` timestamp,
	`linkedin` varchar(255),
	`website` varchar(255),
	`jobTitle` varchar(255),
	`department` varchar(255),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `whatIfScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`scenarioName` varchar(255) NOT NULL,
	`description` text,
	`budgetAdjustment` decimal(15,2),
	`budgetPercentage` int,
	`teamSizeAdjustment` int,
	`timelineAdjustment` int,
	`resourceAllocation` text,
	`predictedDuration` int,
	`predictedCost` decimal(15,2),
	`predictedDelayDays` int,
	`costVariance` decimal(15,2),
	`feasibilityScore` int,
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`impactSummary` text,
	`recommendations` text,
	`tradeoffs` text,
	`successProbability` int,
	`criticalFactors` text,
	`riskFactors` text,
	`mitigationStrategies` text,
	`confidenceLevel` enum('low','medium','high') DEFAULT 'medium',
	`isFavorite` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatIfScenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `absences` ADD CONSTRAINT `absences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `absences` ADD CONSTRAINT `absences_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_approvedById_users_id_fk` FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientDocuments` ADD CONSTRAINT `clientDocuments_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientDocuments` ADD CONSTRAINT `clientDocuments_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientMessages` ADD CONSTRAINT `clientMessages_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientMessages` ADD CONSTRAINT `clientMessages_senderId_users_id_fk` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientProjects` ADD CONSTRAINT `clientProjects_clientId_users_id_fk` FOREIGN KEY (`clientId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientProjects` ADD CONSTRAINT `clientProjects_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timesheets` ADD CONSTRAINT `timesheets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timesheets` ADD CONSTRAINT `timesheets_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timesheets` ADD CONSTRAINT `timesheets_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `userId_idx` ON `absences` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `absences` (`status`);--> statement-breakpoint
CREATE INDEX `startDate_idx` ON `absences` (`startDate`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `aiSuggestions` (`projectId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `aiSuggestions` (`status`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `aiSuggestions` (`type`);--> statement-breakpoint
CREATE INDEX `renderId_idx` ON `archvizAnnotations` (`renderId`);--> statement-breakpoint
CREATE INDEX `createdById_idx` ON `archvizAnnotations` (`createdById`);--> statement-breakpoint
CREATE INDEX `renderId_idx` ON `archvizComments` (`renderId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `archvizComments` (`userId`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `archvizCompartments` (`projectId`);--> statement-breakpoint
CREATE INDEX `parentId_idx` ON `archvizCompartments` (`parentId`);--> statement-breakpoint
CREATE INDEX `renderId_idx` ON `archvizRenderComments` (`renderId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `archvizRenderComments` (`userId`);--> statement-breakpoint
CREATE INDEX `renderId_idx` ON `archvizRenderHistory` (`renderId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `archvizRenderHistory` (`userId`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `archvizRenders` (`projectId`);--> statement-breakpoint
CREATE INDEX `compartmentId_idx` ON `archvizRenders` (`compartmentId`);--> statement-breakpoint
CREATE INDEX `uploadedById_idx` ON `archvizRenders` (`uploadedById`);--> statement-breakpoint
CREATE INDEX `renderId_idx` ON `archvizStatusHistory` (`renderId`);--> statement-breakpoint
CREATE INDEX `changedById_idx` ON `archvizStatusHistory` (`changedById`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `archvizStatusHistory` (`createdAt`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `budgets` (`projectId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `budgets` (`status`);--> statement-breakpoint
CREATE INDEX `checklistId_idx` ON `checklistItems` (`checklistId`);--> statement-breakpoint
CREATE INDEX `isCompleted_idx` ON `checklistItems` (`isCompleted`);--> statement-breakpoint
CREATE INDEX `deliveryId_idx` ON `clientDeliveryApprovals` (`deliveryId`);--> statement-breakpoint
CREATE INDEX `clientId_idx` ON `clientDeliveryApprovals` (`clientId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `clientDeliveryApprovals` (`status`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `clientDocuments` (`projectId`);--> statement-breakpoint
CREATE INDEX `uploadedBy_idx` ON `clientDocuments` (`uploadedBy`);--> statement-breakpoint
CREATE INDEX `fileType_idx` ON `clientDocuments` (`fileType`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `clientMessages` (`projectId`);--> statement-breakpoint
CREATE INDEX `senderId_idx` ON `clientMessages` (`senderId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `clientMessages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `clientId_idx` ON `clientProjects` (`clientId`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `clientProjects` (`projectId`);--> statement-breakpoint
CREATE INDEX `clientProject_idx` ON `clientProjects` (`clientId`,`projectId`);--> statement-breakpoint
CREATE INDEX `comment_idx` ON `commentMentions` (`commentId`);--> statement-breakpoint
CREATE INDEX `mentioned_user_idx` ON `commentMentions` (`mentionedUserId`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `constructions` (`code`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `constructions` (`projectId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `constructions` (`status`);--> statement-breakpoint
CREATE INDEX `deliveryId_idx` ON `deliveryApprovals` (`deliveryId`);--> statement-breakpoint
CREATE INDEX `reviewerId_idx` ON `deliveryApprovals` (`reviewerId`);--> statement-breakpoint
CREATE INDEX `deliveryId_idx` ON `deliveryAuditLog` (`deliveryId`);--> statement-breakpoint
CREATE INDEX `performedBy_idx` ON `deliveryAuditLog` (`performedBy`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `deliveryAuditLog` (`action`);--> statement-breakpoint
CREATE INDEX `deliveryId_idx` ON `deliveryChecklists` (`deliveryId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `deliveryChecklists` (`deliveryType`);--> statement-breakpoint
CREATE INDEX `deliveryId_idx` ON `deliveryNotifications` (`deliveryId`);--> statement-breakpoint
CREATE INDEX `recipientId_idx` ON `deliveryNotifications` (`recipientId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `deliveryNotifications` (`type`);--> statement-breakpoint
CREATE INDEX `deliveryId_idx` ON `deliveryReminders` (`deliveryId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `deliveryReminders` (`status`);--> statement-breakpoint
CREATE INDEX `scheduledFor_idx` ON `deliveryReminders` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `deliveryReports` (`projectId`);--> statement-breakpoint
CREATE INDEX `phaseId_idx` ON `deliveryReports` (`phaseId`);--> statement-breakpoint
CREATE INDEX `reportDate_idx` ON `deliveryReports` (`reportDate`);--> statement-breakpoint
CREATE INDEX `deliveryId_idx` ON `deliveryVersions` (`deliveryId`);--> statement-breakpoint
CREATE INDEX `version_idx` ON `deliveryVersions` (`version`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `emails` (`userId`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `emails` (`projectId`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `emails` (`category`);--> statement-breakpoint
CREATE INDEX `receivedDateTime_idx` ON `emails` (`receivedDateTime`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `holidays` (`date`);--> statement-breakpoint
CREATE INDEX `year_idx` ON `holidays` (`year`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `mqtCategories` (`constructionId`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `mqtCategories` (`order`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `mqtImportHistory` (`constructionId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `mqtImportHistory` (`userId`);--> statement-breakpoint
CREATE INDEX `importedAt_idx` ON `mqtImportHistory` (`importedAt`);--> statement-breakpoint
CREATE INDEX `importId_idx` ON `mqtImportItems` (`importId`);--> statement-breakpoint
CREATE INDEX `mqtItemId_idx` ON `mqtImportItems` (`mqtItemId`);--> statement-breakpoint
CREATE INDEX `itemId_idx` ON `mqtItemHistory` (`itemId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `mqtItemHistory` (`userId`);--> statement-breakpoint
CREATE INDEX `changedAt_idx` ON `mqtItemHistory` (`changedAt`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `mqtItems` (`constructionId`);--> statement-breakpoint
CREATE INDEX `categoryId_idx` ON `mqtItems` (`categoryId`);--> statement-breakpoint
CREATE INDEX `supplierId_idx` ON `mqtItems` (`supplierId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `mqtItems` (`status`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `mqtItems` (`order`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `mqtValidationRules` (`constructionId`);--> statement-breakpoint
CREATE INDEX `enabled_idx` ON `mqtValidationRules` (`enabled`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `projectDeliveries` (`projectId`);--> statement-breakpoint
CREATE INDEX `phaseId_idx` ON `projectDeliveries` (`phaseId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `projectDeliveries` (`status`);--> statement-breakpoint
CREATE INDEX `dueDate_idx` ON `projectDeliveries` (`dueDate`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `projectDocuments` (`projectId`);--> statement-breakpoint
CREATE INDEX `phaseId_idx` ON `projectDocuments` (`phaseId`);--> statement-breakpoint
CREATE INDEX `documentType_idx` ON `projectDocuments` (`documentType`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `projectDocuments` (`category`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `projectGallery` (`projectId`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `projectMilestones` (`projectId`);--> statement-breakpoint
CREATE INDEX `phaseId_idx` ON `projectMilestones` (`phaseId`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `projectPhases` (`projectId`);--> statement-breakpoint
CREATE INDEX `project_idx` ON `projectPredictions` (`projectId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `projectPredictions` (`predictionType`);--> statement-breakpoint
CREATE INDEX `risk_idx` ON `projectPredictions` (`riskLevel`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `projectTeam` (`projectId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `projectTeam` (`userId`);--> statement-breakpoint
CREATE INDEX `workerId_idx` ON `siteAttendance` (`workerId`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteAttendance` (`constructionId`);--> statement-breakpoint
CREATE INDEX `checkIn_idx` ON `siteAttendance` (`checkIn`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteMaterialRequests` (`constructionId`);--> statement-breakpoint
CREATE INDEX `requestedBy_idx` ON `siteMaterialRequests` (`requestedBy`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `siteMaterialRequests` (`status`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteMaterialUsage` (`constructionId`);--> statement-breakpoint
CREATE INDEX `usedBy_idx` ON `siteMaterialUsage` (`usedBy`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `siteMaterialUsage` (`date`);--> statement-breakpoint
CREATE INDEX `toolId_idx` ON `siteToolAssignments` (`toolId`);--> statement-breakpoint
CREATE INDEX `workerId_idx` ON `siteToolAssignments` (`workerId`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteToolAssignments` (`constructionId`);--> statement-breakpoint
CREATE INDEX `toolId_idx` ON `siteToolMaintenance` (`toolId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `siteToolMaintenance` (`status`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteTools` (`constructionId`);--> statement-breakpoint
CREATE INDEX `code_idx` ON `siteTools` (`code`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `siteTools` (`status`);--> statement-breakpoint
CREATE INDEX `workerId_idx` ON `siteWorkHours` (`workerId`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteWorkHours` (`constructionId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `siteWorkHours` (`date`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteWorkers` (`constructionId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `siteWorkers` (`userId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `timesheets` (`userId`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `timesheets` (`projectId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `timesheets` (`date`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `timesheets` (`status`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `userActivityLog` (`userId`);--> statement-breakpoint
CREATE INDEX `actionType_idx` ON `userActivityLog` (`actionType`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `userActivityLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `userPreferences` (`userId`);