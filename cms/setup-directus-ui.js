const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// .env 파일 읽기
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const lines = envFile.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    });
  } catch (error) {
    console.log('Warning: Could not load .env file:', error.message);
  }
}

loadEnv();

// 데이터베이스 연결 설정
const connectionConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
};

console.log('Database connection config:', {
  host: connectionConfig.host,
  port: connectionConfig.port,
  database: connectionConfig.database,
  user: connectionConfig.user,
  ssl: connectionConfig.ssl
});

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