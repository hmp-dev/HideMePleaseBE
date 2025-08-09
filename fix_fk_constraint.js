const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Hidemeplease!!1@hmp2024.cakclrq2opqj.ap-northeast-2.rds.amazonaws.com:5432/hidemeplease'
    }
  }
});

async function fixForeignKey() {
  try {
    console.log('🔧 Fixing SpaceBenefitUsage foreign key constraint...\n');
    
    // 1. Drop the incorrect foreign key
    console.log('1. Dropping incorrect foreign key...');
    await prisma.$executeRaw`
      ALTER TABLE "SpaceBenefitUsage" 
      DROP CONSTRAINT IF EXISTS "SpaceBenefitUsage_userId_fkey"
    `;
    console.log('✅ Dropped old constraint\n');
    
    // 2. Add the correct foreign key
    console.log('2. Adding correct foreign key to User table...');
    await prisma.$executeRaw`
      ALTER TABLE "SpaceBenefitUsage" 
      ADD CONSTRAINT "SpaceBenefitUsage_userId_fkey" 
      FOREIGN KEY ("userId") 
      REFERENCES "User"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `;
    console.log('✅ Added new constraint\n');
    
    // 3. Verify the fix
    console.log('3. Verifying the fix...');
    const result = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname = 'SpaceBenefitUsage_userId_fkey'
    `;
    
    console.log('📋 New constraint definition:', result[0].constraint_definition);
    
    // 4. Test creating SpaceBenefitUsage
    console.log('\n4. Testing SpaceBenefitUsage creation...');
    const testUsage = await prisma.spaceBenefitUsage.create({
      data: {
        benefitId: '82346662-aa9a-430f-a87b-fe9b24e3476b',
        userId: '7eaa002d-3991-491b-bca0-d2133683d582',
        tokenAddress: '0x49Ec4da0F14BC9315FDf7B27e4FCE209A8B9d95B',
        pointsEarned: 1
      }
    });
    
    console.log('✅ Successfully created SpaceBenefitUsage:', testUsage.id);
    console.log('\n🎉 Foreign key constraint fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixForeignKey();