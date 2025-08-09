const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Hidemeplease!!1@hmp2024.cakclrq2opqj.ap-northeast-2.rds.amazonaws.com:5432/hidemeplease'
    }
  }
});

async function debugUser() {
  try {
    const userId = '7eaa002d-3991-491b-bca0-d2133683d582';
    
    // Direct SQL query to check User
    const userBySQL = await prisma.$queryRaw`
      SELECT id, "nickName", "createdAt", deleted 
      FROM "User" 
      WHERE id = ${userId}::uuid
    `;
    
    console.log('User found by SQL:', userBySQL);
    
    // Check if user is soft deleted
    const userWithDeleted = await prisma.user.findFirst({
      where: { 
        id: userId,
        deleted: false
      }
    });
    
    if (userWithDeleted) {
      console.log('\n✅ User is NOT deleted');
    } else {
      console.log('\n⚠️  User might be deleted or not found');
      
      // Check with deleted = true
      const deletedUser = await prisma.user.findFirst({
        where: { 
          id: userId,
          deleted: true
        }
      });
      
      if (deletedUser) {
        console.log('❌ User is marked as deleted!');
      }
    }
    
    // Check foreign key constraint
    const fkInfo = await prisma.$queryRaw`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname = 'SpaceBenefitUsage_userId_fkey'
    `;
    
    console.log('\nForeign Key Constraint:', fkInfo);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUser();