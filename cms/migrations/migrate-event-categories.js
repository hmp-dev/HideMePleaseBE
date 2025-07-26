const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 환경변수 또는 직접 설정
const connectionConfig = {
  host: process.env.DB_HOST || 'your-production-db-host',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE || 'your-database-name',
  user: process.env.DB_USER || 'your-username',
  password: process.env.DB_PASSWORD || 'your-password',
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
};

async function runMigration() {
  const client = new Client(connectionConfig);
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Reading migration file...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '001_add_event_categories.sql'), 
      'utf8'
    );
    
    console.log('Running migration...');
    await client.query(migrationSQL);
    
    console.log('Migration completed successfully!');
    
    // Verify tables were created
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('EventCategory', 'SpaceEventCategory')
    `);
    
    console.log('Created tables:', tableCheck.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

async function rollback() {
  const client = new Client(connectionConfig);
  
  try {
    console.log('Connecting to database for rollback...');
    await client.connect();
    
    console.log('Reading rollback file...');
    const rollbackSQL = fs.readFileSync(
      path.join(__dirname, '001_rollback_event_categories.sql'), 
      'utf8'
    );
    
    console.log('Running rollback...');
    await client.query(rollbackSQL);
    
    console.log('Rollback completed successfully!');
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Command line argument handling
const command = process.argv[2];

if (command === 'rollback') {
  rollback().catch(console.error);
} else if (command === 'migrate' || !command) {
  runMigration().catch(console.error);
} else {
  console.log('Usage: node migrate-event-categories.js [migrate|rollback]');
  process.exit(1);
}