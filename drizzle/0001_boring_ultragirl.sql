CREATE TABLE `aiSuggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`suggestionType` enum('action','communication','resource','risk','optimization') NOT NULL DEFAULT 'action',
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`reasoning` text,
	`status` enum('pending','accepted','rejected','completed') NOT NULL DEFAULT 'pending',
	`acceptedById` int,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiSuggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`description` text,
	`budgetedAmount` decimal(15,2) NOT NULL,
	`actualAmount` decimal(15,2) DEFAULT '0.00',
	`variance` decimal(15,2) DEFAULT '0.00',
	`variancePercent` decimal(5,2) DEFAULT '0.00',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`messageId` varchar(255) NOT NULL,
	`subject` text,
	`fromEmail` varchar(320),
	`fromName` varchar(255),
	`toEmails` text,
	`ccEmails` text,
	`body` text,
	`category` enum('order','adjudication','purchase','communication','other') NOT NULL DEFAULT 'other',
	`receivedAt` timestamp NOT NULL,
	`hasAttachments` boolean DEFAULT false,
	`attachmentUrls` text,
	`isRead` boolean DEFAULT false,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emails_id` PRIMARY KEY(`id`),
	CONSTRAINT `emails_messageId_unique` UNIQUE(`messageId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`type` enum('deadline','delay','budget_alert','order_update','task_assigned','other') NOT NULL DEFAULT 'other',
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`isRead` boolean NOT NULL DEFAULT false,
	`actionUrl` varchar(500),
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
	`status` enum('pending','approved','ordered','in_transit','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`quantity` decimal(15,3),
	`unit` varchar(50),
	`unitPrice` decimal(15,2),
	`totalAmount` decimal(15,2) NOT NULL,
	`orderDate` timestamp,
	`expectedDeliveryDate` timestamp,
	`actualDeliveryDate` timestamp,
	`notes` text,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
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
	`actualEndDate` timestamp,
	`progress` int NOT NULL DEFAULT 0,
	`budget` decimal(15,2),
	`actualCost` decimal(15,2) DEFAULT '0.00',
	`responsibleId` int,
	`clientName` varchar(255),
	`location` text,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quantityMaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`category` varchar(100),
	`unit` varchar(50) NOT NULL,
	`plannedQuantity` decimal(15,3) NOT NULL,
	`executedQuantity` decimal(15,3) DEFAULT '0.000',
	`unitPrice` decimal(15,2),
	`totalPlanned` decimal(15,2),
	`totalExecuted` decimal(15,2),
	`notes` text,
	`importSource` varchar(100),
	`importedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quantityMaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`reportType` enum('progress','budget','timeline','resources','custom') NOT NULL DEFAULT 'progress',
	`title` varchar(255) NOT NULL,
	`description` text,
	`format` enum('pdf','excel','json') NOT NULL DEFAULT 'pdf',
	`fileUrl` varchar(500),
	`parameters` text,
	`generatedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `supplierTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`orderId` int,
	`projectId` int,
	`transactionType` enum('payment','refund','adjustment') NOT NULL DEFAULT 'payment',
	`amount` decimal(15,2) NOT NULL,
	`description` text,
	`transactionDate` timestamp NOT NULL,
	`paymentMethod` varchar(100),
	`referenceNumber` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
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
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
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
	`status` enum('backlog','todo','in_progress','review','done') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`urgency` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`importance` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`assignedToId` int,
	`dueDate` timestamp,
	`completedAt` timestamp,
	`estimatedHours` decimal(8,2),
	`actualHours` decimal(8,2),
	`kanbanOrder` int DEFAULT 0,
	`createdById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `aiSuggestions` ADD CONSTRAINT `aiSuggestions_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `aiSuggestions` ADD CONSTRAINT `aiSuggestions_acceptedById_users_id_fk` FOREIGN KEY (`acceptedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `budgets` ADD CONSTRAINT `budgets_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_responsibleId_users_id_fk` FOREIGN KEY (`responsibleId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quantityMaps` ADD CONSTRAINT `quantityMaps_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reports` ADD CONSTRAINT `reports_generatedById_users_id_fk` FOREIGN KEY (`generatedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierTransactions` ADD CONSTRAINT `supplierTransactions_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierTransactions` ADD CONSTRAINT `supplierTransactions_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `supplierTransactions` ADD CONSTRAINT `supplierTransactions_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_assignedToId_users_id_fk` FOREIGN KEY (`assignedToId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;