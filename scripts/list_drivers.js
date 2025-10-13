const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function listDrivers() {
  try {
    console.log('\n📋 Listando todos os motoristas...\n');
    
    const driversSnapshot = await db.collection('drivers').get();
    
    console.log(`Total de motoristas: ${driversSnapshot.size}\n`);
    
    driversSnapshot.forEach(doc => {
      const driver = doc.data();
      console.log(`👤 ${driver.name} (${driver.type})`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Matrícula: ${driver.vehiclePlate || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

listDrivers();
