import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

try {
  // Create clientCompanyProjects table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS clientCompanyProjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      clientId INT NOT NULL,
      projectId INT NOT NULL,
      role VARCHAR(100),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (clientId) REFERENCES suppliers(id) ON DELETE CASCADE,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      INDEX clientCompanyProject_idx (clientId, projectId)
    )
  `);
  
  // Create supplierProjects table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS supplierProjects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      supplierId INT NOT NULL,
      projectId INT NOT NULL,
      category VARCHAR(100),
      totalValue DECIMAL(15, 2),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      INDEX supplierProject_idx (supplierId, projectId)
    )
  `);
  
  console.log('✅ Tabelas criadas com sucesso!');
} catch (error) {
  console.error('❌ Erro:', error.message);
} finally {
  await connection.end();
}
