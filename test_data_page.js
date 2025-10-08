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

async function testDataPage() {
  try {
    console.log('🧪 Testando dados para página Data\n');
    console.log('='.repeat(60));
    
    // 1. Buscar weeklyDataSources
    console.log('\n📅 1. Buscando weeklyDataSources...\n');
    const sourcesSnapshot = await db.collection('weeklyDataSources')
      .orderBy('weekStart', 'desc')
      .limit(5)
      .get();
    
    console.log(`✅ Encontrados ${sourcesSnapshot.size} documentos em weeklyDataSources\n`);
    
    sourcesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`   ${data.weekId}: ${data.weekStart} a ${data.weekEnd}`);
    });
    
    // 2. Buscar rawFileArchive
    console.log('\n📦 2. Buscando rawFileArchive...\n');
    const rawSnapshot = await db.collection('rawFileArchive')
      .orderBy('importedAt', 'desc')
      .limit(10)
      .get();
    
    console.log(`✅ Encontrados ${rawSnapshot.size} arquivos em rawFileArchive\n`);
    
    const byWeek = {};
    rawSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!byWeek[data.weekId]) {
        byWeek[data.weekId] = {
          weekStart: data.weekStart,
          weekEnd: data.weekEnd,
          platforms: []
        };
      }
      byWeek[data.weekId].platforms.push(data.platform);
    });
    
    Object.entries(byWeek).forEach(([weekId, info]) => {
      console.log(`   ${weekId}: ${info.weekStart} a ${info.weekEnd}`);
      console.log(`      Plataformas: ${info.platforms.join(', ')}`);
    });
    
    // 3. Simular o que a página Data deveria mostrar
    console.log('\n📊 3. Resumo para página Data:\n');
    
    const weeks = Object.entries(byWeek).map(([weekId, info]) => ({
      weekId,
      weekStart: info.weekStart,
      weekEnd: info.weekEnd,
      totalRawFiles: info.platforms.length,
      platforms: info.platforms
    }));
    
    weeks.forEach(week => {
      console.log(`   Semana: ${week.weekId}`);
      console.log(`   Período: ${week.weekStart} a ${week.weekEnd}`);
      console.log(`   Arquivos: ${week.totalRawFiles}`);
      console.log(`   Plataformas: ${week.platforms.join(', ')}`);
      console.log('');
    });
    
    console.log('='.repeat(60));
    console.log('\n✅ Teste concluído!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

testDataPage();
