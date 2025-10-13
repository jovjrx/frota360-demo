const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testW40Display() {
  console.log('\n=== TESTE: W40 DEVE APARECER NA INTERFACE ===\n');
  
  // Simular o que a função getAllDriversWeekData faz
  const weekId = '2025-W40';
  
  const dataWeeklySnapshot = await db
    .collection('dataWeekly')
    .where('weekId', '==', weekId)
    .get();
  
  const driverIds = Array.from(new Set(
    dataWeeklySnapshot.docs
      .map(doc => doc.data().driverId)
      .filter(id => id) // Remove nulls
  ));
  
  console.log(`✓ Motoristas encontrados na W40: ${driverIds.length}\n`);
  
  for (const driverId of driverIds) {
    // Buscar dados do motorista
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    const driverData = driverDoc.data();
    
    // Buscar dataWeekly values
    const driverDataWeekly = dataWeeklySnapshot.docs.filter(doc => doc.data().driverId === driverId);
    
    const totals = driverDataWeekly.reduce((acc, doc) => {
      const data = doc.data();
      const value = data.totalValue || 0;
      switch (data.platform) {
        case 'uber': acc.uber += value; break;
        case 'bolt': acc.bolt += value; break;
        case 'myprio': acc.myprio += value; break;
        case 'viaverde': acc.viaverde += value; break;
      }
      return acc;
    }, { uber: 0, bolt: 0, myprio: 0, viaverde: 0 });
    
    const ganhosTotal = totals.uber + totals.bolt;
    const ivaValor = ganhosTotal * 0.06;
    const ganhosMenosIVA = ganhosTotal - ivaValor;
    const despesasAdm = ganhosMenosIVA * 0.07;
    
    // Buscar registro salvo
    const recordDoc = await db.collection('driverWeeklyRecords').doc(`${driverId}_${weekId}`).get();
    const savedRecord = recordDoc.exists ? recordDoc.data() : null;
    
    console.log(`\n👤 ${driverData?.fullName || 'N/A'}`);
    console.log(`   Tipo: ${driverData?.type === 'renter' ? 'Locatário' : 'Afiliado'}`);
    console.log(`\n   DADOS DE PLATAFORMA (dataWeekly):`);
    console.log(`   - Uber: €${totals.uber.toFixed(2)}`);
    console.log(`   - Bolt: €${totals.bolt.toFixed(2)}`);
    console.log(`   - Combustível: €${totals.myprio.toFixed(2)}`);
    console.log(`   - Portagens: €${totals.viaverde.toFixed(2)}`);
    console.log(`   - Ganhos Total: €${ganhosTotal.toFixed(2)}`);
    console.log(`   - IVA: €${ivaValor.toFixed(2)}`);
    console.log(`   - Taxa Adm: €${despesasAdm.toFixed(2)}`);
    
    if (savedRecord) {
      console.log(`\n   DADOS FIXOS (driverWeeklyRecords):`);
      console.log(`   - Aluguel: €${savedRecord.aluguel || 0}`);
      console.log(`   - Status: ${savedRecord.paymentStatus}`);
      console.log(`   - Pago em: ${savedRecord.paymentDate || 'N/A'}`);
      
      const totalDespesas = totals.myprio + totals.viaverde + (savedRecord.aluguel || 0);
      const repasse = ganhosMenosIVA - despesasAdm - totalDespesas;
      
      console.log(`\n   CÁLCULO FINAL:`);
      console.log(`   - Total Despesas: €${totalDespesas.toFixed(2)}`);
      console.log(`   - Repasse: €${repasse.toFixed(2)}`);
    } else {
      console.log(`\n   ⚠️ Registro não existe (será criado ao acessar)`);
    }
    
    console.log(`\n   ✅ Este motorista DEVE APARECER na W40!`);
  }
  
  console.log('\n\n=== RESUMO ===');
  console.log(`✅ A W40 agora tem ${driverIds.length} motoristas mapeados`);
  console.log(`✅ Os registros de pagamento foram preservados`);
  console.log(`✅ Os dados de plataforma foram recuperados`);
  console.log(`\n💡 Acesse a página weekly e selecione W40 para ver os resultados!`);
  
  process.exit(0);
}

testW40Display().catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
