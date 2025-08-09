const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Hidemeplease!!1@hmp2024.cakclrq2opqj.ap-northeast-2.rds.amazonaws.com:5432/hidemeplease'
    }
  }
});

async function checkNftCollection() {
  try {
    const tokenAddress = '0x49Ec4da0F14BC9315FDf7B27e4FCE209A8B9d95B';
    
    // Check if NftCollection exists
    const nftCollection = await prisma.nftCollection.findFirst({
      where: {
        tokenAddress: tokenAddress
      }
    });
    
    if (nftCollection) {
      console.log('✅ NftCollection found:', nftCollection);
    } else {
      console.log('❌ NftCollection NOT found for tokenAddress:', tokenAddress);
      
      // List all NftCollections
      const allCollections = await prisma.nftCollection.findMany({
        select: {
          tokenAddress: true,
          name: true
        },
        take: 10
      });
      
      console.log('\n📋 Available NftCollections (first 10):');
      allCollections.forEach(col => {
        console.log(`  - ${col.tokenAddress}: ${col.name}`);
      });
    }
    
    // Check User
    const userId = '7eaa002d-3991-491b-bca0-d2133683d582';
    const user = await prisma.user.findFirst({
      where: { id: userId }
    });
    
    if (user) {
      console.log('\n✅ User found:', user.id, user.nickName);
    } else {
      console.log('\n❌ User NOT found for userId:', userId);
    }
    
    // Check SpaceBenefit
    const benefitId = '82346662-aa9a-430f-a87b-fe9b24e3476b';
    const benefit = await prisma.spaceBenefit.findFirst({
      where: { id: benefitId }
    });
    
    if (benefit) {
      console.log('\n✅ SpaceBenefit found:', benefit.id, benefit.name);
    } else {
      console.log('\n❌ SpaceBenefit NOT found for benefitId:', benefitId);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNftCollection();