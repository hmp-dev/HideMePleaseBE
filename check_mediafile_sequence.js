const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:Hidemeplease!!1@hmp2024.cakclrq2opqj.ap-northeast-2.rds.amazonaws.com:5432/hidemeplease'
    }
  }
});

async function checkMediaFileSequence() {
  try {
    console.log('🔍 Checking MediaFile table and sequence...\n');
    
    // Get the maximum ID in MediaFile table
    const maxId = await prisma.$queryRaw`
      SELECT MAX(id) as max_id FROM "MediaFile"
    `;
    console.log(`Maximum ID in MediaFile table: ${maxId[0].max_id}`);
    
    // Get the current sequence value
    const sequenceInfo = await prisma.$queryRaw`
      SELECT last_value, is_called 
      FROM "MediaFile_id_seq"
    `;
    console.log(`Current sequence last_value: ${sequenceInfo[0].last_value}`);
    console.log(`Sequence is_called: ${sequenceInfo[0].is_called}`);
    
    // Calculate next value that will be used
    const lastVal = Number(sequenceInfo[0].last_value);
    const maxIdVal = Number(maxId[0].max_id);
    const nextValue = sequenceInfo[0].is_called ? lastVal + 1 : lastVal;
    console.log(`Next ID that will be generated: ${nextValue}`);
    
    // Check if there's a mismatch
    if (maxIdVal && nextValue <= maxIdVal) {
      console.log('\n❌ PROBLEM DETECTED: Sequence is behind the maximum ID!');
      console.log(`   Sequence will generate: ${nextValue}`);
      console.log(`   But max ID is already: ${maxIdVal}`);
      console.log('\n   This will cause unique constraint violations!');
      
      console.log('\n🔧 To fix this, run: node check_mediafile_sequence.js --fix');
    } else {
      console.log('\n✅ Sequence is properly configured');
    }
    
    // Fix the sequence if requested
    if (process.argv.includes('--fix')) {
      console.log('\n🔧 Fixing the sequence...');
      
      const newValue = maxIdVal ? maxIdVal + 1 : 1;
      await prisma.$executeRaw`
        SELECT setval('"MediaFile_id_seq"', ${newValue}, false)
      `;
      
      console.log(`✅ Sequence reset to: ${newValue}`);
      
      // Verify the fix
      const newSequenceInfo = await prisma.$queryRaw`
        SELECT last_value FROM "MediaFile_id_seq"
      `;
      console.log(`   New sequence value: ${newSequenceInfo[0].last_value}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMediaFileSequence();