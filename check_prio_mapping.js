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

async function checkPrioMapping() {
  try {
    console.log('🔍 Verificando mapeamento PRIO\n');
    console.log('='.repeat(60));
    
    // 1. Buscar motoristas
    console.log('\n👥 Motoristas cadastrados:\n');
    const driversSnapshot = await db.collection('drivers')
      .where('status', '==', 'active')
      .get();
    
    const drivers = {};
    driversSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const prioKey = data.integrations?.myprio?.key;
      if (prioKey) {
        drivers[prioKey] = data.fullName || data.name;
        console.log(`   ${data.fullName || data.name}:`);
        console.log(`      PRIO: ${prioKey}`);
      }
    });
    
    // 2. Buscar dados PRIO em dataWeekly
    console.log('\n📊 Dados PRIO em dataWeekly:\n');
    const dataSnapshot = await db.collection('dataWeekly')
      .where('platform', '==', 'myprio')
      .get();
    
    dataSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const motorista = drivers[data.referenceId] || 'NÃO MAPEADO';
      console.log(`   Cartão: ${data.referenceId}`);
      console.log(`      Valor: €${data.totalValue}`);
      console.log(`      Motorista: ${motorista}`);
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('\n✅ Verificação concluída!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkPrioMapping();
