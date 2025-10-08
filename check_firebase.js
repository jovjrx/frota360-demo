const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join('/home/ubuntu/conduz-pt', 'conduz-pt.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Arquivo conduz-pt.json não encontrado');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkRawFileArchive() {
  try {
    console.log('🔍 Consultando coleção rawFileArchive...\n');
    
    const snapshot = await db.collection('rawFileArchive').get();
    
    if (snapshot.empty) {
      console.log('⚠️  Coleção rawFileArchive está vazia');
      return;
    }
    
    console.log(`✅ Total de documentos: ${snapshot.size}\n`);
    
    const platforms = {
      uber: 0,
      bolt: 0,
      myprio: 0,
      viaverde: 0,
      other: 0
    };
    
    const docs = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      docs.push({
        id: doc.id,
        weekId: data.weekId,
        platform: data.platform,
        fileName: data.fileName,
        importedAt: data.importedAt,
        processed: data.processed,
        rowCount: data.rawData?.rows?.length || 0
      });
      
      if (platforms.hasOwnProperty(data.platform)) {
        platforms[data.platform]++;
      } else {
        platforms.other++;
      }
    });
    
    console.log('📊 Resumo por plataforma:');
    console.log(`   Uber: ${platforms.uber}`);
    console.log(`   Bolt: ${platforms.bolt}`);
    console.log(`   MyPrio: ${platforms.myprio}`);
    console.log(`   ViaVerde: ${platforms.viaverde}`);
    console.log(`   Outros: ${platforms.other}`);
    console.log('');
    
    console.log('📋 Detalhes dos arquivos:');
    docs.sort((a, b) => (b.importedAt || '').localeCompare(a.importedAt || '')).forEach(doc => {
      console.log(`\n   ID: ${doc.id}`);
      console.log(`   Semana: ${doc.weekId}`);
      console.log(`   Plataforma: ${doc.platform}`);
      console.log(`   Arquivo: ${doc.fileName}`);
      console.log(`   Linhas: ${doc.rowCount}`);
      console.log(`   Processado: ${doc.processed ? '✅' : '❌'}`);
      console.log(`   Importado: ${doc.importedAt}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao consultar Firebase:', error);
  } finally {
    process.exit(0);
  }
}

checkRawFileArchive();
