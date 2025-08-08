const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWalletIssue() {
  try {
    // JWT에서 파싱된 실제 userId
    const userId = '439d2128-2262-4ad6-9124-e0cd12789661';
    
    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickName: true,
        email: true,
        createdAt: true,
        loginType: true
      }
    });
    
    console.log('\n=== 사용자 정보 ===');
    if (user) {
      console.log('User ID:', user.id);
      console.log('Nickname:', user.nickName || 'N/A');
      console.log('Email:', user.email || 'N/A');
      console.log('Login Type:', user.loginType);
      console.log('Created:', user.createdAt);
    } else {
      console.log('❌ 사용자를 찾을 수 없습니다.');
      return;
    }
    
    // 지갑 정보 확인
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: {
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
      
      console.log('\n=== NFT 수령 가능 지갑 상태 ===');
      console.log('KLIP 지갑:', klipWallet ? `✅ 있음 (${klipWallet.publicAddress})` : '❌ 없음');
      console.log('WEPIN_EVM 지갑:', wepinWallet ? `✅ 있음 (${wepinWallet.publicAddress})` : '❌ 없음');
      
      if (!klipWallet && !wepinWallet) {
        console.log('\n⚠️ KLIP_WALLET_MISSING 에러 발생 원인:');
        console.log('사용자가 KLIP 또는 WEPIN_EVM 지갑이 없어서 웰컴 NFT를 받을 수 없습니다.');
        console.log('\n해결 방법:');
        console.log('1. 사용자가 KLIP 지갑을 연결해야 합니다.');
        console.log('2. 또는 WEPIN_EVM 지갑을 연결해야 합니다.');
        console.log('\n현재 사용자의 지갑 Provider:', wallets.map(w => w.provider).join(', '));
      } else {
        console.log('\n✅ NFT 수령 가능한 지갑이 있습니다.');
      }
    } else {
      console.log('❌ 등록된 지갑이 없습니다.');
      console.log('\n⚠️ KLIP_WALLET_MISSING 에러 발생 원인:');
      console.log('사용자가 아무런 지갑도 연결하지 않았습니다.');
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
    
    // WalletProvider enum 값 확인
    console.log('\n=== WalletProvider Enum 값 ===');
    const enumQuery = await prisma.$queryRaw`
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'WalletProvider')
      ORDER BY enumsortorder
    `;
    console.log('가능한 Provider 값들:', enumQuery.map(e => e.enumlabel).join(', '));
    
    // 전체 Wallet Provider 통계
    const stats = await prisma.$queryRaw`
      SELECT provider, COUNT(*) as count 
      FROM "Wallet" 
      GROUP BY provider 
      ORDER BY count DESC
    `;
    
    console.log('\n=== 전체 Wallet Provider 통계 ===');
    stats.forEach(stat => {
      console.log(`${stat.provider}: ${stat.count}개`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkWalletIssue();