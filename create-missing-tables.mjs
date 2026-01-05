#!/usr/bin/env node
import { createPool } from 'mysql2/promise';
import { readFileSync } from 'fs';

async function createTables() {
  try {
    console.log('🔄 Reading DATABASE_URL...');
    const envFile = readFileSync('.env', 'utf-8');
    const dbUrl = envFile.match(/DATABASE_URL="(.+)"/)?.[1];
    
    if (!dbUrl) {
      throw new Error('DATABASE_URL not found in .env');
    }

    console.log('📊 Connecting to database...');
    const pool = createPool(dbUrl);

    // Check if notifications table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'notifications'");
    
    if (tables.length === 0) {
      console.log('📝 Creating notifications table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          type VARCHAR(50) NOT NULL,
          priority VARCHAR(20) NOT NULL DEFAULT 'normal',
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          link VARCHAR(512),
          projectId INT,
          taskId INT,
          isRead BOOLEAN NOT NULL DEFAULT FALSE,
          readAt TIMESTAMP NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX userId_idx (userId),
          INDEX isRead_idx (isRead),
          INDEX createdAt_idx (createdAt)
        )
      `);
      console.log('✅ notifications table created!');
    } else {
      console.log('✓ notifications table already exists');
    }

    // Check if clientProjects table exists
    const [clientProjectsTables] = await pool.query("SHOW TABLES LIKE 'clientProjects'");
    
    if (clientProjectsTables.length === 0) {
      console.log('📝 Creating clientProjects table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clientProjects (
          id INT AUTO_INCREMENT PRIMARY KEY,
          clientId INT NOT NULL,
          projectId INT NOT NULL,
          accessLevel ENUM('view', 'comment', 'approve') NOT NULL DEFAULT 'view',
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX clientId_idx (clientId),
          INDEX projectId_idx (projectId),
          INDEX clientProject_idx (clientId, projectId)
        )
      `);
      console.log('✅ clientProjects table created!');
    } else {
      console.log('✓ clientProjects table already exists');
    }

    // Check if clientMessages table exists
    const [clientMessagesTables] = await pool.query("SHOW TABLES LIKE 'clientMessages'");
    
    if (clientMessagesTables.length === 0) {
      console.log('📝 Creating clientMessages table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clientMessages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          projectId INT NOT NULL,
          senderId INT NOT NULL,
          message TEXT NOT NULL,
          attachmentUrl VARCHAR(512),
          isRead BOOLEAN NOT NULL DEFAULT FALSE,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX projectId_idx (projectId),
          INDEX senderId_idx (senderId),
          INDEX createdAt_idx (createdAt)
        )
      `);
      console.log('✅ clientMessages table created!');
    } else {
      console.log('✓ clientMessages table already exists');
    }

    // Check if clientDocuments table exists
    const [clientDocumentsTables] = await pool.query("SHOW TABLES LIKE 'clientDocuments'");
    
    if (clientDocumentsTables.length === 0) {
      console.log('📝 Creating clientDocuments table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS clientDocuments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          projectId INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          fileUrl VARCHAR(512) NOT NULL,
          fileKey VARCHAR(512) NOT NULL,
          fileType VARCHAR(50) NOT NULL,
          fileSize INT,
          version INT NOT NULL DEFAULT 1,
          uploadedBy INT NOT NULL,
          uploadedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX projectId_idx (projectId),
          INDEX uploadedBy_idx (uploadedBy),
          INDEX fileType_idx (fileType)
        )
      `);
      console.log('✅ clientDocuments table created!');
    } else {
      console.log('✓ clientDocuments table already exists');
    }

    await pool.end();
    console.log('\n✅ All tables checked/created successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTables();
