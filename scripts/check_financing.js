const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkFinancing() {
  console.log('🔍 Buscando financiamentos ativos...\n');
  
  const snapshot = await db.collection('financing')
    .where('status', '==', 'active')
    .get();

  if (snapshot.empty) {
    console.log('❌ Nenhum financiamento ativo encontrado');
    return;
  }

  console.log(`✅ Encontrados ${snapshot.size} financiamentos ativos:\n`);

  snapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`📄 ID: ${doc.id}`);
    console.log(`👤 Driver: ${data.driverId}`);
    console.log(`📊 Tipo: ${data.type} (${data.type === 'loan' ? 'Empréstimo' : 'Desconto'})`);
    console.log(`💰 Valor: €${data.amount}`);
    console.log(`📅 Semanas: ${data.weeks || 'N/A (desconto vitalício)'}`);
    console.log(`📉 Restantes: ${data.remainingWeeks || 'N/A'}`);
    console.log(`📈 Juros: ${data.weeklyInterest || 0}%`);
    console.log(`🟢 Status: ${data.status}`);
    console.log(`📆 Início: ${data.startDate}`);
    console.log('─'.repeat(60));
  });
}

checkFinancing()
  .then(() => {
    console.log('\n✅ Análise concluída');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
