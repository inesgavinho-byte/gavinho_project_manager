-- Site Management Module Tables

CREATE TABLE IF NOT EXISTS `siteWorkers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT NOT NULL,
  `userId` INT,
  `name` VARCHAR(255) NOT NULL,
  `role` ENUM('worker', 'foreman', 'technician', 'engineer') NOT NULL,
  `phone` VARCHAR(50),
  `email` VARCHAR(255),
  `company` VARCHAR(255),
  `isActive` BOOLEAN DEFAULT TRUE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `userId_idx` (`userId`)
);

CREATE TABLE IF NOT EXISTS `siteAttendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `workerId` INT NOT NULL,
  `constructionId` INT NOT NULL,
  `checkIn` TIMESTAMP NOT NULL,
  `checkOut` TIMESTAMP,
  `location` TEXT,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `workerId_idx` (`workerId`),
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `checkIn_idx` (`checkIn`)
);

CREATE TABLE IF NOT EXISTS `siteWorkHours` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `workerId` INT NOT NULL,
  `constructionId` INT NOT NULL,
  `date` DATE NOT NULL,
  `taskDescription` TEXT NOT NULL,
  `hours` DECIMAL(5, 2) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' NOT NULL,
  `approvedBy` INT,
  `approvedAt` TIMESTAMP,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `workerId_idx` (`workerId`),
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `date_idx` (`date`)
);

CREATE TABLE IF NOT EXISTS `siteMaterialRequests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT NOT NULL,
  `requestedBy` INT NOT NULL,
  `materialName` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10, 2) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `urgency` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' NOT NULL,
  `reason` TEXT,
  `status` ENUM('pending', 'approved', 'rejected', 'delivered') DEFAULT 'pending' NOT NULL,
  `approvedBy` INT,
  `approvedAt` TIMESTAMP,
  `deliveredAt` TIMESTAMP,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `requestedBy_idx` (`requestedBy`),
  INDEX `status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `siteMaterialUsage` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT NOT NULL,
  `usedBy` INT NOT NULL,
  `materialName` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(10, 2) NOT NULL,
  `unit` VARCHAR(50) NOT NULL,
  `location` VARCHAR(255),
  `notes` TEXT,
  `date` DATE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `usedBy_idx` (`usedBy`),
  INDEX `date_idx` (`date`)
);

CREATE TABLE IF NOT EXISTS `siteTools` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100),
  `brand` VARCHAR(100),
  `model` VARCHAR(100),
  `serialNumber` VARCHAR(100),
  `purchaseDate` DATE,
  `purchasePrice` DECIMAL(10, 2),
  `status` ENUM('available', 'in_use', 'maintenance', 'broken', 'retired') DEFAULT 'available' NOT NULL,
  `condition` ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'good' NOT NULL,
  `lastMaintenanceDate` DATE,
  `nextMaintenanceDate` DATE,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `code_idx` (`code`),
  INDEX `status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `siteToolAssignments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `toolId` INT NOT NULL,
  `workerId` INT NOT NULL,
  `constructionId` INT NOT NULL,
  `assignedAt` TIMESTAMP NOT NULL,
  `returnedAt` TIMESTAMP,
  `assignedBy` INT NOT NULL,
  `returnCondition` ENUM('excellent', 'good', 'fair', 'poor', 'damaged'),
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `toolId_idx` (`toolId`),
  INDEX `workerIdIdx` (`workerId`),
  INDEX `constructionId_idx` (`constructionId`)
);

