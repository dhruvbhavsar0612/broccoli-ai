import { Pool } from 'pg';

// Admin connection to check/create database
async function checkAndCreateDatabase(): Promise<void> {
  const adminConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // Connect to default postgres database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin',
  };

  const dbName = process.env.DB_NAME || 'voice-agent-db';
  const adminPool = new Pool(adminConfig);

  try {
    // Check if database exists
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (result.rows.length === 0) {
      // Database doesn't exist, create it
      console.log(`📦 Creating database: ${dbName}...`);
      await adminPool.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully`);
    } else {
      console.log(`✅ Database "${dbName}" already exists`);
    }
  } catch (error) {
    console.error('❌ Error checking/creating database:', error);
    throw error;
  } finally {
    await adminPool.end();
  }
}

export { checkAndCreateDatabase };
