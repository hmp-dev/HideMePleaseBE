const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Hidemeplease!!1@hmp2024.cakclrq2opqj.ap-northeast-2.rds.amazonaws.com:5432/hidemeplease'
    }
  }
});

async function checkForeignKeys() {
  try {
    const userId = '7eaa002d-3991-491b-bca0-d2133683d582';
    const benefitId = '82346662-aa9a-430f-a87b-fe9b24e3476b';
    const tokenAddress = '0x49Ec4da0F14BC9315FDf7B27e4FCE209A8B9d95B';
    
    console.log('Checking all foreign keys for SpaceBenefitUsage creation...\n');
    
    // Try to create SpaceBenefitUsage
    try {
      const usage = await prisma.spaceBenefitUsage.create({
        data: {
          benefitId: benefitId,
          userId: userId,
          tokenAddress: tokenAddress,
          pointsEarned: 1
        }
      });
      console.log('✅ Successfully created SpaceBenefitUsage:', usage.id);
    } catch (error) {
      console.log('❌ Failed to create SpaceBenefitUsage:');
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      
      // Check which foreign key is failing
      if (error.message.includes('userId')) {
        console.log('\n⚠️  Issue is with userId foreign key');
        
        // Check User table structure
        const userCheck = await prisma.$queryRaw`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'User' 
          AND column_name = 'id'
        `;
        console.log('User.id column info:', userCheck);
      }
      
      if (error.message.includes('tokenAddress')) {
        console.log('\n⚠️  Issue is with tokenAddress foreign key');
      }
      
      if (error.message.includes('benefitId')) {
        console.log('\n⚠️  Issue is with benefitId foreign key');
      }
      
      // Check existing SpaceBenefitUsage records
      const existingUsage = await prisma.spaceBenefitUsage.findMany({
        take: 1,
        select: {
          userId: true,
          benefitId: true,
          tokenAddress: true
        }
      });
      
      if (existingUsage.length > 0) {
        console.log('\n📋 Example of existing SpaceBenefitUsage:', existingUsage[0]);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkForeignKeys();