const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkRawData() {
  try {
    console.log('\n📦 Verificando dados em rawFileArchive...\n');
    
    const snapshot = await db.collection('rawFileArchive')
      .orderBy('weekStart', 'desc')
      .get();
    
    console.log(`Total de arquivos: ${snapshot.size}\n`);
    
    // Agrupar por weekId
    const weeks = new Map();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.weekId) {
        if (!weeks.has(data.weekId)) {
          weeks.set(data.weekId, {
            weekStart: data.weekStart,
            weekEnd: data.weekEnd,
            platforms: []
          });
        }
        weeks.get(data.weekId).platforms.push(data.platform);
      }
    });
    
    const sortedWeeks = Array.from(weeks.entries())
      .sort((a, b) => b[1].weekStart.localeCompare(a[1].weekStart));
    
    console.log('Semanas com dados brutos importados:');
    console.log('═══════════════════════════════════════════\n');
    
    sortedWeeks.forEach(([weekId, data]) => {
      console.log(`📅 ${weekId}`);
      console.log(`   Período: ${data.weekStart} - ${data.weekEnd}`);
      console.log(`   Plataformas: ${data.platforms.join(', ')}`);
      console.log('');
    });
    
    if (sortedWeeks.length === 0) {
      console.log('⚠️  Nenhum dado encontrado em rawFileArchive!');
      console.log('   Você precisa importar os dados na página "Meus Dados"');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkRawData();
