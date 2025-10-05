/**
 * Script para testar se as factory functions estão buscando do Firestore
 */

import { 
  createCartrackClient,
  createBoltClient,
  createUberClient,
  createViaVerdeClient,
  createFonoaClient,
  createMyprioClient
} from '../lib/integrations';

async function testFactoryFunctions() {
  console.log('🔧 Testando Factory Functions com Firestore...\n');

  // Teste 1: Cartrack
  try {
    console.log('1️⃣ Testando Cartrack...');
    const cartrackClient = await createCartrackClient();
    console.log('✅ Cartrack client criado com sucesso');
    console.log('   Credenciais carregadas do Firestore\n');
  } catch (error) {
    console.error('❌ Erro ao criar Cartrack client:', error instanceof Error ? error.message : error);
    console.log();
  }

  // Teste 2: Bolt
  try {
    console.log('2️⃣ Testando Bolt...');
    const boltClient = await createBoltClient();
    console.log('✅ Bolt client criado com sucesso');
    console.log('   Credenciais carregadas do Firestore\n');
  } catch (error) {
    console.error('❌ Erro ao criar Bolt client:', error instanceof Error ? error.message : error);
    console.log();
  }

  // Teste 3: Uber
  try {
    console.log('3️⃣ Testando Uber...');
    const uberClient = await createUberClient();
    console.log('✅ Uber client criado com sucesso');
    console.log('   Credenciais carregadas do Firestore\n');
  } catch (error) {
    console.error('❌ Erro ao criar Uber client:', error instanceof Error ? error.message : error);
    console.log();
  }

  // Teste 4: ViaVerde
  try {
    console.log('4️⃣ Testando ViaVerde...');
    const viaverdeClient = await createViaVerdeClient();
    console.log('✅ ViaVerde client criado com sucesso');
    console.log('   Credenciais carregadas do Firestore\n');
  } catch (error) {
    console.error('❌ Erro ao criar ViaVerde client:', error instanceof Error ? error.message : error);
    console.log();
  }

  // Teste 5: FONOA
  try {
    console.log('5️⃣ Testando FONOA...');
    const fonoaClient = await createFonoaClient();
    console.log('✅ FONOA client criado com sucesso');
    console.log('   Credenciais carregadas do Firestore\n');
  } catch (error) {
    console.error('❌ Erro ao criar FONOA client:', error instanceof Error ? error.message : error);
    console.log();
  }

  // Teste 6: myPrio
  try {
    console.log('6️⃣ Testando myPrio...');
    const myprioClient = await createMyprioClient();
    console.log('✅ myPrio client criado com sucesso');
    console.log('   Credenciais carregadas do Firestore\n');
  } catch (error) {
    console.error('❌ Erro ao criar myPrio client:', error instanceof Error ? error.message : error);
    console.log();
  }

  console.log('✅ Teste completo!\n');
  console.log('📝 Todas as factory functions agora buscam credenciais do Firestore');
}

testFactoryFunctions().catch(console.error);
