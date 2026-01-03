CREATE TABLE IF NOT EXISTS `emails` (
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

CREATE INDEX `userId_idx` ON `emails` (`userId`);
CREATE INDEX `projectId_idx` ON `emails` (`projectId`);
CREATE INDEX `category_idx` ON `emails` (`category`);
CREATE INDEX `receivedDateTime_idx` ON `emails` (`receivedDateTime`);

ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `outlookAccessToken` text;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `outlookRefreshToken` text;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `outlookTokenExpiry` timestamp;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `outlookEmail` varchar(320);
