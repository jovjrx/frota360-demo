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

async function checkCartrack() {
  try {
    console.log('🔍 Verificando integração Cartrack\n');
    
    // Verificar collection integrations
    const intSnapshot = await db.collection('integrations').doc('cartrack').get();
    
    if (intSnapshot.exists) {
      console.log('✅ Integração Cartrack encontrada:');
      console.log(JSON.stringify(intSnapshot.data(), null, 2));
    } else {
      console.log('❌ Integração Cartrack não encontrada');
    }
    
    // Verificar se há dados brutos de Cartrack
    console.log('\n📦 Verificando dados brutos...\n');
    const rawSnapshot = await db.collection('rawFileArchive')
      .where('platform', '==', 'cartrack')
      .limit(5)
      .get();
    
    if (rawSnapshot.empty) {
      console.log('⚠️  Nenhum dado bruto de Cartrack encontrado');
    } else {
      console.log(`✅ Encontrados ${rawSnapshot.size} arquivos Cartrack`);
      rawSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.fileName} (${data.weekId})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkCartrack();
