/**
 * ===============================================================================
 * SCRIPT DE MIGRAÇÃO: Nova Estrutura Unificada de Integrações
 * ===============================================================================
 * 
 * OBJETIVO:
 * Migrar dados existentes para a nova estrutura unificada de integrações
 * 
 * ESTRUTURA ANTIGA:
 * integrations: {
 *   uber: { uuid, name },
 *   bolt: { id, email }
 * },
 * cards: { myprio, viaverde }
 * 
 * ESTRUTURA NOVA:
 * integrations: {
 *   uber: { key: uuid, enabled },
 *   bolt: { key: email, enabled },
 *   myprio: { key: cardNumber, enabled },
 *   viaverde: { key: plate, enabled }
 * }
 * 
 * USO:
 * npx tsx scripts/migrate-to-unified-integrations.ts
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

interface OldDriver {
  integrations?: {
    uber?: {
      uuid?: string | null;
      name?: string | null;
    };
    bolt?: {
      id?: string | null;
      email?: string | null;
    };
  };
  cards?: {
    myprio?: string | null;
    viaverde?: string | null;
  };
  vehicle?: {
    plate?: string;
  };
  email?: string;
}

async function migrateToUnifiedIntegrations() {
  console.log('🔄 Migrando para nova estrutura unificada de integrações...\n');

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
      const driverData = driverDoc.data() as OldDriver;
      
      console.log(`📋 Processando motorista: ${driverData.email || driverId}`);

      const updates: any = {};
      let needsUpdate = false;

      // Verificar se já está na nova estrutura
      if (driverData.integrations?.uber?.hasOwnProperty('key') || 
          driverData.integrations?.bolt?.hasOwnProperty('key') ||
          driverData.integrations?.hasOwnProperty('myprio') ||
          driverData.integrations?.hasOwnProperty('viaverde')) {
        console.log(`  ✅ Já está na nova estrutura`);
        alreadyCorrectCount++;
        continue;
      }

      // Migrar estrutura de integrações
      const newIntegrations: any = {};

      // 1. Uber: uuid → key
      if (driverData.integrations?.uber) {
        newIntegrations.uber = {
          key: driverData.integrations.uber.uuid || null,
          enabled: !!driverData.integrations.uber.uuid,
          lastSync: null,
        };
        console.log(`  🔧 Uber: ${driverData.integrations.uber.uuid ? 'ativo' : 'inativo'}`);
      } else {
        newIntegrations.uber = {
          key: null,
          enabled: false,
          lastSync: null,
        };
      }

      // 2. Bolt: email principal → key
      if (driverData.integrations?.bolt) {
        newIntegrations.bolt = {
          key: driverData.integrations.bolt.email || driverData.email || null,
          enabled: !!(driverData.integrations.bolt.email || driverData.email),
          lastSync: null,
        };
        console.log(`  🔧 Bolt: ${newIntegrations.bolt.key ? 'ativo' : 'inativo'}`);
      } else {
        newIntegrations.bolt = {
          key: driverData.email || null,
          enabled: false, // Desabilitado por padrão
          lastSync: null,
        };
      }

      // 3. myprio: cards.myprio → integrations.myprio.key
      if (driverData.cards?.myprio) {
        newIntegrations.myprio = {
          key: driverData.cards.myprio,
          enabled: true,
          lastSync: null,
        };
        console.log(`  🔧 myprio: ativo (${driverData.cards.myprio})`);
      } else {
        newIntegrations.myprio = {
          key: null,
          enabled: false,
          lastSync: null,
        };
      }

      // 4. viaverde: cards.viaverde ou vehicle.plate → integrations.viaverde.key
      const viaverdeKey = driverData.cards?.viaverde || driverData.vehicle?.plate || null;
      if (viaverdeKey) {
        newIntegrations.viaverde = {
          key: viaverdeKey,
          enabled: !!driverData.cards?.viaverde, // Só ativo se estava em cards
          lastSync: null,
        };
        console.log(`  🔧 viaverde: ${newIntegrations.viaverde.enabled ? 'ativo' : 'inativo'} (${viaverdeKey})`);
      } else {
        newIntegrations.viaverde = {
          key: null,
          enabled: false,
          lastSync: null,
        };
      }

      // Atualizar documento
      updates.integrations = newIntegrations;
      
      // Remover campos antigos se existirem
      if (driverData.cards) {
        updates.cards = admin.firestore.FieldValue.delete();
      }

      needsUpdate = true;

      if (needsUpdate) {
        await db.collection('drivers').doc(driverId).update(updates);
        console.log(`  ✅ Motorista ${driverId} migrado com sucesso`);
        migratedCount++;
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
  migrateToUnifiedIntegrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { migrateToUnifiedIntegrations };