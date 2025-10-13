const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function analyzeW40Problem() {
  console.log('\n=== ANÁLISE DO PROBLEMA DA W40 ===\n');
  
  // 1. Dados de plataforma (dataWeekly)
  const dataWeeklySnap = await db.collection('dataWeekly')
    .where('weekId', '==', '2025-W40')
    .get();
  
  console.log('1. DADOS DE PLATAFORMA (dataWeekly):');
  console.log(`   Total de registros: ${dataWeeklySnap.size}`);
  
  const dataByDriver = {};
  dataWeeklySnap.forEach(doc => {
    const data = doc.data();
    const key = data.driverId || 'SEM_DRIVER_ID';
    if (!dataByDriver[key]) {
      dataByDriver[key] = {
        driverName: data.driverName,
        platforms: []
      };
    }
    dataByDriver[key].platforms.push({
      platform: data.platform,
      value: data.totalValue,
      referenceId: data.referenceId,
      referenceLabel: data.referenceLabel
    });
  });
  
  console.log('\n   Por motorista:');
  for (const [driverId, info] of Object.entries(dataByDriver)) {
    console.log(`\n   ${driverId === 'SEM_DRIVER_ID' ? '❌ SEM DRIVERID' : '✓ ' + driverId}`);
    console.log(`      Nome: ${info.driverName || 'null'}`);
    info.platforms.forEach(p => {
      console.log(`      - ${p.platform}: €${p.value} (${p.referenceLabel || p.referenceId})`);
    });
  }
  
  // 2. Registros salvos (driverWeeklyRecords)
  const recordsSnap = await db.collection('driverWeeklyRecords')
    .where('weekId', '==', '2025-W40')
    .get();
  
  console.log('\n\n2. REGISTROS SALVOS (driverWeeklyRecords):');
  console.log(`   Total de registros: ${recordsSnap.size}`);
  
  const savedRecords = {};
  recordsSnap.forEach(doc => {
    const data = doc.data();
    savedRecords[data.driverId] = {
      id: doc.id,
      driverName: data.driverName,
      aluguel: data.aluguel,
      paymentStatus: data.paymentStatus,
      paymentDate: data.paymentDate,
      hasProof: !!data.paymentInfo?.proofFileName,
      createdAt: data.createdAt
    };
  });
  
  console.log('\n   Por motorista:');
  for (const [driverId, info] of Object.entries(savedRecords)) {
    console.log(`\n   ✓ ${driverId}`);
    console.log(`      Nome: ${info.driverName}`);
    console.log(`      Aluguel: €${info.aluguel || 0}`);
    console.log(`      Status: ${info.paymentStatus}`);
    console.log(`      Pago em: ${info.paymentDate || 'N/A'}`);
    console.log(`      Comprovante: ${info.hasProof ? 'Sim' : 'Não'}`);
  }
  
  // 3. ANÁLISE DO PROBLEMA
  console.log('\n\n3. ANÁLISE DO PROBLEMA:');
  
  const driversWithData = Object.keys(dataByDriver).filter(id => id !== 'SEM_DRIVER_ID');
  const driversWithRecords = Object.keys(savedRecords);
  
  console.log(`\n   Motoristas com dados em dataWeekly: ${driversWithData.length}`);
  console.log(`   Motoristas com registros salvos: ${driversWithRecords.length}`);
  
  if (driversWithData.length === 0) {
    console.log('\n   ❌ PROBLEMA IDENTIFICADO:');
    console.log('   Os registros em dataWeekly da W40 NÃO TÊM driverId mapeado!');
    console.log('   Isso significa que o sistema de mapeamento não associou os dados às contas dos motoristas.');
    console.log('\n   CAUSA:');
    console.log('   - Os dados foram importados mas o driverId ficou NULL');
    console.log('   - Pode ter sido importação antiga ou problema no mapeamento');
    console.log('\n   SOLUÇÃO:');
    console.log('   - Precisa mapear manualmente os referenceId para driverId');
    console.log('   - OU reimportar os dados da W40 com mapeamento correto');
    console.log('   - OU adicionar script de correção para mapear retroativamente');
  } else {
    console.log('\n   ✓ Os dados têm driverId mapeado');
  }
  
  // Verificar motoristas perdidos
  const lostDrivers = driversWithRecords.filter(id => !driversWithData.includes(id));
  if (lostDrivers.length > 0) {
    console.log('\n   ⚠ MOTORISTAS COM REGISTRO MAS SEM DADOS:');
    lostDrivers.forEach(driverId => {
      const record = savedRecords[driverId];
      console.log(`   - ${record.driverName} (${driverId})`);
      console.log(`     Status: ${record.paymentStatus} | Aluguel: €${record.aluguel}`);
    });
    console.log('\n   Esses motoristas têm registro de pagamento mas não aparecem na lista');
    console.log('   porque não há dados de plataforma mapeados para eles em dataWeekly!');
  }
  
  process.exit(0);
}

analyzeW40Problem().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
