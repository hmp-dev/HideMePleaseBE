const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Hidemeplease!!1@hmp2024.cakclrq2opqj.ap-northeast-2.rds.amazonaws.com:5432/hidemeplease'
    }
  }
});

async function fixAllUser2References() {
  try {
    console.log('🔧 Fixing all User2 references to point to User table...\n');
    
    const tablesToFix = [
      { table: 'NftCollectionMemberPoints', constraint: 'NftCollectionMemberPoints_userId_fkey' },
      { table: 'Notification', constraint: 'Notification_userId_fkey' },
      { table: 'ScheduleNotification', constraint: 'ScheduleNotification_userId_fkey' },
      { table: 'SpaceUser', constraint: 'SpaceUser_userId_fkey' },
      { table: 'SystemNft', constraint: 'SystemNft_userId_fkey' },
      { table: 'UserLastKnownSpace', constraint: 'UserLastKnownSpace_userId_fkey' },
      { table: 'Wallet', constraint: 'Wallet_userId_fkey' }
    ];
    
    for (const { table, constraint } of tablesToFix) {
      try {
        console.log(`📋 Fixing ${table}...`);
        
        // Drop the incorrect constraint
        const dropQuery = `ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}"`;
        await prisma.$executeRawUnsafe(dropQuery);
        
        // Add the correct constraint  
        const addQuery = `ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
        await prisma.$executeRawUnsafe(addQuery);
        
        console.log(`✅ Fixed ${table}\n`);
      } catch (error) {
        console.error(`❌ Error fixing ${table}: ${error.message}\n`);
      }
    }
    
    // Verify all fixes
    console.log('📋 Verifying all fixes...\n');
    const user2Constraints = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass::text AS table_name
      FROM pg_constraint
      WHERE pg_get_constraintdef(oid) LIKE '%User2%'
    `;
    
    if (user2Constraints.length === 0) {
      console.log('✅ All User2 references have been fixed!');
    } else {
      console.log(`⚠️  Still ${user2Constraints.length} constraints reference User2:`);
      user2Constraints.forEach(c => {
        console.log(`  - ${c.table_name}: ${c.constraint_name}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllUser2References();