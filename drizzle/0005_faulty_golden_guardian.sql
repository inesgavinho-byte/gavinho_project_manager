CREATE TABLE `collectionMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectionId` int NOT NULL,
	`materialId` int NOT NULL,
	`notes` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collectionMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commentNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`material_id` int NOT NULL,
	`comment_id` int NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commentNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commentReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`comment_id` int NOT NULL,
	`user_id` int NOT NULL,
	`emoji` varchar(10) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commentReactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `commentReactions_comment_id_user_id_emoji_unique` UNIQUE(`comment_id`,`user_id`,`emoji`)
);
--> statement-breakpoint
CREATE TABLE `costPredictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`predictedCost` decimal(15,2) NOT NULL,
	`confidenceLevel` enum('low','medium','high') NOT NULL,
	`confidenceScore` int NOT NULL,
	`overrunRisk` enum('low','medium','high','critical') NOT NULL,
	`overrunProbability` int NOT NULL,
	`analysisDate` timestamp NOT NULL DEFAULT (now()),
	`basedOnProjects` json DEFAULT ('[]'),
	`factors` json NOT NULL,
	`recommendations` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `costPredictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favoriteMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`materialId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favoriteMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materialApprovalHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`userId` int NOT NULL,
	`action` enum('approved','rejected') NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `materialApprovalHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materialCollections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(50),
	`icon` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materialCollections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materialComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`materialId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`isPinned` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `materialComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`executedById` int NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`parameters` json NOT NULL,
	`data` json NOT NULL,
	`exportFormat` enum('pdf','excel','csv','json') NOT NULL,
	`fileUrl` text,
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reportExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdById` int NOT NULL,
	`isPublic` int NOT NULL DEFAULT 0,
	`reportType` enum('progress','financial','resources','timeline','custom') NOT NULL,
	`metrics` json DEFAULT ('[]'),
	`chartTypes` json DEFAULT ('[]'),
	`filters` json NOT NULL,
	`layout` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reportTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskAssignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`dueDate` timestamp,
	`estimatedHours` decimal(5,2),
	`actualHours` decimal(5,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskAssignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`taskId` int,
	`description` text NOT NULL,
	`hours` decimal(5,2) NOT NULL,
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeTracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAvailability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` date NOT NULL,
	`status` enum('available','busy','off','vacation') NOT NULL DEFAULT 'available',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userAvailability_id` PRIMARY KEY(`id`),
	CONSTRAINT `userAvailability_userId_date_unique` UNIQUE(`userId`,`date`)
);
--> statement-breakpoint
ALTER TABLE `collectionMaterials` ADD CONSTRAINT `collectionMaterials_collectionId_materialCollections_id_fk` FOREIGN KEY (`collectionId`) REFERENCES `materialCollections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collectionMaterials` ADD CONSTRAINT `collectionMaterials_materialId_libraryMaterials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `libraryMaterials`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commentNotifications` ADD CONSTRAINT `commentNotifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commentNotifications` ADD CONSTRAINT `commentNotifications_material_id_libraryMaterials_id_fk` FOREIGN KEY (`material_id`) REFERENCES `libraryMaterials`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commentNotifications` ADD CONSTRAINT `commentNotifications_comment_id_materialComments_id_fk` FOREIGN KEY (`comment_id`) REFERENCES `materialComments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commentReactions` ADD CONSTRAINT `commentReactions_comment_id_materialComments_id_fk` FOREIGN KEY (`comment_id`) REFERENCES `materialComments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commentReactions` ADD CONSTRAINT `commentReactions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `costPredictions` ADD CONSTRAINT `costPredictions_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favoriteMaterials` ADD CONSTRAINT `favoriteMaterials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favoriteMaterials` ADD CONSTRAINT `favoriteMaterials_materialId_libraryMaterials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `libraryMaterials`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materialApprovalHistory` ADD CONSTRAINT `materialApprovalHistory_materialId_libraryMaterials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `libraryMaterials`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materialApprovalHistory` ADD CONSTRAINT `materialApprovalHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materialCollections` ADD CONSTRAINT `materialCollections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materialComments` ADD CONSTRAINT `materialComments_materialId_libraryMaterials_id_fk` FOREIGN KEY (`materialId`) REFERENCES `libraryMaterials`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materialComments` ADD CONSTRAINT `materialComments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportExecutions` ADD CONSTRAINT `reportExecutions_templateId_reportTemplates_id_fk` FOREIGN KEY (`templateId`) REFERENCES `reportTemplates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportExecutions` ADD CONSTRAINT `reportExecutions_executedById_users_id_fk` FOREIGN KEY (`executedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reportTemplates` ADD CONSTRAINT `reportTemplates_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskAssignments` ADD CONSTRAINT `taskAssignments_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `taskAssignments` ADD CONSTRAINT `taskAssignments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeTracking` ADD CONSTRAINT `timeTracking_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `timeTracking` ADD CONSTRAINT `timeTracking_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userAvailability` ADD CONSTRAINT `userAvailability_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `collectionMaterial_collection_idx` ON `collectionMaterials` (`collectionId`);--> statement-breakpoint
CREATE INDEX `collectionMaterial_material_idx` ON `collectionMaterials` (`materialId`);--> statement-breakpoint
CREATE INDEX `unique_collection_material` ON `collectionMaterials` (`collectionId`,`materialId`);--> statement-breakpoint
CREATE INDEX `projectId_idx` ON `costPredictions` (`projectId`);--> statement-breakpoint
CREATE INDEX `analysisDate_idx` ON `costPredictions` (`analysisDate`);--> statement-breakpoint
CREATE INDEX `overrunRisk_idx` ON `costPredictions` (`overrunRisk`);--> statement-breakpoint
CREATE INDEX `favoriteMaterial_user_idx` ON `favoriteMaterials` (`userId`);--> statement-breakpoint
CREATE INDEX `favoriteMaterial_material_idx` ON `favoriteMaterials` (`materialId`);--> statement-breakpoint
CREATE INDEX `unique_user_material` ON `favoriteMaterials` (`userId`,`materialId`);--> statement-breakpoint
CREATE INDEX `materialCollection_user_idx` ON `materialCollections` (`userId`);--> statement-breakpoint
CREATE INDEX `materialComment_material_idx` ON `materialComments` (`materialId`);--> statement-breakpoint
CREATE INDEX `materialComment_user_idx` ON `materialComments` (`userId`);--> statement-breakpoint
CREATE INDEX `materialComment_pinned_idx` ON `materialComments` (`isPinned`);--> statement-breakpoint
CREATE INDEX `templateId_idx` ON `reportExecutions` (`templateId`);--> statement-breakpoint
CREATE INDEX `executedById_idx` ON `reportExecutions` (`executedById`);--> statement-breakpoint
CREATE INDEX `executedAt_idx` ON `reportExecutions` (`executedAt`);--> statement-breakpoint
CREATE INDEX `createdById_idx` ON `reportTemplates` (`createdById`);--> statement-breakpoint
CREATE INDEX `reportType_idx` ON `reportTemplates` (`reportType`);--> statement-breakpoint
CREATE INDEX `isPublic_idx` ON `reportTemplates` (`isPublic`);--> statement-breakpoint
CREATE INDEX `taskAssignments_project_idx` ON `taskAssignments` (`projectId`);--> statement-breakpoint
CREATE INDEX `taskAssignments_user_idx` ON `taskAssignments` (`userId`);--> statement-breakpoint
CREATE INDEX `taskAssignments_status_idx` ON `taskAssignments` (`status`);--> statement-breakpoint
CREATE INDEX `taskAssignments_dueDate_idx` ON `taskAssignments` (`dueDate`);--> statement-breakpoint
CREATE INDEX `timeTracking_user_idx` ON `timeTracking` (`userId`);--> statement-breakpoint
CREATE INDEX `timeTracking_project_idx` ON `timeTracking` (`projectId`);--> statement-breakpoint
CREATE INDEX `timeTracking_date_idx` ON `timeTracking` (`date`);--> statement-breakpoint
CREATE INDEX `userAvailability_user_idx` ON `userAvailability` (`userId`);--> statement-breakpoint
CREATE INDEX `userAvailability_date_idx` ON `userAvailability` (`date`);