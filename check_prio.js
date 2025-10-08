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

async function checkPrio() {
  try {
    const snapshot = await db.collection('rawFileArchive')
      .where('platform', '==', 'myprio')
      .get();
    
    if (snapshot.empty) {
      console.log('Nenhum arquivo PRIO encontrado');
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('Headers:', JSON.stringify(data.rawData.headers));
      console.log('\nPrimeiras linhas:');
      data.rawData.rows.slice(0, 5).forEach((row, i) => {
        console.log(`\nLinha ${i + 1}:`, JSON.stringify(row, null, 2));
      });
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkPrio();
