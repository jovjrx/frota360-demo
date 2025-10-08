const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join('/home/ubuntu/conduz-pt', 'conduz-pt.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function extractRawData() {
  try {
    console.log('🔍 Extraindo dados brutos do rawFileArchive...\n');
    
    const snapshot = await db.collection('rawFileArchive').get();
    
    if (snapshot.empty) {
      console.log('⚠️  Nenhum dado encontrado');
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Plataforma: ${data.platform.toUpperCase()}`);
      console.log(`Arquivo: ${data.fileName}`);
      console.log(`Semana: ${data.weekId}`);
      console.log(`\nHeaders: ${JSON.stringify(data.rawData.headers)}`);
      console.log(`\nPrimeiras linhas:`);
      data.rawData.rows.slice(0, 3).forEach((row, i) => {
        console.log(`\nLinha ${i + 1}:`, JSON.stringify(row, null, 2));
      });
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

extractRawData();
