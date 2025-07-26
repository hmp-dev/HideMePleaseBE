const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 데이터베이스 연결 설정
const connectionConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
};

async function setupDirectusUI() {
  const client = new Client(connectionConfig);
  
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Setting up Directus UI configuration...');
    
    // Directus UI 설정 SQL 파일 읽기
    const directusSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'directus_only_event_categories.sql'), 
      'utf8'
    );
    
    // SQL 실행
    await client.query(directusSQL);
    
    console.log('Directus UI configuration completed!');
    console.log('\nNext steps:');
    console.log('1. Restart Directus server');
    console.log('2. Login to Directus admin panel');
    console.log('3. Check Content > EventCategory menu');
    console.log('4. Check Space collection for eventCategories field');
    
  } catch (error) {
    console.error('Setup failed:', error);
    console.error('\nTroubleshooting:');
    console.error('- Make sure EventCategory and SpaceEventCategory tables exist in database');
    console.error('- Check database connection settings');
    console.error('- Verify user has INSERT/UPDATE permissions on directus_* tables');
  } finally {
    await client.end();
  }
}

// 실행
setupDirectusUI();