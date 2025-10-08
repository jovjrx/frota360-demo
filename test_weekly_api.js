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

async function testWeeklyAPI() {
  try {
    console.log('🧪 Testando consulta de dados semanais\n');
    console.log('='.repeat(60));
    
    const weekId = '2025-W40';
    
    // 1. Buscar dados normalizados
    console.log(`\n📊 1. Buscando dados de ${weekId}...\n`);
    const dataSnapshot = await db.collection('dataWeekly')
      .where('weekId', '==', weekId)
      .get();
    
    console.log(`✅ Encontrados ${dataSnapshot.size} registros em dataWeekly\n`);
    
    const byPlatform = {
      uber: 0,
      bolt: 0,
      myprio: 0,
      viaverde: 0
    };
    
    dataSnapshot.docs.forEach(doc => {
      const data = doc.data();
      byPlatform[data.platform]++;
      console.log(`   ${data.platform.toUpperCase()}: ${data.referenceId} = €${data.totalValue}`);
    });
    
    console.log(`\n📈 Resumo por plataforma:`);
    Object.entries(byPlatform).forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} registros`);
    });
    
    // 2. Buscar motoristas
    console.log(`\n👥 2. Buscando motoristas cadastrados...\n`);
    const driversSnapshot = await db.collection('drivers')
      .where('status', '==', 'active')
      .get();
    
    console.log(`✅ Encontrados ${driversSnapshot.size} motoristas ativos\n`);
    
    driversSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   ${data.fullName || data.name}:`);
      if (data.integrations?.uber?.key) console.log(`      Uber: ${data.integrations.uber.key}`);
      if (data.integrations?.bolt?.key) console.log(`      Bolt: ${data.integrations.bolt.key}`);
      if (data.integrations?.myprio?.key) console.log(`      PRIO: ${data.integrations.myprio.key}`);
      if (data.vehicle?.plate) console.log(`      Placa: ${data.vehicle.plate}`);
    });
    
    // 3. Verificar semanas disponíveis
    console.log(`\n📅 3. Verificando semanas disponíveis...\n`);
    const rawSnapshot = await db.collection('rawFileArchive')
      .orderBy('weekStart', 'desc')
      .limit(20)
      .get();
    
    const weeks = new Map();
    rawSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!weeks.has(data.weekId)) {
        weeks.set(data.weekId, {
          weekStart: data.weekStart,
          weekEnd: data.weekEnd,
          platforms: []
        });
      }
      weeks.get(data.weekId).platforms.push(data.platform);
    });
    
    console.log(`✅ Encontradas ${weeks.size} semanas:\n`);
    weeks.forEach((info, wId) => {
      console.log(`   ${wId}: ${info.weekStart} a ${info.weekEnd}`);
      console.log(`      Plataformas: ${info.platforms.join(', ')}`);
    });
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('\n✅ Teste concluído!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

testWeeklyAPI();
