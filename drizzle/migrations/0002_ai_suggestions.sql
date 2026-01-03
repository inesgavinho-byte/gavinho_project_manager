CREATE TABLE IF NOT EXISTS `aiSuggestions` (
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

CREATE INDEX `projectId_idx` ON `aiSuggestions` (`projectId`);
CREATE INDEX `status_idx` ON `aiSuggestions` (`status`);
CREATE INDEX `type_idx` ON `aiSuggestions` (`type`);
