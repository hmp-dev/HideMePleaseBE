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

const connectionConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

async function debugSaveIssue() {
  const client = new Client(connectionConfig);
  
  try {
    console.log('=== Space Event Category 저장 문제 디버깅 ===\n');
    await client.connect();
    
    // 1. Space의 M2M 필드 확인
    console.log('1. Space 컬렉션의 M2M 필드 확인:');
    const spaceFields = await client.query(`
      SELECT field, special, interface, options
      FROM directus_fields
      WHERE collection = 'Space' 
      AND (special = 'm2m' OR field LIKE '%event%' OR field LIKE '%Event%')
    `);
    
    console.log('Found fields:', spaceFields.rows);
    console.log('\n---\n');
    
    // 2. 관계 설정 확인
    console.log('2. 관계 설정 확인:');
    const relations = await client.query(`
      SELECT *
      FROM directus_relations
      WHERE (many_collection = 'SpaceEventCategory' OR one_collection = 'SpaceEventCategory')
         OR (many_collection = 'Space' AND many_field LIKE '%event%')
         OR (one_collection = 'Space' AND one_field LIKE '%event%')
    `);
    
    relations.rows.forEach(rel => {
      console.log(`${rel.many_collection}.${rel.many_field} -> ${rel.one_collection}.${rel.one_field || 'N/A'}`);
      console.log(`Junction field: ${rel.junction_field || 'N/A'}`);
      console.log('---');
    });
    console.log('\n---\n');
    
    // 3. SpaceEventCategory 테이블 데이터
    console.log('3. SpaceEventCategory 테이블 데이터:');
    const junctionData = await client.query(`
      SELECT 
        sec.*,
        s.name as space_name,
        ec.name as event_category_name
      FROM "SpaceEventCategory" sec
      LEFT JOIN "Space" s ON s.id = sec."spaceId"
      LEFT JOIN "EventCategory" ec ON ec.id = sec."eventCategoryId"
      LIMIT 10
    `);
    
    if (junctionData.rows.length === 0) {
      console.log('❌ No data in SpaceEventCategory table!');
    } else {
      console.table(junctionData.rows);
    }
    console.log('\n---\n');
    
    // 4. 권한 확인
    console.log('4. Directus 권한 확인:');
    const permissions = await client.query(`
      SELECT role, collection, action, permissions, fields
      FROM directus_permissions
      WHERE collection IN ('SpaceEventCategory', 'Space', 'EventCategory')
      ORDER BY collection, action
    `);
    
    if (permissions.rows.length === 0) {
      console.log('⚠️  No specific permissions found (using default)');
    } else {
      permissions.rows.forEach(perm => {
        console.log(`${perm.collection} - ${perm.action} (role: ${perm.role || 'public'})`);
      });
    }
    console.log('\n---\n');
    
    // 5. 제안사항
    console.log('5. 문제 해결 제안:');
    console.log('- Directus 재시작: pm2 restart directus');
    console.log('- 브라우저 캐시 지우기');
    console.log('- 개발자 도구에서 Network 탭 확인');
    console.log('- Space 저장 시 전송되는 데이터 확인');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

debugSaveIssue();