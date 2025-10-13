const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function analyzeRecentFiles() {
  console.log('🔍 Buscando arquivos mais recentes em rawFileArchive...\n');
  
  const snapshot = await db.collection('rawFileArchive')
    .orderBy('uploadedAt', 'desc')
    .limit(10)
    .get();

  if (snapshot.empty) {
    console.log('❌ Nenhum documento encontrado');
    return;
  }

  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📄 ID: ${doc.id}`);
    console.log(`Platform: ${data.platform}`);
    console.log(`WeekId: ${data.weekId}`);
    console.log(`FileName: ${data.fileName}`);
    console.log(`Uploaded: ${data.uploadedAt}`);
    
    if (data.rawData?.headers) {
      console.log(`\nHeaders (${data.rawData.headers.length}):`);
      data.rawData.headers.forEach((h, i) => {
        console.log(`  [${i}] "${h}"`);
      });
    }
    
    if (data.rawData?.rows && data.rawData.rows.length > 0) {
      console.log(`\nPRIMEIRA LINHA (${data.rawData.rows.length} rows total):`);
      const firstRow = data.rawData.rows[0];
      Object.keys(firstRow).forEach(key => {
        const value = firstRow[key];
        console.log(`  "${key}": ${JSON.stringify(value)}`);
      });
    }
  }
}

analyzeRecentFiles()
  .then(() => {
    console.log('\n✅ Análise concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
