/**
 * ============================================================================
 * TESTE: Integração Cartrack Portugal
 * ============================================================================
 * 
 * Testa a integração com Cartrack usando credenciais do Firestore
 * 
 * COMO USAR:
 * ```bash
 * # 1. Configure as credenciais no Firestore primeiro
 * npx tsx scripts/setup-integrations.ts
 * 
 * # 2. Execute o teste
 * npx tsx scripts/test-cartrack.ts
 * ```
 * 
 * ============================================================================
 */

import { createCartrackClient, createCartrackClientFromEnv } from '../lib/integrations/cartrack/client';
import integrationService from '../lib/integrations/integration-service';

async function testCartrack() {
  console.log('\n' + '='.repeat(70));
  console.log('🚗 TESTE: CARTRACK PORTUGAL API');
  console.log('='.repeat(70) + '\n');

  try {
    // Tentar criar cliente do Firestore
    console.log('📦 Buscando credenciais do Firestore...');
    let client;
    
    try {
      client = await createCartrackClient();
      console.log('✅ Cliente criado do Firestore (com cache)\n');
    } catch (firestoreError) {
      console.log('⚠️  Firestore não disponível, usando .env');
      console.log(`   Motivo: ${firestoreError}`);
      console.log('   💡 Execute: npx tsx scripts/setup-integrations.ts\n');
      
      // Fallback para variáveis de ambiente
      client = createCartrackClientFromEnv();
      console.log('✅ Cliente criado de variáveis de ambiente\n');
    }

    // 1. Testar conexão
    console.log('━'.repeat(70));
    console.log('1️⃣  TESTE DE CONEXÃO');
    console.log('━'.repeat(70));
    
    const connectionTest = await client.testConnection();
    
    if (connectionTest.success) {
      console.log('✅ Conexão: SUCESSO');
      
      // Registrar sucesso no Firestore
      await integrationService.recordSuccess('cartrack').catch(() => {});
    } else {
      console.log(`❌ Conexão: FALHOU`);
      console.log(`   Erro: ${connectionTest.error}`);
      
      // Registrar erro no Firestore
      await integrationService.recordError('cartrack', connectionTest.error || 'Erro desconhecido').catch(() => {});
      return;
    }

    // 2. Buscar veículos
    console.log('\n' + '━'.repeat(70));
    console.log('2️⃣  BUSCAR VEÍCULOS');
    console.log('━'.repeat(70));
    
    const vehicles = await client.getVehicles();
    console.log(`✅ Encontrados ${vehicles.length} veículos`);
    
    if (vehicles.length > 0) {
      console.log('\n📋 Primeiros 3 veículos:');
      vehicles.slice(0, 3).forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.plate} - ${v.make} ${v.model} (${v.year})`);
        console.log(`      Status: ${v.status}, Km: ${v.kilometers?.toLocaleString() || 'N/A'}`);
      });
    } else {
      console.log('ℹ️  Nenhum veículo registrado na conta');
    }

    // 3. Buscar viagens (últimos 7 dias)
    console.log('\n' + '━'.repeat(70));
    console.log('3️⃣  BUSCAR VIAGENS (Últimos 7 dias)');
    console.log('━'.repeat(70));
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`📅 Período: ${startDateStr} até ${endDateStr}`);
    
    const trips = await client.getTrips(startDateStr, endDateStr);
    console.log(`✅ Encontradas ${trips.length} viagens`);
    
    if (trips.length > 0) {
      console.log('\n🚕 Primeiras 3 viagens:');
      trips.slice(0, 3).forEach((trip, i) => {
        console.log(`   ${i + 1}. ${trip.startAddress || 'N/A'} → ${trip.endAddress || 'N/A'}`);
        console.log(`      Distância: ${trip.distance?.toFixed(2) || 'N/A'} km`);
        console.log(`      Duração: ${trip.duration || 'N/A'} min`);
      });
    }

    // 4. Buscar métricas
    console.log('\n' + '━'.repeat(70));
    console.log('4️⃣  MÉTRICAS CONSOLIDADAS');
    console.log('━'.repeat(70));
    
    const metrics = await client.getMetrics(startDateStr, endDateStr);
    
    console.log(`\n📊 Resumo do período:`);
    console.log(`   🚗 Veículos: ${metrics.totalVehicles || 0} total (${metrics.activeVehicles || 0} ativos)`);
    console.log(`   🚕 Viagens: ${metrics.totalTrips || 0} viagens, ${(metrics.totalDistance || 0).toFixed(1)} km`);
    console.log(`   ⛽ Combustível: ${(metrics.totalFuel || 0).toFixed(1)}L, €${(metrics.fuelCost || 0).toFixed(2)}`);
    console.log(`   🔧 Manutenção: €${(metrics.maintenanceCost || 0).toFixed(2)} (${metrics.maintenanceEvents || 0} eventos)`);
    console.log(`   💰 Total de despesas: €${(metrics.totalCost || 0).toFixed(2)}`);

    // 5. Cache stats
    console.log('\n' + '━'.repeat(70));
    console.log('5️⃣  CACHE STATUS');
    console.log('━'.repeat(70));
    
    const cacheStats = integrationService.getCacheStats();
    console.log(`📦 Integrações em cache: ${cacheStats.size}`);
    if (cacheStats.platforms.length > 0) {
      console.log(`   Plataformas: ${cacheStats.platforms.join(', ')}`);
    }

    // Sucesso final
    console.log('\n' + '='.repeat(70));
    console.log('✅ TESTE COMPLETO COM SUCESSO! 🎉');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    
    // Registrar erro no Firestore
    await integrationService.recordError(
      'cartrack', 
      error instanceof Error ? error.message : 'Erro desconhecido'
    ).catch(() => {});
    
    process.exit(1);
  }
}

// Executar teste
testCartrack();
