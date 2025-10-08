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

function normalizeKey(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase();
}

function normalizePlate(value) {
  if (!value) return '';
  return String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function diagnose() {
  try {
    console.log('🔍 DIAGNÓSTICO DE MAPEAMENTO DE MOTORISTAS\n');
    console.log('='.repeat(60));
    
    // 1. Buscar motoristas
    console.log('\n📋 1. MOTORISTAS CADASTRADOS\n');
    const driversSnapshot = await db.collection('drivers').get();
    
    if (driversSnapshot.empty) {
      console.log('❌ PROBLEMA: Nenhum motorista cadastrado!');
      console.log('   Solução: Cadastre motoristas em /admin/drivers\n');
      return;
    }
    
    console.log(`✅ Total de motoristas: ${driversSnapshot.size}\n`);
    
    const drivers = [];
    driversSnapshot.forEach(doc => {
      const data = doc.data();
      const driver = {
        id: doc.id,
        name: data.fullName || data.name || data.email || 'Sem nome',
        type: data.type || 'affiliate',
        status: data.status || 'active',
        integrations: {
          uber: data.integrations?.uber?.key || null,
          bolt: data.integrations?.bolt?.key || null,
          myprio: data.integrations?.myprio?.key || null,
          viaverde: data.integrations?.viaverde?.key || null,
        },
        vehiclePlate: data.vehicle?.plate || null,
      };
      drivers.push(driver);
      
      console.log(`   ${driver.name} (${driver.id})`);
      console.log(`   Status: ${driver.status} | Tipo: ${driver.type}`);
      console.log(`   Uber Key: ${driver.integrations.uber || '❌ NÃO CONFIGURADO'}`);
      console.log(`   Bolt Key: ${driver.integrations.bolt || '❌ NÃO CONFIGURADO'}`);
      console.log(`   Prio Key: ${driver.integrations.myprio || '❌ NÃO CONFIGURADO'}`);
      console.log(`   ViaVerde: ${driver.integrations.viaverde || driver.vehiclePlate || '❌ NÃO CONFIGURADO'}`);
      console.log(`   Placa: ${driver.vehiclePlate || '❌ NÃO CONFIGURADO'}`);
      console.log('');
    });
    
    // 2. Buscar dados importados
    console.log('='.repeat(60));
    console.log('\n📊 2. DADOS IMPORTADOS (dataWeekly)\n');
    const dataSnapshot = await db.collection('dataWeekly').where('weekId', '==', '2025-W40').get();
    
    if (dataSnapshot.empty) {
      console.log('⚠️  Nenhum dado importado para a semana 2025-W40\n');
      return;
    }
    
    console.log(`Total de registros: ${dataSnapshot.size}\n`);
    
    const unmapped = [];
    
    dataSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   Plataforma: ${data.platform.toUpperCase()}`);
      console.log(`   Referência: ${data.referenceId}`);
      console.log(`   Label: ${data.referenceLabel || 'N/A'}`);
      console.log(`   Valor: €${data.totalValue}`);
      console.log(`   Motorista mapeado: ${data.driverId ? '✅ ' + data.driverName : '❌ NÃO MAPEADO'}`);
      
      if (!data.driverId) {
        unmapped.push({
          platform: data.platform,
          referenceId: data.referenceId,
          referenceLabel: data.referenceLabel,
          normalizedRef: normalizeKey(data.referenceId),
          normalizedLabel: normalizePlate(data.referenceLabel || data.referenceId),
        });
      }
      console.log('');
    });
    
    // 3. Análise de mapeamento
    if (unmapped.length > 0) {
      console.log('='.repeat(60));
      console.log('\n🔴 3. ANÁLISE DE MAPEAMENTO\n');
      console.log(`${unmapped.length} registro(s) não mapeado(s)\n`);
      
      unmapped.forEach(record => {
        console.log(`   Plataforma: ${record.platform.toUpperCase()}`);
        console.log(`   Referência original: ${record.referenceId}`);
        console.log(`   Referência normalizada: ${record.normalizedRef}`);
        if (record.referenceLabel) {
          console.log(`   Label: ${record.referenceLabel}`);
          console.log(`   Label normalizada: ${record.normalizedLabel}`);
        }
        
        // Tentar encontrar motorista correspondente
        let found = false;
        drivers.forEach(driver => {
          if (record.platform === 'uber' && driver.integrations.uber) {
            if (normalizeKey(driver.integrations.uber) === record.normalizedRef) {
              console.log(`   ✅ MATCH: ${driver.name} (uber key: ${driver.integrations.uber})`);
              found = true;
            }
          }
          if (record.platform === 'bolt' && driver.integrations.bolt) {
            if (normalizeKey(driver.integrations.bolt) === record.normalizedRef) {
              console.log(`   ✅ MATCH: ${driver.name} (bolt key: ${driver.integrations.bolt})`);
              found = true;
            }
          }
          if (record.platform === 'myprio') {
            if (driver.integrations.myprio && normalizeKey(driver.integrations.myprio) === record.normalizedRef) {
              console.log(`   ✅ MATCH: ${driver.name} (prio card: ${driver.integrations.myprio})`);
              found = true;
            }
            if (driver.vehiclePlate && normalizePlate(driver.vehiclePlate) === record.normalizedLabel) {
              console.log(`   ✅ MATCH: ${driver.name} (placa: ${driver.vehiclePlate})`);
              found = true;
            }
          }
          if (record.platform === 'viaverde') {
            if (driver.vehiclePlate && normalizePlate(driver.vehiclePlate) === record.normalizedLabel) {
              console.log(`   ✅ MATCH: ${driver.name} (placa: ${driver.vehiclePlate})`);
              found = true;
            }
            if (driver.integrations.viaverde && normalizeKey(driver.integrations.viaverde) === record.normalizedRef) {
              console.log(`   ✅ MATCH: ${driver.name} (viaverde key: ${driver.integrations.viaverde})`);
              found = true;
            }
          }
        });
        
        if (!found) {
          console.log(`   ❌ NENHUM MOTORISTA ENCONTRADO`);
          console.log(`   💡 Solução: Cadastre um motorista com:`);
          if (record.platform === 'uber') {
            console.log(`      integrations.uber.key = "${record.referenceId}"`);
          } else if (record.platform === 'bolt') {
            console.log(`      integrations.bolt.key = "${record.referenceId}"`);
          } else if (record.platform === 'myprio') {
            console.log(`      integrations.myprio.key = "${record.referenceId}"`);
            if (record.referenceLabel) {
              console.log(`      OU vehicle.plate = "${record.referenceLabel}"`);
            }
          } else if (record.platform === 'viaverde') {
            if (record.referenceLabel) {
              console.log(`      vehicle.plate = "${record.referenceLabel}"`);
            }
            console.log(`      OU integrations.viaverde.key = "${record.referenceId}"`);
          }
        }
        console.log('');
      });
    } else {
      console.log('='.repeat(60));
      console.log('\n✅ Todos os registros estão mapeados!\n');
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

diagnose();
