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

async function checkPrioLabels() {
  try {
    console.log('🔍 Verificando referenceLabel em dataWeekly PRIO\n');
    
    const dataSnapshot = await db.collection('dataWeekly')
      .where('platform', '==', 'myprio')
      .get();
    
    console.log('📊 Dados PRIO:\n');
    dataSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`Cartão: ${data.referenceId}`);
      console.log(`  referenceLabel: "${data.referenceLabel}"`);
      console.log(`  totalValue: €${data.totalValue}`);
      console.log('');
    });
    
    // Buscar motoristas
    console.log('👥 Motoristas:\n');
    const driversSnapshot = await db.collection('drivers')
      .where('status', '==', 'active')
      .get();
    
    driversSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const prioKey = data.integrations?.myprio?.key;
      const plate = data.vehicle?.plate;
      if (prioKey) {
        console.log(`${data.fullName}:`);
        console.log(`  PRIO: ${prioKey}`);
        console.log(`  Placa: ${plate}`);
        console.log('');
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkPrioLabels();
