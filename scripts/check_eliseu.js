const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkEliseuData() {
  try {
    console.log('\n🔍 Verificando dados do Eliseu da Silva Lauback...\n');
    
    // Buscar o motorista
    const driversSnapshot = await db.collection('drivers')
      .where('name', '==', 'Eliseu da Silva Lauback')
      .get();
    
    if (driversSnapshot.empty) {
      console.log('❌ Motorista não encontrado');
      return;
    }
    
    const driverDoc = driversSnapshot.docs[0];
    const driverData = driverDoc.data();
    
    console.log('👤 Motorista:', driverData.name);
    console.log('📋 Tipo:', driverData.type);
    console.log('🆔 ID:', driverDoc.id);
    
    // Buscar financiamentos ativos
    const financingSnapshot = await db.collection('financing')
      .where('driverId', '==', driverDoc.id)
      .where('status', '==', 'active')
      .get();
    
    console.log('\n💰 Financiamentos ativos:', financingSnapshot.size);
    
    financingSnapshot.forEach(doc => {
      const f = doc.data();
      console.log('\n  📄 Financiamento:', doc.id);
      console.log('  💵 Valor total:', f.amount);
      console.log('  📅 Semanas:', f.weeks);
      console.log('  📊 Juros semanal:', f.weeklyInterest, '%');
      console.log('  ⏱️ Semanas restantes:', f.remainingWeeks);
      console.log('  🔢 Tipo:', f.type);
    });
    
    // Buscar registro semanal
    const weeklySnapshot = await db.collection('weekly_records')
      .where('driverId', '==', driverDoc.id)
      .orderBy('weekStart', 'desc')
      .limit(1)
      .get();
    
    if (!weeklySnapshot.empty) {
      const weeklyDoc = weeklySnapshot.docs[0];
      const w = weeklyDoc.data();
      
      console.log('\n📊 Último registro semanal:');
      console.log('  Semana:', w.weekStart, '→', w.weekEnd);
      console.log('  Ganhos totais:', w.ganhosTotal?.toFixed(2) || 'N/A');
      console.log('  IVA (6%):', w.ivaValor?.toFixed(2) || 'N/A');
      console.log('  Ganhos após IVA:', w.ganhosMenosIVA?.toFixed(2) || 'N/A');
      console.log('  Despesas Adm:', w.despesasAdm?.toFixed(2) || 'N/A');
      console.log('  Combustível:', w.combustivel?.toFixed(2) || 'N/A');
      console.log('  Via Verde:', w.viaverde?.toFixed(2) || 'N/A');
      console.log('  Aluguel:', w.aluguel?.toFixed(2) || 'N/A');
      console.log('  Repasse:', w.repasse?.toFixed(2) || 'N/A');
      
      // Calcular manualmente
      const ganhos = w.ganhosTotal || 0;
      const iva = ganhos * 0.06;
      const aposIVA = ganhos - iva;
      const admBase = aposIVA * 0.07;
      
      console.log('\n🧮 Cálculo esperado:');
      console.log('  Ganhos:', ganhos.toFixed(2));
      console.log('  IVA (6%):', iva.toFixed(2));
      console.log('  Após IVA:', aposIVA.toFixed(2));
      console.log('  Taxa base (7%):', admBase.toFixed(2));
      
      // Calcular juros do financiamento
      let totalInterest = 0;
      financingSnapshot.forEach(doc => {
        const f = doc.data();
        if (f.weeklyInterest) {
          totalInterest += f.weeklyInterest;
        }
      });
      
      if (totalInterest > 0) {
        const juros = aposIVA * (totalInterest / 100);
        console.log('  Juros (' + totalInterest + '%):', juros.toFixed(2));
        console.log('  Total Desp.Adm esperado:', (admBase + juros).toFixed(2));
        console.log('  Total Desp.Adm no banco:', (w.despesasAdm || 0).toFixed(2));
        console.log('  ❗ Diferença:', ((w.despesasAdm || 0) - (admBase + juros)).toFixed(2));
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

checkEliseuData();
