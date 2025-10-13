const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkDataWeekly() {
  console.log('\n=== Verificando dataWeekly ===\n');
  
  const snap = await db.collection('dataWeekly')
    .where('weekId', '==', '2025-W41')
    .get();
  
  console.log(`Total de registros na W41: ${snap.size}`);
  
  const withDriver = snap.docs.filter(d => d.data().driverId);
  const withoutDriver = snap.docs.filter(d => !d.data().driverId);
  
  console.log(`Com driverId: ${withDriver.length}`);
  console.log(`Sem driverId: ${withoutDriver.length}`);
  
  if (withDriver.length > 0) {
    console.log('\n--- Exemplo COM driverId ---');
    const example = withDriver[0].data();
    console.log(JSON.stringify(example, null, 2));
  }
  
  if (withoutDriver.length > 0) {
    console.log('\n--- Exemplo SEM driverId ---');
    const example = withoutDriver[0].data();
    console.log(JSON.stringify(example, null, 2));
  }
  
  // Agrupar por driverId
  const byDriver = {};
  withDriver.forEach(doc => {
    const data = doc.data();
    if (!byDriver[data.driverId]) {
      byDriver[data.driverId] = [];
    }
    byDriver[data.driverId].push({
      platform: data.platform,
      totalValue: data.totalValue,
      referenceLabel: data.referenceLabel
    });
  });
  
  console.log('\n--- Motoristas com dados mapeados ---');
  for (const [driverId, entries] of Object.entries(byDriver)) {
    console.log(`\nDriver: ${driverId}`);
    console.log(entries);
  }
  
  process.exit(0);
}

checkDataWeekly().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
