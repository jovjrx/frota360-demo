const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function analyzeRawFiles() {
  console.log('🔍 Buscando entradas em rawFileArchive...\n');
  
  const snapshot = await db.collection('rawFileArchive')
    .orderBy('uploadedAt', 'desc')
    .limit(10)
    .get();

  if (snapshot.empty) {
    console.log('❌ Nenhum documento encontrado em rawFileArchive');
    return;
  }

  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`\n📄 ID: ${doc.id}`);
    console.log(`📅 Upload: ${data.uploadedAt}`);
    console.log(`🏷️  Platform: ${data.platform}`);
    console.log(`📊 Week: ${data.weekId}`);
    console.log(`📁 Arquivo: ${data.fileName}`);
    
    if (data.rawData?.headers) {
      console.log(`\n🔤 HEADERS (${data.rawData.headers.length}):`);
      console.log(data.rawData.headers.slice(0, 10).join(', '));
      if (data.rawData.headers.length > 10) {
        console.log(`... e mais ${data.rawData.headers.length - 10} colunas`);
      }
    }
    
    if (data.rawData?.rows && data.rawData.rows.length > 0) {
      console.log(`\n📋 EXEMPLO DE ROW (primeira linha):`);
      const firstRow = data.rawData.rows[0];
      const keys = Object.keys(firstRow).slice(0, 5);
      keys.forEach(key => {
        console.log(`  ${key}: ${firstRow[key]}`);
      });
      console.log(`\n  Total de ${data.rawData.rows.length} linhas de dados`);
    }
    
    console.log('\n' + '='.repeat(80));
  });
}

analyzeRawFiles()
  .then(() => {
    console.log('\n✅ Análise concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
