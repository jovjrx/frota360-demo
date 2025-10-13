const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function analyzeWeeklyData() {
  console.log('🔍 Buscando dados em dataWeekly...\n');
  
  // Buscar dados do Uber
  const uberSnapshot = await db.collection('dataWeekly')
    .where('platform', '==', 'uber')
    .orderBy('createdAt', 'desc')
    .limit(3)
    .get();

  console.log(`\n📊 UBER - ${uberSnapshot.size} documentos encontrados`);
  if (!uberSnapshot.empty) {
    const firstDoc = uberSnapshot.docs[0].data();
    console.log('Campos do documento Uber:');
    Object.keys(firstDoc).forEach(key => {
      console.log(`  ${key}: ${typeof firstDoc[key]} = ${JSON.stringify(firstDoc[key]).substring(0, 100)}`);
    });
  }

  // Buscar dados do Bolt
  const boltSnapshot = await db.collection('dataWeekly')
    .where('platform', '==', 'bolt')
    .orderBy('createdAt', 'desc')
    .limit(3)
    .get();

  console.log(`\n📊 BOLT - ${boltSnapshot.size} documentos encontrados`);
  if (!boltSnapshot.empty) {
    const firstDoc = boltSnapshot.docs[0].data();
    console.log('Campos do documento Bolt:');
    Object.keys(firstDoc).forEach(key => {
      console.log(`  ${key}: ${typeof firstDoc[key]} = ${JSON.stringify(firstDoc[key]).substring(0, 100)}`);
    });
  }

  // Buscar dados do MyPrio
  const myprioSnapshot = await db.collection('dataWeekly')
    .where('platform', '==', 'myprio')
    .orderBy('createdAt', 'desc')
    .limit(3)
    .get();

  console.log(`\n📊 MYPRIO - ${myprioSnapshot.size} documentos encontrados`);
  if (!myprioSnapshot.empty) {
    const firstDoc = myprioSnapshot.docs[0].data();
    console.log('Campos do documento MyPrio:');
    Object.keys(firstDoc).forEach(key => {
      console.log(`  ${key}: ${typeof firstDoc[key]} = ${JSON.stringify(firstDoc[key]).substring(0, 100)}`);
    });
  }

  // Buscar dados do ViaVerde
  const viaverdeSnapshot = await db.collection('dataWeekly')
    .where('platform', '==', 'viaverde')
    .orderBy('createdAt', 'desc')
    .limit(3)
    .get();

  console.log(`\n📊 VIAVERDE - ${viaverdeSnapshot.size} documentos encontrados`);
  if (!viaverdeSnapshot.empty) {
    const firstDoc = viaverdeSnapshot.docs[0].data();
    console.log('Campos do documento ViaVerde:');
    Object.keys(firstDoc).forEach(key => {
      console.log(`  ${key}: ${typeof firstDoc[key]} = ${JSON.stringify(firstDoc[key]).substring(0, 100)}`);
    });
  }
}

analyzeWeeklyData()
  .then(() => {
    console.log('\n✅ Análise concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
