const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUnmapped() {
  console.log('\n=== VERIFICANDO REGISTROS NÃO MAPEADOS ===\n');
  
  const dataWeeklySnap = await db.collection('dataWeekly')
    .where('weekId', '==', '2025-W40')
    .get();
  
  const unmapped = dataWeeklySnap.docs
    .filter(doc => !doc.data().driverId)
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  
  console.log(`Não mapeados: ${unmapped.length}\n`);
  
  unmapped.forEach(entry => {
    console.log(`\n📄 Registro: ${entry.id}`);
    console.log(`   Plataforma: ${entry.platform}`);
    console.log(`   Reference ID: ${entry.referenceId}`);
    console.log(`   Reference Label: ${entry.referenceLabel || 'N/A'}`);
    console.log(`   Valor: €${entry.totalValue}`);
  });
  
  // Buscar motoristas para comparação
  console.log('\n\n=== MOTORISTAS CADASTRADOS ===\n');
  const driversSnap = await db.collection('drivers').get();
  
  driversSnap.forEach(doc => {
    const data = doc.data();
    console.log(`\n👤 ${data.fullName || data.name} (${doc.id})`);
    console.log(`   Uber: ${data.integrations?.uber?.key || 'N/A'}`);
    console.log(`   Bolt: ${data.integrations?.bolt?.key || 'N/A'}`);
    console.log(`   MyPrio: ${data.integrations?.myprio?.key || 'N/A'}`);
    console.log(`   ViaVerde: ${data.integrations?.viaverde?.key || 'N/A'}`);
    console.log(`   Placa: ${data.vehicle?.plate || 'N/A'}`);
  });
  
  console.log('\n\n💡 AÇÃO NECESSÁRIA:');
  console.log('Para mapear os registros não identificados:');
  console.log('1. Compare os referenceId com os cadastros dos motoristas');
  console.log('2. Atualize o cadastro do motorista com as chaves corretas');
  console.log('3. Execute novamente: node fix_w40_mapping.js');
  
  process.exit(0);
}

checkUnmapped().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
