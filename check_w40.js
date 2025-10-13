const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkW40() {
  console.log('\n=== Verificando SEMANA W40 ===\n');
  
  // 1. Verificar dataWeekly
  console.log('--- 1. dataWeekly (dados de plataforma) ---');
  const dataWeeklySnap = await db.collection('dataWeekly')
    .where('weekId', '==', '2025-W40')
    .get();
  
  console.log(`Total de registros em dataWeekly: ${dataWeeklySnap.size}`);
  
  const withDriver = dataWeeklySnap.docs.filter(d => d.data().driverId);
  console.log(`Com driverId mapeado: ${withDriver.length}`);
  
  if (withDriver.length > 0) {
    console.log('\nMotoristas com dados na W40:');
    const driverIds = [...new Set(withDriver.map(d => d.data().driverId))];
    for (const driverId of driverIds) {
      const driverDocs = withDriver.filter(d => d.data().driverId === driverId);
      const driverName = driverDocs[0].data().driverName;
      const platforms = driverDocs.map(d => `${d.data().platform}: €${d.data().totalValue}`);
      console.log(`  ${driverName} (${driverId})`);
      console.log(`    ${platforms.join(', ')}`);
    }
  }
  
  // 2. Verificar driverWeeklyRecords
  console.log('\n--- 2. driverWeeklyRecords (dados salvos/pagamentos) ---');
  const recordsSnap = await db.collection('driverWeeklyRecords')
    .where('weekId', '==', '2025-W40')
    .get();
  
  console.log(`Total de registros em driverWeeklyRecords: ${recordsSnap.size}`);
  
  if (recordsSnap.size > 0) {
    console.log('\nRegistros encontrados:');
    recordsSnap.forEach(doc => {
      const data = doc.data();
      console.log(`\n  ${data.driverName} (${doc.id})`);
      console.log(`    Aluguel: €${data.aluguel || 0}`);
      console.log(`    Status: ${data.paymentStatus || 'pending'}`);
      console.log(`    Data pagamento: ${data.paymentDate || 'N/A'}`);
      if (data.paymentInfo) {
        console.log(`    Comprovante: ${data.paymentInfo.proofFileName || 'N/A'}`);
      }
      console.log(`    Criado em: ${data.createdAt}`);
    });
  } else {
    console.log('❌ NENHUM REGISTRO ENCONTRADO em driverWeeklyRecords para W40!');
  }
  
  // 3. Verificar se a API retornaria a W40
  console.log('\n--- 3. Teste da função getDriverWeekData ---');
  if (withDriver.length > 0) {
    const testDriverId = withDriver[0].data().driverId;
    console.log(`\nTestando com motorista: ${testDriverId}`);
    console.log('A função getDriverWeekData() deveria:');
    console.log('  1. Buscar dados em dataWeekly (✓ existem)');
    console.log(`  2. Buscar/criar registro em driverWeeklyRecords (${recordsSnap.size > 0 ? '✓ existe' : '⚠ vai criar novo'})`);
    console.log('  3. Juntar os dois');
  }
  
  process.exit(0);
}

checkW40().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
