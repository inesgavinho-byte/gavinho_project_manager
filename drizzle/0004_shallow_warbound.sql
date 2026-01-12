CREATE TABLE `budgetAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`budgetId` int NOT NULL,
	`alertType` enum('warning','critical','exceeded') NOT NULL,
	`threshold` int NOT NULL,
	`currentPercentage` int NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`readById` int,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `budgetAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgetItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`budgetId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
	`unitPrice` decimal(15,2) NOT NULL,
	`totalPrice` decimal(15,2) NOT NULL,
	`unit` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgetItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientCompanyProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`projectId` int NOT NULL,
	`role` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clientCompanyProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`budgetId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`amount` decimal(15,2) NOT NULL,
	`expenseDate` timestamp NOT NULL,
	`supplier` varchar(255),
	`invoiceNumber` varchar(100),
	`paymentStatus` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`paymentDate` timestamp,
	`receiptUrl` text,
	`receiptKey` text,
	`notes` text,
	`createdById` int NOT NULL,
	`approvedById` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `library3DModels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`tags` text,
	`thumbnailUrl` text,
	`modelUrl` text NOT NULL,
	`fileFormat` varchar(50),
	`fileSize` int,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `library3DModels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `libraryInspiration` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`tags` text,
	`imageUrl` text NOT NULL,
	`sourceUrl` text,
	`projectId` int,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `libraryInspiration_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `libraryMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`tags` text,
	`imageUrl` text,
	`fileUrl` text,
	`supplier` varchar(255),
	`price` decimal(15,2),
	`unit` varchar(50),
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`approvalStatus` enum('pending','approved','rejected') DEFAULT 'approved',
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectionReason` text,
	CONSTRAINT `libraryMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `libraryTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`category` enum('material','model','inspiration','general') NOT NULL DEFAULT 'general',
	`color` varchar(20) DEFAULT '#C9A882',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `libraryTags_id` PRIMARY KEY(`id`),
	CONSTRAINT `libraryTags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `materialPriceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`supplierName` varchar(255),
	`notes` text,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`recordedById` int NOT NULL,
	CONSTRAINT `materialPriceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materialSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`suggestedMaterialId` int NOT NULL,
	`reason` text NOT NULL,
	`confidence` decimal(5,2) NOT NULL,
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`matchFactors` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	`respondedById` int,
	CONSTRAINT `materialSuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectInspirationLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`inspirationId` int NOT NULL,
	`notes` text,
	`addedById` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectInspirationLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`materialId` int NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitPrice` decimal(15,2),
	`totalPrice` decimal(15,2),
	`notes` text,
	`status` enum('planned','ordered','delivered','installed') NOT NULL DEFAULT 'planned',
	`addedById` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectModels3D` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`modelId` int NOT NULL,
	`location` varchar(255),
	`notes` text,
	`addedById` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projectModels3D_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteIncidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`reportedBy` int NOT NULL,
	`type` enum('safety','quality','delay','damage','theft','other') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`location` varchar(255),
	`photos` text,
	`status` enum('open','investigating','resolved','closed') NOT NULL DEFAULT 'open',
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`resolution` text,
	`date` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteIncidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteNonCompliances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`reportedBy` int NOT NULL,
	`reporterType` enum('director','inspector','safety','quality') NOT NULL,
	`type` enum('quality','safety','environmental','contractual','other') NOT NULL,
	`severity` enum('minor','major','critical') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`location` varchar(255),
	`responsibleParty` varchar(255),
	`photos` text,
	`correctiveAction` text,
	`deadline` date,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`resolvedBy` int,
	`resolvedAt` timestamp,
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`reportGenerated` boolean NOT NULL DEFAULT false,
	`reportUrl` varchar(500),
	`date` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteNonCompliances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sitePPE` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int,
	`type` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(100),
	`size` varchar(50),
	`quantity` int NOT NULL,
	`minQuantity` int NOT NULL DEFAULT 0,
	`assignedTo` int,
	`assignedAt` timestamp,
	`expiryDate` date,
	`status` enum('available','assigned','expired','damaged') NOT NULL DEFAULT 'available',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sitePPE_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteProductivityAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`workerId` int NOT NULL,
	`date` date NOT NULL,
	`actualQuantity` decimal(10,2) NOT NULL,
	`goalQuantity` decimal(10,2) NOT NULL,
	`percentageAchieved` decimal(5,2) NOT NULL,
	`alertType` enum('above_goal','below_goal','on_target') NOT NULL,
	`status` enum('unread','read','acknowledged') NOT NULL DEFAULT 'unread',
	`notifiedAt` timestamp,
	`acknowledgedBy` int,
	`acknowledgedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siteProductivityAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteProductivityGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`workerId` int NOT NULL,
	`dailyGoal` decimal(10,2) NOT NULL,
	`weeklyGoal` decimal(10,2),
	`unit` varchar(50) NOT NULL DEFAULT 'unidades',
	`active` boolean NOT NULL DEFAULT true,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteProductivityGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteQuantityMap` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`category` varchar(255) NOT NULL,
	`item` varchar(255) NOT NULL,
	`description` text,
	`unit` varchar(50) NOT NULL,
	`plannedQuantity` decimal(12,2) NOT NULL,
	`currentQuantity` decimal(12,2) NOT NULL DEFAULT '0',
	`unitPrice` decimal(10,2),
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteQuantityMap_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteQuantityProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quantityMapId` int NOT NULL,
	`constructionId` int NOT NULL,
	`updatedBy` int NOT NULL,
	`date` date NOT NULL,
	`quantity` decimal(12,2) NOT NULL,
	`notes` text,
	`photos` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siteQuantityProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSafetyAudits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`auditedBy` int NOT NULL,
	`date` timestamp NOT NULL,
	`type` enum('routine','special','incident_followup') NOT NULL,
	`checklist` text,
	`findings` text,
	`nonCompliances` text,
	`recommendations` text,
	`photos` text,
	`score` int,
	`status` enum('draft','completed','approved') NOT NULL DEFAULT 'draft',
	`reportGenerated` boolean NOT NULL DEFAULT false,
	`reportUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSafetyAudits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSafetyIncidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`reportedBy` int NOT NULL,
	`date` timestamp NOT NULL,
	`type` enum('accident','near_miss','unsafe_condition','unsafe_act') NOT NULL,
	`severity` enum('minor','moderate','serious','fatal') NOT NULL,
	`injuredPerson` varchar(255),
	`injuryType` varchar(255),
	`bodyPart` varchar(255),
	`description` text NOT NULL,
	`location` varchar(255),
	`witnesses` text,
	`immediateAction` text,
	`rootCause` text,
	`correctiveAction` text,
	`preventiveAction` text,
	`photos` text,
	`medicalAttention` boolean NOT NULL DEFAULT false,
	`workDaysLost` int NOT NULL DEFAULT 0,
	`status` enum('reported','investigating','closed') NOT NULL DEFAULT 'reported',
	`investigatedBy` int,
	`investigatedAt` timestamp,
	`reportGenerated` boolean NOT NULL DEFAULT false,
	`reportUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSafetyIncidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSubcontractorWork` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subcontractorId` int NOT NULL,
	`constructionId` int NOT NULL,
	`date` date NOT NULL,
	`workDescription` text NOT NULL,
	`teamSize` int,
	`hoursWorked` decimal(5,2),
	`progress` decimal(5,2),
	`photos` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSubcontractorWork_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSubcontractors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactPerson` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`email` varchar(255),
	`nif` varchar(50),
	`specialty` varchar(255) NOT NULL,
	`contractValue` decimal(12,2),
	`startDate` date,
	`endDate` date,
	`status` enum('active','inactive','completed') NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteSubcontractors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteVisits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`visitedBy` int NOT NULL,
	`visitorType` enum('director','inspector','client','architect','engineer') NOT NULL,
	`date` timestamp NOT NULL,
	`duration` int,
	`purpose` text,
	`observations` text,
	`photos` text,
	`attendees` text,
	`reportGenerated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteVisits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteWorkPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`constructionId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`uploaderType` enum('worker','subcontractor','director','inspector','safety') NOT NULL,
	`photoUrl` varchar(500) NOT NULL,
	`description` text,
	`location` varchar(255),
	`tags` text,
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `siteWorkPhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`projectId` int NOT NULL,
	`category` varchar(100),
	`totalValue` decimal(15,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supplierProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `budgetAlerts` ADD CONSTRAINT `budgetAlerts_budgetId_budgets_id_fk` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgetAlerts` ADD CONSTRAINT `budgetAlerts_readById_users_id_fk` FOREIGN KEY (`readById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgetItems` ADD CONSTRAINT `budgetItems_budgetId_budgets_id_fk` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientCompanyProjects` ADD CONSTRAINT `clientCompanyProjects_clientId_suppliers_id_fk` FOREIGN KEY (`clientId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clientCompanyProjects` ADD CONSTRAINT `clientCompanyProjects_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_budgetId_budgets_id_fk` FOREIGN KEY (`budgetId`) REFERENCES `budgets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_approvedById_users_id_fk` FOREIGN KEY (`approvedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `library3DModels` ADD CONSTRAINT `library3DModels_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `libraryInspiration` ADD CONSTRAINT `libraryInspiration_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `libraryInspiration` ADD CONSTRAINT `libraryInspiration_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `libraryMaterials` ADD CONSTRAINT `libraryMaterials_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materialPriceHistory` ADD CONSTRAINT `materialPriceHistory_materialId_libraryMaterials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `libraryMaterials`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materialPriceHistory` ADD CONSTRAINT `materialPriceHistory_recordedById_users_id_fk` FOREIGN KEY (`recordedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materialSuggestions` ADD CONSTRAINT `materialSuggestions_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materialSuggestions` ADD CONSTRAINT `materialSuggestions_suggestedMaterialId_libraryMaterials_id_fk` FOREIGN KEY (`suggestedMaterialId`) REFERENCES `libraryMaterials`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materialSuggestions` ADD CONSTRAINT `materialSuggestions_respondedById_users_id_fk` FOREIGN KEY (`respondedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectInspirationLinks` ADD CONSTRAINT `projectInspirationLinks_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectInspirationLinks` ADD CONSTRAINT `projectInspirationLinks_inspirationId_libraryInspiration_id_fk` FOREIGN KEY (`inspirationId`) REFERENCES `libraryInspiration`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectInspirationLinks` ADD CONSTRAINT `projectInspirationLinks_addedById_users_id_fk` FOREIGN KEY (`addedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectMaterials` ADD CONSTRAINT `projectMaterials_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectMaterials` ADD CONSTRAINT `projectMaterials_materialId_libraryMaterials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `libraryMaterials`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectMaterials` ADD CONSTRAINT `projectMaterials_addedById_users_id_fk` FOREIGN KEY (`addedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectModels3D` ADD CONSTRAINT `projectModels3D_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectModels3D` ADD CONSTRAINT `projectModels3D_modelId_library3DModels_id_fk` FOREIGN KEY (`modelId`) REFERENCES `library3DModels`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projectModels3D` ADD CONSTRAINT `projectModels3D_addedById_users_id_fk` FOREIGN KEY (`addedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierProjects` ADD CONSTRAINT `supplierProjects_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierProjects` ADD CONSTRAINT `supplierProjects_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `budgetId_idx` ON `budgetAlerts` (`budgetId`);--> statement-breakpoint
CREATE INDEX `alertType_idx` ON `budgetAlerts` (`alertType`);--> statement-breakpoint
CREATE INDEX `isRead_idx` ON `budgetAlerts` (`isRead`);--> statement-breakpoint
CREATE INDEX `budgetId_idx` ON `budgetItems` (`budgetId`);--> statement-breakpoint
CREATE INDEX `clientCompanyProject_idx` ON `clientCompanyProjects` (`clientId`,`projectId`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `expenses` (`projectId`);--> statement-breakpoint
CREATE INDEX `budgetId_idx` ON `expenses` (`budgetId`);--> statement-breakpoint
CREATE INDEX `expenseDate_idx` ON `expenses` (`expenseDate`);--> statement-breakpoint
CREATE INDEX `paymentStatus_idx` ON `expenses` (`paymentStatus`);--> statement-breakpoint
CREATE INDEX `library3DModel_category_idx` ON `library3DModels` (`category`);--> statement-breakpoint
CREATE INDEX `library3DModel_fileFormat_idx` ON `library3DModels` (`fileFormat`);--> statement-breakpoint
CREATE INDEX `library3DModel_createdBy_idx` ON `library3DModels` (`createdById`);--> statement-breakpoint
CREATE INDEX `libraryInspiration_project_idx` ON `libraryInspiration` (`projectId`);--> statement-breakpoint
CREATE INDEX `libraryInspiration_createdBy_idx` ON `libraryInspiration` (`createdById`);--> statement-breakpoint
CREATE INDEX `libraryMaterial_category_idx` ON `libraryMaterials` (`category`);--> statement-breakpoint
CREATE INDEX `libraryMaterial_supplier_idx` ON `libraryMaterials` (`supplier`);--> statement-breakpoint
CREATE INDEX `libraryMaterial_createdBy_idx` ON `libraryMaterials` (`createdById`);--> statement-breakpoint
CREATE INDEX `libraryTag_category_idx` ON `libraryTags` (`category`);--> statement-breakpoint
CREATE INDEX `materialSuggestion_project_idx` ON `materialSuggestions` (`projectId`);--> statement-breakpoint
CREATE INDEX `materialSuggestion_material_idx` ON `materialSuggestions` (`suggestedMaterialId`);--> statement-breakpoint
CREATE INDEX `materialSuggestion_status_idx` ON `materialSuggestions` (`status`);--> statement-breakpoint
CREATE INDEX `projectInspiration_project_idx` ON `projectInspirationLinks` (`projectId`);--> statement-breakpoint
CREATE INDEX `projectInspiration_inspiration_idx` ON `projectInspirationLinks` (`inspirationId`);--> statement-breakpoint
CREATE INDEX `projectMaterial_project_idx` ON `projectMaterials` (`projectId`);--> statement-breakpoint
CREATE INDEX `projectMaterial_material_idx` ON `projectMaterials` (`materialId`);--> statement-breakpoint
CREATE INDEX `projectMaterial_status_idx` ON `projectMaterials` (`status`);--> statement-breakpoint
CREATE INDEX `projectModel_project_idx` ON `projectModels3D` (`projectId`);--> statement-breakpoint
CREATE INDEX `projectModel_model_idx` ON `projectModels3D` (`modelId`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteIncidents` (`constructionId`);--> statement-breakpoint
CREATE INDEX `reportedBy_idx` ON `siteIncidents` (`reportedBy`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `siteIncidents` (`status`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `siteIncidents` (`date`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteNonCompliances` (`constructionId`);--> statement-breakpoint
CREATE INDEX `reportedBy_idx` ON `siteNonCompliances` (`reportedBy`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `siteNonCompliances` (`status`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `siteNonCompliances` (`date`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `sitePPE` (`constructionId`);--> statement-breakpoint
CREATE INDEX `assignedTo_idx` ON `sitePPE` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `sitePPE` (`status`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteProductivityAlerts` (`constructionId`);--> statement-breakpoint
CREATE INDEX `workerId_idx` ON `siteProductivityAlerts` (`workerId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `siteProductivityAlerts` (`date`);--> statement-breakpoint
CREATE INDEX `alertType_idx` ON `siteProductivityAlerts` (`alertType`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `siteProductivityAlerts` (`status`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteProductivityGoals` (`constructionId`);--> statement-breakpoint
CREATE INDEX `workerId_idx` ON `siteProductivityGoals` (`workerId`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `siteProductivityGoals` (`active`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteQuantityMap` (`constructionId`);--> statement-breakpoint
CREATE INDEX `category_idx` ON `siteQuantityMap` (`category`);--> statement-breakpoint
CREATE INDEX `quantityMapId_idx` ON `siteQuantityProgress` (`quantityMapId`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteQuantityProgress` (`constructionId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `siteQuantityProgress` (`date`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteSafetyAudits` (`constructionId`);--> statement-breakpoint
CREATE INDEX `auditedBy_idx` ON `siteSafetyAudits` (`auditedBy`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `siteSafetyAudits` (`date`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteSafetyIncidents` (`constructionId`);--> statement-breakpoint
CREATE INDEX `reportedBy_idx` ON `siteSafetyIncidents` (`reportedBy`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `siteSafetyIncidents` (`date`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `siteSafetyIncidents` (`status`);--> statement-breakpoint
CREATE INDEX `subcontractorId_idx` ON `siteSubcontractorWork` (`subcontractorId`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteSubcontractorWork` (`constructionId`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `siteSubcontractorWork` (`date`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteSubcontractors` (`constructionId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `siteSubcontractors` (`status`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteVisits` (`constructionId`);--> statement-breakpoint
CREATE INDEX `visitedBy_idx` ON `siteVisits` (`visitedBy`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `siteVisits` (`date`);--> statement-breakpoint
CREATE INDEX `constructionId_idx` ON `siteWorkPhotos` (`constructionId`);--> statement-breakpoint
CREATE INDEX `uploadedBy_idx` ON `siteWorkPhotos` (`uploadedBy`);--> statement-breakpoint
CREATE INDEX `date_idx` ON `siteWorkPhotos` (`date`);--> statement-breakpoint
CREATE INDEX `supplierProject_idx` ON `supplierProjects` (`supplierId`,`projectId`);