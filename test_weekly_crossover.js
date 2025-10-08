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

function normalizeKey(key) {
  return String(key || '').toLowerCase().trim();
}

function normalizePlate(plate) {
  return String(plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function testWeeklyCrossover() {
  try {
    console.log('🧪 Testando cruzamento Weekly\n');
    console.log('='.repeat(60));
    
    // 1. Buscar motoristas
    const driversSnapshot = await db.collection('drivers').where('status', '==', 'active').get();
    const drivers = [];
    
    driversSnapshot.docs.forEach(doc => {
      const data = doc.data();
      drivers.push({
        id: doc.id,
        name: data.fullName || data.name,
        integrations: {
          uber: data.integrations?.uber?.key,
          bolt: data.integrations?.bolt?.key,
          myprio: data.integrations?.myprio?.key,
        },
        plate: data.vehicle?.plate
      });
    });
    
    // 2. Criar mapas
    const byMyPrio = new Map();
    const byPlate = new Map();
    
    drivers.forEach(driver => {
      if (driver.integrations.myprio) {
        byMyPrio.set(normalizeKey(driver.integrations.myprio), driver);
      }
      if (driver.plate) {
        byPlate.set(normalizePlate(driver.plate), driver);
      }
    });
    
    console.log('\n📋 Mapas criados:\n');
    console.log('byMyPrio:');
    byMyPrio.forEach((driver, key) => {
      console.log(`  ${key} → ${driver.name}`);
    });
    
    console.log('\nbyPlate:');
    byPlate.forEach((driver, key) => {
      console.log(`  ${key} → ${driver.name}`);
    });
    
    // 3. Testar cruzamento PRIO
    console.log('\n🔄 Testando cruzamento PRIO:\n');
    
    const prioData = await db.collection('dataWeekly')
      .where('platform', '==', 'myprio')
      .get();
    
    prioData.docs.forEach(doc => {
      const data = doc.data();
      const cardKey = normalizeKey(data.referenceId);
      const plateKey = normalizePlate(data.referenceLabel || '');
      
      console.log(`Cartão: ${data.referenceId} (€${data.totalValue})`);
      console.log(`  referenceLabel: "${data.referenceLabel}"`);
      console.log(`  cardKey normalizado: "${cardKey}"`);
      console.log(`  plateKey normalizado: "${plateKey}"`);
      
      // Tentar por cartão
      let driver = byMyPrio.get(cardKey);
      if (driver) {
        console.log(`  ✅ Mapeado por CARTÃO: ${driver.name}`);
      } else {
        console.log(`  ❌ Não encontrado por cartão`);
        
        // Tentar por placa
        driver = byPlate.get(plateKey);
        if (driver) {
          console.log(`  ✅ Mapeado por PLACA: ${driver.name}`);
        } else {
          console.log(`  ❌ Não encontrado por placa`);
        }
      }
      console.log('');
    });
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

testWeeklyCrossover();
