import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function addDependenciesColumn() {
  let connection;
  
  try {
    // Parse DATABASE_URL
    const url = new URL(DATABASE_URL);
    const config = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: true }
    };

    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected!');

    // Check if column exists
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'projectMilestones' AND COLUMN_NAME = 'dependencies'`,
      [config.database]
    );

    if (columns.length > 0) {
      console.log('✅ Column dependencies already exists');
      return;
    }

    // Add column
    console.log('📝 Adding dependencies column...');
    await connection.query(
      `ALTER TABLE projectMilestones ADD COLUMN dependencies JSON DEFAULT NULL`
    );
    
    console.log('✅ Column dependencies added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addDependenciesColumn();
