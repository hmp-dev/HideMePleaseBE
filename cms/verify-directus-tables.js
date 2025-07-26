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
  ssl: {
    rejectUnauthorized: false
  }
};

async function verifySetup() {
  const client = new Client(connectionConfig);
  
  try {
    console.log('Connecting to database...\n');
    await client.connect();
    
    // 1. 테이블 존재 확인
    console.log('1. Checking if tables exist:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('EventCategory', 'SpaceEventCategory')
    `);
    console.log('Found tables:', tablesResult.rows.map(r => r.table_name));
    
    // 2. Directus collections 확인
    console.log('\n2. Checking Directus collections:');
    const collectionsResult = await client.query(`
      SELECT collection, icon, hidden 
      FROM directus_collections 
      WHERE collection IN ('EventCategory', 'SpaceEventCategory')
    `);
    
    if (collectionsResult.rows.length === 0) {
      console.log('❌ No Directus collections found! Need to run setup.');
    } else {
      collectionsResult.rows.forEach(row => {
        console.log(`✓ ${row.collection} (icon: ${row.icon}, hidden: ${row.hidden})`);
      });
    }
    
    // 3. Directus fields 확인
    console.log('\n3. Checking Directus fields for EventCategory:');
    const fieldsResult = await client.query(`
      SELECT field, interface, hidden 
      FROM directus_fields 
      WHERE collection = 'EventCategory'
      ORDER BY sort
    `);
    
    if (fieldsResult.rows.length === 0) {
      console.log('❌ No fields found for EventCategory!');
    } else {
      fieldsResult.rows.forEach(row => {
        console.log(`✓ ${row.field} (${row.interface}, hidden: ${row.hidden})`);
      });
    }
    
    // 4. Space의 event categories 필드 확인
    console.log('\n4. Checking Space event categories field:');
    const spaceFieldResult = await client.query(`
      SELECT field, interface, special 
      FROM directus_fields 
      WHERE collection = 'Space' 
      AND field = 'SpaceEventCategory'
    `);
    
    if (spaceFieldResult.rows.length === 0) {
      console.log('❌ SpaceEventCategory field not found in Space collection!');
    } else {
      const field = spaceFieldResult.rows[0];
      console.log(`✓ Found: ${field.field} (${field.interface}, ${field.special})`);
    }
    
    // 5. 관계 설정 확인
    console.log('\n5. Checking relations:');
    const relationsResult = await client.query(`
      SELECT many_collection, many_field, one_collection, junction_field 
      FROM directus_relations 
      WHERE many_collection = 'SpaceEventCategory' 
      OR one_collection IN ('EventCategory', 'SpaceEventCategory')
    `);
    
    if (relationsResult.rows.length === 0) {
      console.log('❌ No relations found!');
    } else {
      relationsResult.rows.forEach(row => {
        console.log(`✓ ${row.many_collection}.${row.many_field} -> ${row.one_collection}`);
      });
    }
    
    // 6. 권한 확인
    console.log('\n6. Checking permissions:');
    const permissionsResult = await client.query(`
      SELECT role, collection, action 
      FROM directus_permissions 
      WHERE collection IN ('EventCategory', 'SpaceEventCategory')
      LIMIT 5
    `);
    
    if (permissionsResult.rows.length === 0) {
      console.log('⚠️  No specific permissions set (using default)');
    } else {
      permissionsResult.rows.forEach(row => {
        console.log(`✓ ${row.collection}: ${row.action} (role: ${row.role || 'public'})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

// 실행
verifySetup();