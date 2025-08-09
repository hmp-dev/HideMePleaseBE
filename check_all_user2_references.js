const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Hidemeplease!!1@hmp2024.cakclrq2opqj.ap-northeast-2.rds.amazonaws.com:5432/hidemeplease'
    }
  }
});

async function checkUser2References() {
  try {
    console.log('🔍 Checking all foreign key constraints that reference User2 table...\n');
    
    // Find all foreign key constraints that reference User2
    const user2Constraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass::text AS table_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE pg_get_constraintdef(oid) LIKE '%User2%'
      ORDER BY conrelid::regclass::text
    `;
    
    if (user2Constraints.length === 0) {
      console.log('✅ No foreign key constraints reference User2 table');
    } else {
      console.log(`⚠️  Found ${user2Constraints.length} foreign key constraints referencing User2:\n`);
      
      user2Constraints.forEach((constraint, index) => {
        console.log(`${index + 1}. Table: ${constraint.table_name}`);
        console.log(`   Constraint: ${constraint.constraint_name}`);
        console.log(`   Definition: ${constraint.constraint_definition}`);
        console.log('');
      });
    }
    
    // Also check if User2 table exists
    console.log('📋 Checking if User2 table exists...');
    const user2Table = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'User2'
    `;
    
    if (user2Table.length > 0) {
      console.log('⚠️  User2 table exists in the database');
      
      // Count records in User2
      const user2Count = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "User2"
      `;
      console.log(`   Records in User2: ${user2Count[0].count}`);
    } else {
      console.log('✅ User2 table does not exist');
    }
    
    // Check all foreign keys that should reference User table
    console.log('\n📋 Checking all tables that should reference User table...');
    const userConstraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass::text AS table_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname LIKE '%userId%' 
      OR conname LIKE '%user_fkey%'
      ORDER BY conrelid::regclass::text
    `;
    
    console.log(`Found ${userConstraints.length} constraints with userId or user_fkey:\n`);
    
    const problematicConstraints = userConstraints.filter(c => 
      c.constraint_definition.includes('User2')
    );
    
    if (problematicConstraints.length > 0) {
      console.log('❌ Constraints that incorrectly reference User2:');
      problematicConstraints.forEach(c => {
        console.log(`  - ${c.table_name}: ${c.constraint_name}`);
      });
    } else {
      console.log('✅ All userId constraints correctly reference User table');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser2References();