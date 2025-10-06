/**
 * ===============================================================================
 * SCRIPT DE TESTE: Adicionar dados de integração para motoristas existentes
 * ===============================================================================
 * 
 * OBJETIVO:
 * Adicionar dados de teste para verificar se as colunas da tabela estão funcionando
 * 
 * USO:
 * npx tsx scripts/add-test-integration-data.ts
 * 
 * ===============================================================================
 */

import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

// Inicializar Firebase Admin apenas com Firestore
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../conduz-pt.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin SDK inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    process.exit(1);
  }
}

const db = getFirestore();

async function addTestIntegrationData() {
  console.log('🔄 Adicionando dados de teste para integrações...\n');

  try {
    const driversSnapshot = await db.collection('drivers').get();
    
    if (driversSnapshot.empty) {
      console.log('ℹ️  Nenhum motorista encontrado no banco de dados.');
      return;
    }

    let updatedCount = 0;

    for (const driverDoc of driversSnapshot.docs) {
      const driverId = driverDoc.id;
      const driverData = driverDoc.data();

      console.log(`📋 Processando motorista: ${driverData.email || driverId}`);

      const updates: any = {};
      let needsUpdate = false;

      // Adicionar dados de integração de teste se não existirem
      if (!driverData.integrations?.uber?.uuid) {
        updates['integrations.uber.uuid'] = `uber_${driverId.slice(0, 8)}`;
        updates['integrations.uber.name'] = driverData.fullName || 'Nome Teste';
        updates['integrations.uber.enabled'] = true;
        needsUpdate = true;
        console.log(`  🔧 Adicionando UUID Uber de teste`);
      }

      if (!driverData.integrations?.bolt?.id) {
        updates['integrations.bolt.id'] = `bolt_${Math.floor(Math.random() * 100000)}`;
        updates['integrations.bolt.email'] = driverData.email || 'teste@bolt.eu';
        updates['integrations.bolt.enabled'] = true;
        needsUpdate = true;
        console.log(`  🔧 Adicionando ID Bolt de teste`);
      }

      if (!driverData.cards?.myprio) {
        updates['cards.myprio'] = `${Math.floor(Math.random() * 900000) + 100000}`;
        needsUpdate = true;
        console.log(`  🔧 Adicionando cartão myprio de teste`);
      }

      if (!driverData.cards?.viaverde) {
        updates['cards.viaverde'] = `${Math.floor(Math.random() * 900000) + 100000}`;
        needsUpdate = true;
        console.log(`  🔧 Adicionando cartão ViaVerde de teste`);
      }

      if (!driverData.banking?.iban) {
        updates['banking.iban'] = 'PT50003300004555698867005';
        updates['banking.accountHolder'] = driverData.fullName || 'Titular Teste';
        needsUpdate = true;
        console.log(`  🔧 Adicionando IBAN de teste`);
      }

      if (needsUpdate) {
        await db.collection('drivers').doc(driverId).update(updates);
        console.log(`  ✅ Motorista ${driverId} atualizado com dados de teste`);
        updatedCount++;
      } else {
        console.log(`  ✅ Motorista ${driverId} já tem todos os dados`);
      }

      console.log(''); // Linha em branco para separar
    }

    console.log('=' .repeat(80));
    console.log('📊 RESUMO:');
    console.log(`   Motoristas atualizados: ${updatedCount}`);
    console.log(`   Total processados: ${driversSnapshot.docs.length}`);
    console.log('✅ Dados de teste adicionados com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao adicionar dados de teste:', error);
    process.exit(1);
  }
}

// Executar script
if (require.main === module) {
  addTestIntegrationData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { addTestIntegrationData };