CREATE TABLE IF NOT EXISTS `siteToolMaintenance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `toolId` INT NOT NULL,
  `type` ENUM('preventive', 'corrective', 'replacement') NOT NULL,
  `description` TEXT NOT NULL,
  `cost` DECIMAL(10, 2),
  `requestedBy` INT,
  `performedBy` VARCHAR(255),
  `status` ENUM('requested', 'in_progress', 'completed', 'cancelled') DEFAULT 'requested' NOT NULL,
  `requestedAt` TIMESTAMP NOT NULL,
  `completedAt` TIMESTAMP,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `toolId_idx` (`toolId`),
  INDEX `status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `siteWorkPhotos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT NOT NULL,
  `uploadedBy` INT NOT NULL,
  `uploaderType` ENUM('worker', 'subcontractor', 'director', 'inspector', 'safety') NOT NULL,
  `photoUrl` VARCHAR(500) NOT NULL,
  `description` TEXT,
  `location` VARCHAR(255),
  `tags` TEXT,
  `date` DATE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `uploadedBy_idx` (`uploadedBy`),
  INDEX `date_idx` (`date`)
);

CREATE TABLE IF NOT EXISTS `siteIncidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT NOT NULL,
  `reportedBy` INT NOT NULL,
  `type` ENUM('safety', 'quality', 'delay', 'damage', 'theft', 'other') NOT NULL,
  `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `location` VARCHAR(255),
  `photos` TEXT,
  `status` ENUM('open', 'investigating', 'resolved', 'closed') DEFAULT 'open' NOT NULL,
  `resolvedBy` INT,
  `resolvedAt` TIMESTAMP,
  `resolution` TEXT,
  `date` TIMESTAMP NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `reportedBy_idx` (`reportedBy`),
  INDEX `status_idx` (`status`),
  INDEX `date_idx` (`date`)
);

CREATE TABLE IF NOT EXISTS `siteSubcontractors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT NOT NULL,
  `companyName` VARCHAR(255) NOT NULL,
  `contactPerson` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255),
  `nif` VARCHAR(50),
  `specialty` VARCHAR(255) NOT NULL,
  `contractValue` DECIMAL(12, 2),
  `startDate` DATE,
  `endDate` DATE,
  `status` ENUM('active', 'inactive', 'completed') DEFAULT 'active' NOT NULL,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `siteSubcontractorWork` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `subcontractorId` INT NOT NULL,
  `constructionId` INT NOT NULL,
  `date` DATE NOT NULL,
  `workDescription` TEXT NOT NULL,
  `teamSize` INT,
  `hoursWorked` DECIMAL(5, 2),
  `progress` DECIMAL(5, 2),
  `photos` TEXT,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' NOT NULL,
  `approvedBy` INT,
  `approvedAt` TIMESTAMP,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `subcontractorId_idx` (`subcontractorId`),
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `date_idx` (`date`)
);

CREATE TABLE IF NOT EXISTS `siteVisits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT NOT NULL,
  `visitedBy` INT NOT NULL,
  `visitorType` ENUM('director', 'inspector', 'client', 'architect', 'engineer') NOT NULL,
  `date` TIMESTAMP NOT NULL,
  `duration` INT,
  `purpose` TEXT,
  `observations` TEXT,
  `photos` TEXT,
  `attendees` TEXT,
  `reportGenerated` BOOLEAN DEFAULT FALSE NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `visitedBy_idx` (`visitedBy`),
  INDEX `date_idx` (`date`)
);

CREATE TABLE IF NOT EXISTS `siteNonCompliances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT NOT NULL,
  `reportedBy` INT NOT NULL,
  `reporterType` ENUM('director', 'inspector', 'safety', 'quality') NOT NULL,
  `type` ENUM('quality', 'safety', 'environmental', 'contractual', 'other') NOT NULL,
  `severity` ENUM('minor', 'major', 'critical') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `location` VARCHAR(255),
  `responsibleParty` VARCHAR(255),
  `photos` TEXT,
  `correctiveAction` TEXT,
  `deadline` DATE,
  `status` ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open' NOT NULL,
  `resolvedBy` INT,
  `resolvedAt` TIMESTAMP,
  `verifiedBy` INT,
  `verifiedAt` TIMESTAMP,
  `reportGenerated` BOOLEAN DEFAULT FALSE NOT NULL,
  `reportUrl` VARCHAR(500),
  `date` TIMESTAMP NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `reportedBy_idx` (`reportedBy`),
  INDEX `status_idx` (`status`),
  INDEX `date_idx` (`date`)
);

