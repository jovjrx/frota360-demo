const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function analyzeBoltFile() {
  console.log('🔍 Buscando documento 2025-W40-bolt...\n');
  
  const doc = await db.collection('rawFileArchive').doc('2025-W40-bolt').get();
  
  if (!doc.exists) {
    console.log('❌ Documento não encontrado');
    return;
  }
  
  const data = doc.data();
  
  console.log('📄 BOLT DOCUMENTO\n');
  console.log(`Headers (${data.rawData.headers?.length || 0}):`);
  if (data.rawData.headers) {
    data.rawData.headers.forEach((h, i) => {
      console.log(`  [${i}] "${h}"`);
    });
  }
  
  console.log(`\nRows: ${data.rawData.rows?.length || 0}`);
  if (data.rawData.rows && data.rawData.rows.length > 0) {
    console.log('\n📋 PRIMEIRA LINHA:');
    const firstRow = data.rawData.rows[0];
    Object.keys(firstRow).forEach(key => {
      console.log(`  "${key}": ${JSON.stringify(firstRow[key])}`);
    });
  }
}

analyzeBoltFile()
  .then(() => {
    console.log('\n✅ Análise concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
