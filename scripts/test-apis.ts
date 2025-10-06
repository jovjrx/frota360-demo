#!/usr/bin/env ts-node

/**
 * Script para testar conexões com APIs externas
 * 
 * Uso: yarn test-apis [platform]
 * 
 * Exemplos:
 *   yarn test-apis uber
 *   yarn test-apis all
 */

import {
  createUberClient,
  createBoltClient,
  createCartrackClient,
  createViaVerdeClient,
  createFonoaClient,
  createMyprioClient,
} from '../lib/integrations';

const platforms = process.argv[2] || 'all';

async function testUber() {
  console.log('\n🚗 Testando Uber API...');
  try {
    const client = await createUberClient();
    const result = await client.testConnection();
    
    if (result.success) {
      console.log('✅ Uber: Conectado com sucesso');
      if (result.lastSync) {
        console.log(`   Última sincronização: ${result.lastSync}`);
      }
    } else {
      console.log(`❌ Uber: ${result.error}`);
    }
  } catch (error: any) {
    console.log(`❌ Uber: ${error.message}`);
  }
}

async function testBolt() {
  console.log('\n⚡ Testando Bolt API...');
  try {
    const client = await createBoltClient();
    const result = await client.testConnection();
    
    if (result.success) {
      console.log('✅ Bolt: Conectado com sucesso');
      if (result.lastSync) {
        console.log(`   Última sincronização: ${result.lastSync}`);
      }
    } else {
      console.log(`❌ Bolt: ${result.error}`);
    }
  } catch (error: any) {
    console.log(`❌ Bolt: ${error.message}`);
  }
}

async function testCartrack() {
  console.log('\n📍 Testando Cartrack API...');
  try {
    const client = await createCartrackClient();
    const result = await client.testConnection();
    
    if (result.success) {
      console.log('✅ Cartrack: Conectado com sucesso');
      if (result.data) {
        console.log(`   Veículos encontrados: ${result.data.vehicleCount || 0}`);
      }
    } else {
      console.log(`❌ Cartrack: ${result.error}`);
    }
  } catch (error: any) {
    console.log(`❌ Cartrack: ${error.message}`);
  }
}

async function testViaVerde() {
  console.log('\n🛣️  Testando ViaVerde...');
  try {
    const client = await createViaVerdeClient();
    const result = await client.testConnection();
    
    if (result.success) {
      console.log('✅ ViaVerde: Conectado com sucesso');
    } else {
      console.log(`❌ ViaVerde: ${result.error}`);
    }
  } catch (error: any) {
    console.log(`❌ ViaVerde: ${error.message}`);
  }
}

async function testFonoa() {
  console.log('\n📄 Testando FONOA...');
  try {
    const client = await createFonoaClient();
    const result = await client.testConnection();
    
    if (result.success) {
      console.log('✅ FONOA: Conectado com sucesso');
    } else {
      console.log(`❌ FONOA: ${result.error}`);
    }
  } catch (error: any) {
    console.log(`❌ FONOA: ${error.message}`);
  }
}

async function testMyprio() {
  console.log('\n💰 Testando myprio...');
  try {
    const client = await createMyprioClient();
    const result = await client.testConnection();
    
    if (result.success) {
      console.log('✅ myprio: Conectado com sucesso');
    } else {
      console.log(`❌ myprio: ${result.error}`);
    }
  } catch (error: any) {
    console.log(`❌ myprio: ${error.message}`);
  }
}

async function testAll() {
  console.log('🔍 Testando todas as APIs...');
  console.log('================================');
  
  await testUber();
  await testBolt();
  await testCartrack();
  await testViaVerde();
  await testFonoa();
  await testMyprio();
  
  console.log('\n================================');
  console.log('✅ Testes concluídos!\n');
}

async function main() {
  console.log('🚀 Conduz PT - Teste de APIs\n');
  
  switch (platforms.toLowerCase()) {
    case 'uber':
      await testUber();
      break;
    case 'bolt':
      await testBolt();
      break;
    case 'cartrack':
      await testCartrack();
      break;
    case 'viaverde':
      await testViaVerde();
      break;
    case 'fonoa':
      await testFonoa();
      break;
    case 'myprio':
      await testMyprio();
      break;
    case 'all':
    default:
      await testAll();
      break;
  }
}

main().catch(console.error);
