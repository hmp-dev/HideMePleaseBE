const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserWallet() {
  try {
    const userId = '0x49Ec4da0F14BC9315FDf7B27e4FCE209A8B9d95B';
    
    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true
      }
    });
    
    console.log('\n=== 사용자 정보 ===');
    if (user) {
      console.log('User ID:', user.id);
      console.log('Username:', user.username || 'N/A');
      console.log('Email:', user.email || 'N/A');
      console.log('Created:', user.createdAt);
    } else {
      console.log('❌ 사용자를 찾을 수 없습니다.');
    }
    
    // 지갑 정보 확인
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        publicAddress: true,
        createdAt: true
      }
    });
    
    console.log('\n=== 지갑 정보 ===');
    console.log('총 지갑 수:', wallets.length);
    
    if (wallets.length > 0) {
      wallets.forEach((wallet, index) => {
        console.log(`\n지갑 ${index + 1}:`);
        console.log('  Provider:', wallet.provider);
        console.log('  Address:', wallet.publicAddress);
        console.log('  Created:', wallet.createdAt);
      });
      
      // KLIP 또는 WEPIN_EVM 지갑 확인
      const klipWallet = wallets.find(w => w.provider === 'KLIP');
      const wepinWallet = wallets.find(w => w.provider === 'WEPIN_EVM');
      
      console.log('\n=== NFT 수령 가능 지갑 ===');
      console.log('KLIP 지갑:', klipWallet ? '✅ 있음' : '❌ 없음');
      console.log('WEPIN_EVM 지갑:', wepinWallet ? '✅ 있음' : '❌ 없음');
      
      if (!klipWallet && !wepinWallet) {
        console.log('\n⚠️ KLIP_WALLET_MISSING 에러 발생 원인:');
        console.log('사용자가 KLIP 또는 WEPIN_EVM 지갑이 없어서 웰컴 NFT를 받을 수 없습니다.');
      }
    } else {
      console.log('❌ 등록된 지갑이 없습니다.');
    }
    
    // SystemNft 확인
    const systemNfts = await prisma.systemNft.findMany({
      where: { userId },
      select: {
        tokenAddress: true,
        tokenId: true,
        name: true,
        createdAt: true
      }
    });
    
    console.log('\n=== 보유 System NFT ===');
    console.log('총 NFT 수:', systemNfts.length);
    if (systemNfts.length > 0) {
      systemNfts.forEach((nft, index) => {
        console.log(`\nNFT ${index + 1}:`);
        console.log('  Name:', nft.name || 'N/A');
        console.log('  Token Address:', nft.tokenAddress);
        console.log('  Token ID:', nft.tokenId);
      });
    }
    
    // 전체 Wallet Provider 타입 확인
    const allProviders = await prisma.$queryRaw`
      SELECT DISTINCT provider, COUNT(*) as count 
      FROM "Wallet" 
      GROUP BY provider 
      ORDER BY count DESC
    `;
    
    console.log('\n=== 전체 Wallet Provider 통계 ===');
    console.log(allProviders);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserWallet();