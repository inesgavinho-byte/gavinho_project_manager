import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Add columns one by one to budgets table
  await connection.execute(`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS name VARCHAR(255) NOT NULL DEFAULT ''`);
  await connection.execute(`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS status ENUM('draft', 'approved', 'active', 'closed') NOT NULL DEFAULT 'draft'`);
  await connection.execute(`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS startDate TIMESTAMP NULL`);
  await connection.execute(`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS endDate TIMESTAMP NULL`);
  await connection.execute(`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS createdById INT NOT NULL DEFAULT 1`);
  await connection.execute(`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS approvedById INT NULL`);
  await connection.execute(`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS approvedAt TIMESTAMP NULL`);
  
  // Create budgetItems table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS budgetItems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      budgetId INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
      unitPrice DECIMAL(15, 2) NOT NULL,
      totalPrice DECIMAL(15, 2) NOT NULL,
      unit VARCHAR(50),
      notes TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX budgetId_idx (budgetId),
      FOREIGN KEY (budgetId) REFERENCES budgets(id) ON DELETE CASCADE
    )
  `);
  
  // Create expenses table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL,
      budgetId INT,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      amount DECIMAL(15, 2) NOT NULL,
      expenseDate TIMESTAMP NOT NULL,
      supplier VARCHAR(255),
      invoiceNumber VARCHAR(100),
      paymentStatus ENUM('pending', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
      paymentDate TIMESTAMP NULL,
      receiptUrl TEXT,
      receiptKey TEXT,
      notes TEXT,
      createdById INT NOT NULL,
      approvedById INT,
      approvedAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX projectId_idx (projectId),
      INDEX budgetId_idx (budgetId),
      INDEX expenseDate_idx (expenseDate),
      INDEX paymentStatus_idx (paymentStatus),
      FOREIGN KEY (projectId) REFERENCES projects(id),
      FOREIGN KEY (budgetId) REFERENCES budgets(id),
      FOREIGN KEY (createdById) REFERENCES users(id),
      FOREIGN KEY (approvedById) REFERENCES users(id)
    )
  `);
  
  // Create budgetAlerts table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS budgetAlerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      budgetId INT NOT NULL,
      alertType ENUM('warning', 'critical', 'exceeded') NOT NULL,
      threshold INT NOT NULL,
      currentPercentage INT NOT NULL,
      message TEXT NOT NULL,
      isRead BOOLEAN NOT NULL DEFAULT FALSE,
      readById INT,
      readAt TIMESTAMP NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX budgetId_idx (budgetId),
      INDEX alertType_idx (alertType),
      INDEX isRead_idx (isRead),
      FOREIGN KEY (budgetId) REFERENCES budgets(id) ON DELETE CASCADE,
      FOREIGN KEY (readById) REFERENCES users(id)
    )
  `);
  
  console.log('✅ Schema de orçamentos aplicado com sucesso!');
} catch (error) {
  console.error('❌ Erro:', error.message);
} finally {
  await connection.end();
}
