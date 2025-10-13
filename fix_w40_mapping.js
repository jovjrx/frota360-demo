const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixW40Mapping() {
  console.log('\n=== CORRIGINDO MAPEAMENTO DA W40 ===\n');
  
  // 1. Buscar motoristas cadastrados
  const driversSnap = await db.collection('drivers').get();
  const drivers = {};
  
  driversSnap.forEach(doc => {
    const data = doc.data();
    drivers[doc.id] = {
      name: data.fullName || data.name,
      email: data.email,
      uberUuid: data.integrations?.uber?.key,
      boltEmail: data.integrations?.bolt?.key,
      myprioCard: data.integrations?.myprio?.key,
      viaverdeKey: data.integrations?.viaverde?.key,
      vehiclePlate: data.vehicle?.plate
    };
  });
  
  console.log(`Motoristas cadastrados: ${Object.keys(drivers).length}\n`);
  
  // 2. Buscar dados da W40 sem driverId
  const dataWeeklySnap = await db.collection('dataWeekly')
    .where('weekId', '==', '2025-W40')
    .get();
  
  console.log(`Registros da W40 em dataWeekly: ${dataWeeklySnap.size}\n`);
  
  // 3. Mapear e atualizar
  let updated = 0;
  let notMapped = 0;
  
  for (const doc of dataWeeklySnap.docs) {
    const data = doc.data();
    
    if (data.driverId) {
      console.log(`✓ ${doc.id} já tem driverId: ${data.driverId}`);
      continue;
    }
    
    let matchedDriverId = null;
    let matchReason = '';
    
    // Tentar mapear
    for (const [driverId, driver] of Object.entries(drivers)) {
      // Por referenceLabel (nome)
      if (data.referenceLabel && driver.name) {
        const labelLower = data.referenceLabel.toLowerCase().trim();
        const nameLower = driver.name.toLowerCase().trim();
        
        if (labelLower.includes(nameLower.split(' ')[0]) || nameLower.includes(labelLower)) {
          matchedDriverId = driverId;
          matchReason = `nome: ${data.referenceLabel} ≈ ${driver.name}`;
          break;
        }
      }
      
      // Por referenceId específico
      switch (data.platform) {
        case 'uber':
          if (driver.uberUuid === data.referenceId) {
            matchedDriverId = driverId;
            matchReason = `uber UUID: ${data.referenceId}`;
            break;
          }
          break;
        case 'bolt':
          if (driver.boltEmail === data.referenceId) {
            matchedDriverId = driverId;
            matchReason = `bolt email: ${data.referenceId}`;
            break;
          }
          break;
        case 'myprio':
          if (driver.myprioCard === data.referenceId) {
            matchedDriverId = driverId;
            matchReason = `myprio card: ${data.referenceId}`;
            break;
          }
          break;
        case 'viaverde':
          if (driver.viaverdeKey === data.referenceId || driver.vehiclePlate === data.referenceId) {
            matchedDriverId = driverId;
            matchReason = `viaverde/placa: ${data.referenceId}`;
            break;
          }
          break;
      }
      
      if (matchedDriverId) break;
    }
    
    if (matchedDriverId) {
      const driverName = drivers[matchedDriverId].name;
      
      console.log(`✓ Mapeando: ${data.platform} | ${data.referenceLabel || data.referenceId}`);
      console.log(`  → ${driverName} (${matchedDriverId})`);
      console.log(`  Razão: ${matchReason}`);
      
      // Atualizar documento
      await doc.ref.update({
        driverId: matchedDriverId,
        driverName: driverName
      });
      
      updated++;
    } else {
      console.log(`❌ Não mapeado: ${data.platform} | ${data.referenceLabel || data.referenceId} | €${data.totalValue}`);
      notMapped++;
    }
  }
  
  console.log('\n=== RESUMO ===');
  console.log(`✓ Atualizados: ${updated}`);
  console.log(`❌ Não mapeados: ${notMapped}`);
  console.log(`Total: ${dataWeeklySnap.size}`);
  
  if (notMapped > 0) {
    console.log('\n⚠️ Alguns registros não puderam ser mapeados automaticamente.');
    console.log('Verifique os cadastros dos motoristas e mapeie manualmente se necessário.');
  }
  
  process.exit(0);
}

fixW40Mapping().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
