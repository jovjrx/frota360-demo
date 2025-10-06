/**
 * ===============================================================================
 * SCRIPT DE MIGRAÇÃO: Estrutura de Integrações dos Motoristas
 * ===============================================================================
 * 
 * PROBLEMA:
 * - Bolt estava salvando como: integrations.bolt.driverId
 * - myprio estava salvando como: integrations.myprio.enabled
 * - viaverde estava salvando como: integrations.viaverde.enabled
 * 
 * SOLUÇÃO:
 * - Bolt deve ser: integrations.bolt.id
 * - myprio deve ser: cards.myprio (string ou null)
 * - viaverde deve ser: cards.viaverde (string ou null)
 * 
 * USO:
 * npx ts-node scripts/migrate-driver-integrations.ts
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
      // Remover storage bucket para este script
    });
    console.log('✅ Firebase Admin SDK inicializado');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    process.exit(1);
  }
}

const db = getFirestore();

interface OldDriverStructure {
  id: string;
  email?: string;
  integrations?: {
    bolt?: {
      driverId?: string | null;
      id?: string | null;
    };
    myprio?: {
      enabled?: boolean;
    };
    viaverde?: {
      enabled?: boolean;
    };
  };
  cards?: {
    myprio?: string | null;
    viaverde?: string | null;
  };
}

async function migrateDriverIntegrations() {
  console.log('🔄 Iniciando migração da estrutura de integrações dos motoristas...\n');

  try {
    const driversSnapshot = await db.collection('drivers').get();
    
    if (driversSnapshot.empty) {
      console.log('ℹ️  Nenhum motorista encontrado no banco de dados.');
      return;
    }

    let migratedCount = 0;
    let alreadyCorrectCount = 0;

    for (const driverDoc of driversSnapshot.docs) {
      const driverId = driverDoc.id;
      const driverData = driverDoc.data() as OldDriverStructure;
      let needsUpdate = false;
      const updates: any = {};

      console.log(`📋 Verificando motorista: ${driverData.email || driverId}`);

      // 1. Migrar Bolt: driverId → id
      if (driverData.integrations?.bolt?.driverId && !driverData.integrations?.bolt?.id) {
        console.log(`  🔧 Bolt: movendo driverId → id`);
        updates['integrations.bolt.id'] = driverData.integrations.bolt.driverId;
        updates['integrations.bolt.driverId'] = null; // Remove campo antigo
        needsUpdate = true;
      }

      // 2. Migrar myprio: integrations.myprio.enabled → cards.myprio
      if (driverData.integrations?.myprio?.enabled && !driverData.cards?.myprio) {
        console.log(`  🔧 myprio: movendo para cards.myprio`);
        if (!updates['cards']) updates['cards'] = {};
        updates['cards.myprio'] = 'enabled';
        updates['integrations.myprio'] = null; // Remove seção antiga
        needsUpdate = true;
      }

      // 3. Migrar viaverde: integrations.viaverde.enabled → cards.viaverde
      if (driverData.integrations?.viaverde?.enabled && !driverData.cards?.viaverde) {
        console.log(`  🔧 viaverde: movendo para cards.viaverde`);
        if (!updates['cards']) updates['cards'] = {};
        updates['cards.viaverde'] = 'enabled';
        updates['integrations.viaverde'] = null; // Remove seção antiga
        needsUpdate = true;
      }

      if (needsUpdate) {
        await db.collection('drivers').doc(driverId).update(updates);
        console.log(`  ✅ Motorista ${driverId} migrado com sucesso`);
        migratedCount++;
      } else {
        console.log(`  ✅ Motorista ${driverId} já está na estrutura correta`);
        alreadyCorrectCount++;
      }

      console.log(''); // Linha em branco para separar
    }

    console.log('=' .repeat(80));
    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log(`   Motoristas migrados: ${migratedCount}`);
    console.log(`   Já estavam corretos: ${alreadyCorrectCount}`);
    console.log(`   Total processados: ${migratedCount + alreadyCorrectCount}`);
    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar migração
if (require.main === module) {
  migrateDriverIntegrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { migrateDriverIntegrations };