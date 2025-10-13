const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function manualMapW40() {
  console.log('\n=== MAPEAMENTO MANUAL DOS REGISTROS RESTANTES ===\n');
  
  // Mapear manualmente os 2 registros não identificados
  const manualMappings = [
    {
      docId: '2025-W40_uber_64d1e235-8f1f-4cf2-a862-ef862d443990',
      reason: 'UUID Uber não cadastrado - verificar histórico ou deixar sem mapear',
      action: 'skip' // ou especificar driverId se souber
    },
    {
      docId: '2025-W40_viaverde_GP798SH',
      reason: 'Placa GP798SH não está cadastrada em nenhum motorista',
      action: 'skip' // ou especificar driverId se souber
    }
  ];
  
  console.log('ANÁLISE DOS REGISTROS NÃO MAPEADOS:\n');
  
  for (const mapping of manualMappings) {
    console.log(`📄 ${mapping.docId}`);
    console.log(`   Razão: ${mapping.reason}`);
    console.log(`   Ação: ${mapping.action === 'skip' ? 'Manter sem mapear' : 'Mapear'}\n`);
  }
  
  console.log('\n=== VERIFICAÇÃO FINAL ===\n');
  
  const dataWeeklySnap = await db.collection('dataWeekly')
    .where('weekId', '==', '2025-W40')
    .get();
  
  const mapped = dataWeeklySnap.docs.filter(doc => doc.data().driverId).length;
  const unmapped = dataWeeklySnap.docs.filter(doc => !doc.data().driverId).length;
  
  console.log(`✓ Mapeados: ${mapped}/${dataWeeklySnap.size}`);
  console.log(`⚠️ Não mapeados: ${unmapped}/${dataWeeklySnap.size}`);
  
  if (unmapped > 0) {
    console.log('\n📋 Registros não mapeados:');
    dataWeeklySnap.docs
      .filter(doc => !doc.data().driverId)
      .forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.platform}: ${data.referenceId} (€${data.totalValue})`);
      });
    
    console.log('\n💡 DECISÃO:');
    console.log('Esses registros não têm correspondência no cadastro de motoristas.');
    console.log('Opções:');
    console.log('1. Deixar sem mapear (não aparecerão na lista)');
    console.log('2. Identificar e cadastrar as chaves corretas nos motoristas');
    console.log('3. Criar motoristas novos se forem dados de ex-motoristas');
  }
  
  // Testar se a W40 agora aparece
  console.log('\n\n=== TESTE: MOTORISTAS QUE DEVEM APARECER NA W40 ===\n');
  
  const driverIds = [...new Set(
    dataWeeklySnap.docs
      .filter(doc => doc.data().driverId)
      .map(doc => doc.data().driverId)
  )];
  
  console.log(`Motoristas que devem aparecer: ${driverIds.length}`);
  
  for (const driverId of driverIds) {
    const driverDocs = dataWeeklySnap.docs.filter(doc => doc.data().driverId === driverId);
    const driverName = driverDocs[0].data().driverName;
    const total = driverDocs.reduce((sum, doc) => sum + (doc.data().totalValue || 0), 0);
    
    console.log(`\n✓ ${driverName} (${driverId})`);
    console.log(`   Total de registros: ${driverDocs.length}`);
    console.log(`   Total geral: €${total.toFixed(2)}`);
    
    // Verificar se tem registro salvo
    const recordDoc = await db.collection('driverWeeklyRecords')
      .doc(`${driverId}_2025-W40`)
      .get();
    
    if (recordDoc.exists) {
      const recordData = recordDoc.data();
      console.log(`   ✓ Tem registro salvo (Status: ${recordData.paymentStatus})`);
    } else {
      console.log(`   ⚠️ Não tem registro salvo (será criado ao acessar)`);
    }
  }
  
  process.exit(0);
}

manualMapW40().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
