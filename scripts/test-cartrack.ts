/**
 * Script para testar integração Cartrack
 * Uso: npx ts-node scripts/test-cartrack.ts
 */

import { CartrackClient } from '../lib/integrations/cartrack/client';

async function testCartrack() {
  console.log('🔍 Testando Cartrack API...\n');

  // Criar cliente com credenciais CORRETAS da API (não do portal)
  const username = 'ALVO00008';
  const password = '4204acaf6943762f716ce3301f38d9f10e699512bbbca783f96aec223cbef805'; // API Key
  const auth = `${username}:${password}`;
  const base64Auth = Buffer.from(auth).toString('base64');
  
  console.log('📋 Credenciais API:');
  console.log(`   Username: ${username}`);
  console.log(`   API Key: ${password.substring(0, 20)}...`);
  console.log(`   Base64: ${base64Auth.substring(0, 30)}...\n`);

  const client = new CartrackClient({
    username,
    password,
  });

  try {
    // 1. Testar conexão
    console.log('1️⃣ Testando conexão...');
    const connectionTest = await client.testConnection();
    console.log(`✅ Conexão: ${connectionTest.success ? 'SUCESSO' : 'FALHOU'}`);
    if (!connectionTest.success) {
      console.error(`❌ Erro: ${connectionTest.error}`);
      return;
    }

    // 2. Buscar veículos
    console.log('\n2️⃣ Buscando veículos...');
    const vehicles = await client.getVehicles();
    console.log(`✅ Encontrados ${vehicles.length} veículos`);
    if (vehicles.length > 0) {
      console.log(`   Exemplo: ${vehicles[0].plate} - ${vehicles[0].make} ${vehicles[0].model}`);
    }

    // 3. Buscar viagens (últimos 7 dias)
    console.log('\n3️⃣ Buscando viagens dos últimos 7 dias...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const trips = await client.getTrips(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    console.log(`✅ Encontradas ${trips.length} viagens`);
    if (trips.length > 0) {
      const trip = trips[0];
      console.log(`   Exemplo: ${trip.distance_km}km em ${trip.duration_minutes}min`);
    }

    // 4. Buscar dados de combustível
    console.log('\n4️⃣ Buscando dados de combustível...');
    const fuelData = await client.getFuelData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    console.log(`✅ Encontrados ${fuelData.length} registros de combustível`);

    // 5. Buscar manutenção
    console.log('\n5️⃣ Buscando dados de manutenção...');
    const maintenance = await client.getMaintenanceData(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    console.log(`✅ Encontrados ${maintenance.length} eventos de manutenção`);

    // 6. Buscar métricas consolidadas
    console.log('\n6️⃣ Buscando métricas consolidadas...');
    const metrics = await client.getMetrics(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
    console.log('✅ Métricas:');
    console.log(`   Veículos: ${metrics.vehicles.total} total (${metrics.vehicles.active} ativos)`);
    console.log(`   Viagens: ${metrics.trips.total} viagens, ${metrics.trips.totalDistanceKm.toFixed(1)}km`);
    console.log(`   Combustível: ${metrics.fuel.totalLiters.toFixed(1)}L, €${metrics.fuel.totalCost.toFixed(2)}`);
    console.log(`   Manutenção: €${metrics.maintenance.totalCost.toFixed(2)} (${metrics.maintenance.eventsCount} eventos)`);
    console.log(`   💰 Total de despesas: €${metrics.summary.totalExpenses.toFixed(2)}`);

    console.log('\n✅ Teste completo com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante teste:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

testCartrack();
