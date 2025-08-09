const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Hidemeplease!!1@hmp2024.cakclrq2opqj.ap-northeast-2.rds.amazonaws.com:5432/hidemeplease'
    }
  }
});

async function checkAndResetNft() {
  try {
    const userId = '7eaa002d-3991-491b-bca0-d2133683d582';
    const tokenAddress = '0x49Ec4da0F14BC9315FDf7B27e4FCE209A8B9d95B';
    
    console.log('🔍 Checking SystemNft claims...\n');
    
    // Check existing claims
    const existingClaims = await prisma.systemNft.findMany({
      where: {
        userId: userId,
        tokenAddress: tokenAddress
      },
      select: {
        id: true,
        tokenId: true,
        name: true,
        createdAt: true
      }
    });
    
    if (existingClaims.length > 0) {
      console.log(`Found ${existingClaims.length} existing claim(s):`);
      existingClaims.forEach(claim => {
        console.log(`  - ID: ${claim.id}`);
        console.log(`    Token ID: ${claim.tokenId}`);
        console.log(`    Name: ${claim.name}`);
        console.log(`    Claimed at: ${claim.createdAt}\n`);
      });
      
      console.log('Would you like to delete this claim for testing? (This will allow claiming again)');
      console.log('\nTo delete, run: node check_and_reset_nft.js --delete\n');
      
      // Check if --delete flag was passed
      if (process.argv.includes('--delete')) {
        console.log('🗑️  Deleting existing claims...');
        
        for (const claim of existingClaims) {
          await prisma.systemNft.delete({
            where: { id: claim.id }
          });
          console.log(`  ✅ Deleted claim: ${claim.id}`);
        }
        
        console.log('\n✅ Claims deleted. You can now test the welcome NFT endpoint again!');
      }
    } else {
      console.log('✅ No existing claims found. User can claim the NFT.');
    }
    
    // Check SystemNftCollection status
    const systemNftCollection = await prisma.systemNftCollection.findFirst({
      where: {
        tokenAddress: tokenAddress
      },
      select: {
        lastMintedTokenId: true,
        maxMintedTokens: true,
        name: true
      }
    });
    
    if (systemNftCollection) {
      console.log(`\n📊 SystemNftCollection status:`);
      console.log(`  Name: ${systemNftCollection.name}`);
      console.log(`  Minted: ${systemNftCollection.lastMintedTokenId}/${systemNftCollection.maxMintedTokens}`);
      console.log(`  Available: ${systemNftCollection.maxMintedTokens - systemNftCollection.lastMintedTokenId}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndResetNft();