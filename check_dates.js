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

async function checkDates() {
  try {
    console.log('🔍 Verificando formato de datas\n');
    
    // Verificar rawFileArchive
    const rawSnapshot = await db.collection('rawFileArchive').limit(1).get();
    
    if (!rawSnapshot.empty) {
      const data = rawSnapshot.docs[0].data();
      console.log('📦 rawFileArchive:');
      console.log(`   weekStart: "${data.weekStart}" (tipo: ${typeof data.weekStart})`);
      console.log(`   weekEnd: "${data.weekEnd}" (tipo: ${typeof data.weekEnd})`);
      console.log('');
    }
    
    // Verificar dataWeekly
    const dataSnapshot = await db.collection('dataWeekly').limit(1).get();
    
    if (!dataSnapshot.empty) {
      const data = dataSnapshot.docs[0].data();
      console.log('📊 dataWeekly:');
      console.log(`   weekStart: "${data.weekStart}" (tipo: ${typeof data.weekStart})`);
      console.log(`   weekEnd: "${data.weekEnd}" (tipo: ${typeof data.weekEnd})`);
      console.log('');
    }
    
    // Testar conversão
    const testDate = '2025-09-29';
    console.log('🧪 Teste de conversão:');
    console.log(`   String original: "${testDate}"`);
    console.log(`   new Date(): ${new Date(testDate).toISOString()}`);
    console.log(`   toLocaleDateString('pt-PT'): ${new Date(testDate).toLocaleDateString('pt-PT')}`);
    console.log(`   toLocaleDateString('pt-BR'): ${new Date(testDate).toLocaleDateString('pt-BR')}`);
    console.log('');
    
    // Solução correta
    console.log('✅ Solução: Usar formatação sem conversão de timezone');
    console.log(`   const [year, month, day] = "${testDate}".split('-');`);
    console.log(`   new Date(year, month - 1, day).toLocaleDateString('pt-PT')`);
    console.log(`   Resultado: ${new Date(2025, 8, 29).toLocaleDateString('pt-PT')}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkDates();