CREATE TABLE IF NOT EXISTS `siteQuantityMap` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT NOT NULL,
  `category` VARCHAR(255) NOT NULL,
  `item` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `unit` VARCHAR(50) NOT NULL,
  `plannedQuantity` DECIMAL(12, 2) NOT NULL,
  `currentQuantity` DECIMAL(12, 2) DEFAULT 0 NOT NULL,
  `unitPrice` DECIMAL(10, 2),
  `order` INT DEFAULT 0 NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `category_idx` (`category`)
);

CREATE TABLE IF NOT EXISTS `siteQuantityProgress` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `quantityMapId` INT NOT NULL,
  `constructionId` INT NOT NULL,
  `updatedBy` INT NOT NULL,
  `date` DATE NOT NULL,
  `quantity` DECIMAL(12, 2) NOT NULL,
  `notes` TEXT,
  `photos` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `quantityMapId_idx` (`quantityMapId`),
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `date_idx` (`date`)
);

CREATE TABLE IF NOT EXISTS `siteSafetyAudits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT NOT NULL,
  `auditedBy` INT NOT NULL,
  `date` TIMESTAMP NOT NULL,
  `type` ENUM('routine', 'special', 'incident_followup') NOT NULL,
  `checklist` TEXT,
  `findings` TEXT,
  `nonCompliances` TEXT,
  `recommendations` TEXT,
  `photos` TEXT,
  `score` INT,
  `status` ENUM('draft', 'completed', 'approved') DEFAULT 'draft' NOT NULL,
  `reportGenerated` BOOLEAN DEFAULT FALSE NOT NULL,
  `reportUrl` VARCHAR(500),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `auditedBy_idx` (`auditedBy`),
  INDEX `date_idx` (`date`)
);

CREATE TABLE IF NOT EXISTS `siteSafetyIncidents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT NOT NULL,
  `reportedBy` INT NOT NULL,
  `date` TIMESTAMP NOT NULL,
  `type` ENUM('accident', 'near_miss', 'unsafe_condition', 'unsafe_act') NOT NULL,
  `severity` ENUM('minor', 'moderate', 'serious', 'fatal') NOT NULL,
  `injuredPerson` VARCHAR(255),
  `injuryType` VARCHAR(255),
  `bodyPart` VARCHAR(255),
  `description` TEXT NOT NULL,
  `location` VARCHAR(255),
  `witnesses` TEXT,
  `immediateAction` TEXT,
  `rootCause` TEXT,
  `correctiveAction` TEXT,
  `preventiveAction` TEXT,
  `photos` TEXT,
  `medicalAttention` BOOLEAN DEFAULT FALSE NOT NULL,
  `workDaysLost` INT DEFAULT 0 NOT NULL,
  `status` ENUM('reported', 'investigating', 'closed') DEFAULT 'reported' NOT NULL,
  `investigatedBy` INT,
  `investigatedAt` TIMESTAMP,
  `reportGenerated` BOOLEAN DEFAULT FALSE NOT NULL,
  `reportUrl` VARCHAR(500),
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `reportedBy_idx` (`reportedBy`),
  INDEX `date_idx` (`date`),
  INDEX `status_idx` (`status`)
);

CREATE TABLE IF NOT EXISTS `sitePPE` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `constructionId` INT,
  `type` VARCHAR(100) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(100),
  `size` VARCHAR(50),
  `quantity` INT NOT NULL,
  `minQuantity` INT DEFAULT 0 NOT NULL,
  `assignedTo` INT,
  `assignedAt` TIMESTAMP,
  `expiryDate` DATE,
  `status` ENUM('available', 'assigned', 'expired', 'damaged') DEFAULT 'available' NOT NULL,
  `notes` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `constructionId_idx` (`constructionId`),
  INDEX `assignedTo_idx` (`assignedTo`),
  INDEX `status_idx` (`status`)
);
