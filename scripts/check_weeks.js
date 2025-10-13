const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkWeeks() {
  try {
    console.log('\n📅 Verificando semanas em driverWeeklyRecords...\n');
    
    const snapshot = await db.collection('driverWeeklyRecords')
      .orderBy('weekStart', 'desc')
      .get();
    
    console.log(`Total de registros: ${snapshot.size}\n`);
    
    // Agrupar por weekId
    const weekIdsWithDates = new Map();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.weekId && data.weekStart && data.weekEnd) {
        if (!weekIdsWithDates.has(data.weekId)) {
          weekIdsWithDates.set(data.weekId, {
            weekStart: data.weekStart,
            weekEnd: data.weekEnd,
            count: 0
          });
        }
        const week = weekIdsWithDates.get(data.weekId);
        week.count++;
      }
    });
    
    // Ordenar por weekStart
    const sortedWeeks = Array.from(weekIdsWithDates.entries())
      .sort((a, b) => b[1].weekStart.localeCompare(a[1].weekStart));
    
    console.log('Semanas encontradas (ordenadas por data):');
    console.log('═══════════════════════════════════════════\n');
    
    sortedWeeks.forEach(([weekId, data], index) => {
      const label = index === 0 ? '🔥 ÚLTIMA' : index === 1 ? '📌 ANTERIOR' : '  ';
      console.log(`${label} ${weekId}`);
      console.log(`   Período: ${data.weekStart} até ${data.weekEnd}`);
      console.log(`   Registros: ${data.count} motoristas`);
      console.log('');
    });
    
    // Verificar qual está sendo usado
    if (sortedWeeks.length > 0) {
      const latest = sortedWeeks[0];
      console.log('═══════════════════════════════════════════');
      console.log('✅ Semana que DEVERIA aparecer no dashboard:');
      console.log(`   ${latest[0]} (${latest[1].weekStart} - ${latest[1].weekEnd})`);
      console.log('═══════════════════════════════════════════\n');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkWeeks();
