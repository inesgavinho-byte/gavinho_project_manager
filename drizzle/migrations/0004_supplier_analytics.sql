-- Create supplier transactions table
CREATE TABLE IF NOT EXISTS supplierTransactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplierId INT NOT NULL,
  projectId INT,
  orderId INT,
  type ENUM('purchase', 'payment', 'refund', 'credit') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,
  description TEXT,
  transactionDate TIMESTAMP NOT NULL,
  dueDate TIMESTAMP,
  paidDate TIMESTAMP,
  status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending' NOT NULL,
  createdById INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX supplierId_idx (supplierId),
  INDEX projectId_idx (projectId),
  INDEX status_idx (status),
  INDEX transactionDate_idx (transactionDate)
);

-- Create supplier evaluations table
CREATE TABLE IF NOT EXISTS supplierEvaluations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplierId INT NOT NULL,
  projectId INT,
  orderId INT,
  qualityRating INT NOT NULL,
  deliveryRating INT NOT NULL,
  communicationRating INT NOT NULL,
  priceRating INT NOT NULL,
  overallRating INT NOT NULL,
  comments TEXT,
  wouldRecommend TINYINT(1) DEFAULT 1 NOT NULL,
  evaluatedById INT NOT NULL,
  evaluatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX supplierId_idx (supplierId),
  INDEX projectId_idx (projectId),
  INDEX overallRating_idx (overallRating)
);
