const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listAllRawFiles() {
  console.log('🔍 Listando TODOS os documentos em rawFileArchive...\n');
  
  const snapshot = await db.collection('rawFileArchive').get();

  console.log(`Total de documentos: ${snapshot.size}\n`);

  const files = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    files.push({
      id: doc.id,
      platform: data.platform,
      weekId: data.weekId,
      fileName: data.fileName,
      uploadedAt: data.uploadedAt,
      hasHeaders: !!data.rawData?.headers,
      headersCount: data.rawData?.headers?.length || 0,
      rowsCount: data.rawData?.rows?.length || 0,
    });
  });

  // Ordenar por ID
  files.sort((a, b) => a.id.localeCompare(b.id));

  files.forEach(f => {
    console.log(`📄 ${f.id}`);
    console.log(`   Platform: ${f.platform} | Week: ${f.weekId}`);
    console.log(`   Headers: ${f.headersCount} | Rows: ${f.rowsCount}`);
    console.log(`   File: ${f.fileName}`);
    console.log();
  });
}

listAllRawFiles()
  .then(() => {
    console.log('✅ Listagem concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
