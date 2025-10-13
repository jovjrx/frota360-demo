const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function analyzeUberFile() {
  console.log('🔍 Buscando documento 2025-W40-uber...\n');
  
  const doc = await db.collection('rawFileArchive').doc('2025-W40-uber').get();
  
  if (!doc.exists) {
    console.log('❌ Documento não encontrado');
    return;
  }
  
  const data = doc.data();
  
  console.log('📄 DOCUMENTO ENCONTRADO\n');
  console.log(`Platform: ${data.platform}`);
  console.log(`WeekId: ${data.weekId}`);
  console.log(`FileName: ${data.fileName}`);
  console.log(`Uploaded: ${data.uploadedAt}`);
  console.log(`Processed: ${data.processed}`);
  
  if (data.rawData) {
    console.log('\n📊 RAW DATA:');
    console.log(`  Headers (${data.rawData.headers?.length || 0}):`);
    if (data.rawData.headers) {
      data.rawData.headers.forEach((h, i) => {
        console.log(`    [${i}] "${h}"`);
      });
    }
    
    console.log(`\n  Rows: ${data.rawData.rows?.length || 0}`);
    if (data.rawData.rows && data.rawData.rows.length > 0) {
      console.log('\n  📋 PRIMEIRA LINHA (exemplo):');
      const firstRow = data.rawData.rows[0];
      Object.keys(firstRow).forEach(key => {
        console.log(`    "${key}": ${JSON.stringify(firstRow[key])}`);
      });
      
      console.log('\n  📋 SEGUNDA LINHA (exemplo):');
      if (data.rawData.rows.length > 1) {
        const secondRow = data.rawData.rows[1];
        Object.keys(secondRow).forEach(key => {
          console.log(`    "${key}": ${JSON.stringify(secondRow[key])}`);
        });
      }
    }
  }
}

analyzeUberFile()
  .then(() => {
    console.log('\n✅ Análise concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
