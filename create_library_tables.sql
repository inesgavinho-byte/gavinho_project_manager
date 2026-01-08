-- Library Tags
CREATE TABLE IF NOT EXISTS `libraryTags` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `category` ENUM('material', 'model', 'inspiration', 'general') NOT NULL DEFAULT 'general',
  `color` VARCHAR(20) DEFAULT '#C9A882',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `libraryTag_category_idx` (`category`)
);

-- Library Materials
CREATE TABLE IF NOT EXISTS `libraryMaterials` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100) NOT NULL,
  `tags` TEXT,
  `imageUrl` TEXT,
  `fileUrl` TEXT,
  `supplier` VARCHAR(255),
  `price` DECIMAL(15, 2),
  `unit` VARCHAR(50),
  `createdById` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `libraryMaterial_category_idx` (`category`),
  INDEX `libraryMaterial_supplier_idx` (`supplier`),
  INDEX `libraryMaterial_createdBy_idx` (`createdById`),
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
);

-- Library 3D Models
CREATE TABLE IF NOT EXISTS `library3DModels` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100) NOT NULL,
  `tags` TEXT,
  `thumbnailUrl` TEXT,
  `modelUrl` TEXT NOT NULL,
  `fileFormat` VARCHAR(50),
  `fileSize` INT,
  `createdById` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `library3DModel_category_idx` (`category`),
  INDEX `library3DModel_fileFormat_idx` (`fileFormat`),
  INDEX `library3DModel_createdBy_idx` (`createdById`),
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
);

-- Library Inspiration
CREATE TABLE IF NOT EXISTS `libraryInspiration` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `tags` TEXT,
  `imageUrl` TEXT NOT NULL,
  `sourceUrl` TEXT,
  `projectId` INT,
  `createdById` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `libraryInspiration_project_idx` (`projectId`),
  INDEX `libraryInspiration_createdBy_idx` (`createdById`),
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`),
  FOREIGN KEY (`createdById`) REFERENCES `users`(`id`)
);
