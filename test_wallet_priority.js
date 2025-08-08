const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock wallet data for testing
const testCases = [
  {
    name: "User with WEPIN_EVM wallet",
    wallets: [
      { provider: 'METAMASK', publicAddress: '0xMETAMASK' },
      { provider: 'WEPIN_EVM', publicAddress: '0xWEPIN' },
      { provider: 'KLIP', publicAddress: '0xKLIP' }
    ],
    expected: '0xWEPIN'
  },
  {
    name: "User with only KLIP wallet",
    wallets: [
      { provider: 'KLIP', publicAddress: '0xKLIP' }
    ],
    expected: '0xKLIP'
  },
  {
    name: "User with METAMASK and WALLET_CONNECT",
    wallets: [
      { provider: 'WALLET_CONNECT', publicAddress: '0xWC' },
      { provider: 'METAMASK', publicAddress: '0xMETAMASK' }
    ],
    expected: '0xMETAMASK'
  },
  {
    name: "User with only PHANTOM wallet",
    wallets: [
      { provider: 'PHANTOM', publicAddress: '0xPHANTOM' }
    ],
    expected: '0xPHANTOM'
  },
  {
    name: "User with no wallets",
    wallets: [],
    expected: 'ERROR'
  }
];

// Simulate the getFreeNftWalletAddress function logic
function getFreeNftWalletAddress(wallets) {
  // Priority 1: WEPIN_EVM
  const wepinWallet = wallets.find(w => w.provider === 'WEPIN_EVM');
  if (wepinWallet) return wepinWallet.publicAddress;
  
  // Priority 2: KLIP
  const klipWallet = wallets.find(w => w.provider === 'KLIP');
  if (klipWallet) return klipWallet.publicAddress;
  
  // Priority 3: METAMASK
  const metamaskWallet = wallets.find(w => w.provider === 'METAMASK');
  if (metamaskWallet) return metamaskWallet.publicAddress;
  
  // Priority 4: WALLET_CONNECT
  const walletConnectWallet = wallets.find(w => w.provider === 'WALLET_CONNECT');
  if (walletConnectWallet) return walletConnectWallet.publicAddress;
  
  // Priority 5: Any other wallet
  if (wallets.length > 0) return wallets[0].publicAddress;
  
  return 'ERROR';
}

console.log('\n=== Wallet Priority Test ===\n');
console.log('Priority Order: WEPIN_EVM > KLIP > METAMASK > WALLET_CONNECT > Others\n');

testCases.forEach(test => {
  const result = getFreeNftWalletAddress(test.wallets);
  const passed = result === test.expected;
  
  console.log(`Test: ${test.name}`);
  console.log(`  Wallets: ${test.wallets.map(w => w.provider).join(', ') || 'None'}`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Result: ${result}`);
  console.log(`  Status: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

// Check actual database statistics
async function checkActualStats() {
  try {
    const stats = await prisma.$queryRaw`
      SELECT provider, COUNT(*) as count 
      FROM "Wallet" 
      GROUP BY provider 
      ORDER BY count DESC
    `;
    
    console.log('=== Current Database Wallet Statistics ===\n');
    stats.forEach(stat => {
      console.log(`${stat.provider}: ${stat.count} wallets`);
    });
    
    // Check users without any wallet
    const usersWithoutWallet = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT u.id) as count
      FROM "User" u
      LEFT JOIN "Wallet" w ON u.id = w."userId"
      WHERE w."userId" IS NULL
    `;
    
    console.log(`\nUsers without any wallet: ${usersWithoutWallet[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkActualStats();