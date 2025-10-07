/**
 * ===============================================================================
 * SCRIPT DE ANÁLISE: Estrutura dos Motoristas no Firebase
 * ===============================================================================
 * 
 * OBJETIVO:
 * Mostrar a estrutura completa dos motoristas cadastrados para análise
 * 
 * USO:
 * npx tsx scripts/show-drivers-structure.ts
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

function formatValue(value: any, indent = 0): string {
  const spaces = '  '.repeat(indent);
  
  if (value === null) return `${spaces}null`;
  if (value === undefined) return `${spaces}undefined`;
  if (typeof value === 'string') return `${spaces}"${value}"`;
  if (typeof value === 'number' || typeof value === 'boolean') return `${spaces}${value}`;
  
  if (Array.isArray(value)) {
    if (value.length === 0) return `${spaces}[]`;
    const items = value.map(item => formatValue(item, indent + 1)).join(',\n');
    return `${spaces}[\n${items}\n${spaces}]`;
  }
  
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return `${spaces}{}`;
    
    const items = keys.map(key => {
      const formattedValue = formatValue(value[key], indent + 1);
      return `${spaces}  ${key}: ${formattedValue.trim()}`;
    }).join(',\n');
    
    return `${spaces}{\n${items}\n${spaces}}`;
  }
  
  return `${spaces}${String(value)}`;
}

async function showDriversStructure() {
  console.log('🔍 ANÁLISE DA ESTRUTURA DOS MOTORISTAS NO FIREBASE\n');
  console.log('=' .repeat(80));

  try {
    const driversSnapshot = await db.collection('drivers').orderBy('email').get();
    
    if (driversSnapshot.empty) {
      console.log('ℹ️  Nenhum motorista encontrado no banco de dados.');
      return;
    }

    console.log(`📊 Total de motoristas: ${driversSnapshot.docs.length}\n`);

    for (const driverDoc of driversSnapshot.docs) {
      const driverId = driverDoc.id;
      const driverData = driverDoc.data();

      console.log(`👤 MOTORISTA: ${driverData.fullName || driverData.email}`);
      console.log('-' .repeat(80));
      console.log(`📧 Email: ${driverData.email}`);
      console.log(`🆔 ID: ${driverId}`);
      console.log(`📱 Phone: ${driverData.phone || 'N/A'}`);
      console.log(`📊 Status: ${driverData.status || 'N/A'}`);
      console.log(`🏷️  Type: ${driverData.type || 'N/A'}`);
      
      console.log('\n🔗 INTEGRAÇÕES:');
      if (driverData.integrations) {
        console.log(formatValue(driverData.integrations, 1));
      } else {
        console.log('  ❌ Nenhuma integração configurada');
      }
      
      console.log('\n💳 CARTÕES:');
      if (driverData.cards) {
        console.log(formatValue(driverData.cards, 1));
      } else {
        console.log('  ❌ Nenhum cartão configurado');
      }
      
      console.log('\n🏦 DADOS BANCÁRIOS:');
      if (driverData.banking) {
        console.log(formatValue(driverData.banking, 1));
      } else {
        console.log('  ❌ Nenhum dado bancário configurado');
      }
      
      console.log('\n🚗 VEÍCULO:');
      if (driverData.vehicle && Object.keys(driverData.vehicle).length > 0) {
        console.log(formatValue(driverData.vehicle, 1));
      } else {
        console.log('  ❌ Nenhum veículo configurado');
      }
      
      console.log('\n📅 TIMESTAMPS:');
      console.log(`  createdAt: ${driverData.createdAt || 'N/A'}`);
      console.log(`  updatedAt: ${driverData.updatedAt || 'N/A'}`);
      
      console.log('\n' + '=' .repeat(80) + '\n');
    }

    // Resumo para importação
    console.log('📋 RESUMO PARA IMPORTAÇÃO:');
    console.log('-' .repeat(80));
    
    for (const driverDoc of driversSnapshot.docs) {
      const driverData = driverDoc.data();
      const name = driverData.fullName || driverData.email;
      
      console.log(`\n👤 ${name}:`);
      console.log(`   📧 Email: ${driverData.email}`);
      
      // Uber
      const uberUuid = driverData.integrations?.uber?.uuid;
      console.log(`   🚗 Uber UUID: ${uberUuid || '❌ NÃO CONFIGURADO'}`);
      
      // Bolt
      const boltId = driverData.integrations?.bolt?.id;
      console.log(`   ⚡ Bolt ID: ${boltId || '❌ NÃO CONFIGURADO'}`);
      
      // myprio
      const myprioCard = driverData.cards?.myprio;
      console.log(`   ⛽ myprio: ${myprioCard || '❌ NÃO CONFIGURADO'}`);
      
      // ViaVerde
      const viaverdeCard = driverData.cards?.viaverde;
      console.log(`   🛣️  ViaVerde: ${viaverdeCard || '❌ NÃO CONFIGURADO'}`);
      
      // IBAN
      const iban = driverData.banking?.iban;
      console.log(`   🏦 IBAN: ${iban ? `${iban.slice(0, 8)}...${iban.slice(-4)}` : '❌ NÃO CONFIGURADO'}`);
    }

    console.log('\n✅ Análise concluída!');

  } catch (error) {
    console.error('❌ Erro ao analisar estrutura:', error);
    process.exit(1);
  }
}

// Executar script
if (require.main === module) {
  showDriversStructure()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { showDriversStructure };