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

async function checkDataWeekly() {
  try {
    console.log('🔍 Consultando coleção dataWeekly...\n');
    
    const snapshot = await db.collection('dataWeekly').get();
    
    if (snapshot.empty) {
      console.log('⚠️  Coleção dataWeekly está vazia');
      return;
    }
    
    console.log(`✅ Total de documentos: ${snapshot.size}\n`);
    
    const platforms = {
      uber: 0,
      bolt: 0,
      myprio: 0,
      viaverde: 0,
      other: 0
    };
    
    const byWeek = new Map();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (platforms.hasOwnProperty(data.platform)) {
        platforms[data.platform]++;
      } else {
        platforms.other++;
      }
      
      if (!byWeek.has(data.weekId)) {
        byWeek.set(data.weekId, {
          weekId: data.weekId,
          weekStart: data.weekStart,
          weekEnd: data.weekEnd,
          platforms: { uber: 0, bolt: 0, myprio: 0, viaverde: 0 },
          withDriver: 0,
          withoutDriver: 0
        });
      }
      
      const weekData = byWeek.get(data.weekId);
      if (weekData.platforms.hasOwnProperty(data.platform)) {
        weekData.platforms[data.platform]++;
      }
      
      if (data.driverId) {
        weekData.withDriver++;
      } else {
        weekData.withoutDriver++;
      }
    });
    
    console.log('📊 Resumo por plataforma:');
    console.log(`   Uber: ${platforms.uber}`);
    console.log(`   Bolt: ${platforms.bolt}`);
    console.log(`   MyPrio: ${platforms.myprio}`);
    console.log(`   ViaVerde: ${platforms.viaverde}`);
    console.log(`   Outros: ${platforms.other}`);
    console.log('');
    
    console.log('📅 Resumo por semana:');
    Array.from(byWeek.values()).forEach(week => {
      console.log(`\n   Semana: ${week.weekId} (${week.weekStart} a ${week.weekEnd})`);
      console.log(`   Uber: ${week.platforms.uber} | Bolt: ${week.platforms.bolt} | Prio: ${week.platforms.myprio} | ViaVerde: ${week.platforms.viaverde}`);
      console.log(`   Com motorista: ${week.withDriver} | Sem motorista: ${week.withoutDriver}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao consultar Firebase:', error);
  } finally {
    process.exit(0);
  }
}

checkDataWeekly();
