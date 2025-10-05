/**
 * Script para testar integração Uber
 * Uso: npx tsx scripts/test-uber.ts
 */

import { UberClient } from '../lib/integrations/uber/client';

async function testUber() {
  console.log('🔍 Testando Uber API...\n');

  // Criar cliente com credenciais do integration.md
  const client = new UberClient({
    clientId: '0W89Kw8QMgGdesno5dBdvNdabnMw8KkL',
    clientSecret: 'mQdZgiooj9SId57DuR5w9t6TSq10HHfG7acVTq1A',
    orgUuid: '2b203f2d-2fbb-4012-b677-7e2b878850d0',
  });

  try {
    // 1. Autenticar
    console.log('1️⃣ Autenticando com Uber OAuth 2.0...');
    await client.authenticate();
    console.log('✅ Autenticação bem-sucedida!');

    // 2. Testar conexão
    console.log('\n2️⃣ Testando conexão...');
    const connectionTest = await client.testConnection();
    console.log(`✅ Conexão: ${connectionTest.success ? 'SUCESSO' : 'FALHOU'}`);
    if (!connectionTest.success) {
      console.error(`❌ Erro: ${connectionTest.error}`);
      return;
    }

    // 3. Buscar viagens (últimos 30 dias)
    console.log('\n3️⃣ Buscando viagens dos últimos 30 dias...');
    const endDate = Math.floor(Date.now() / 1000); // Unix timestamp
    const startDate = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    
    const trips = await client.getTrips(startDate.toString(), endDate.toString());
    console.log(`✅ Encontradas ${trips.length} viagens`);
    
    if (trips.length > 0) {
      const trip = trips[0];
      console.log(`   Exemplo: ${trip.distance.toFixed(1)}km, €${trip.earnings.toFixed(2)}`);
      console.log(`   Status: ${trip.status}, Duração: ${trip.duration.toFixed(0)}min`);
    }

    // 4. Calcular ganhos
    console.log('\n4️⃣ Calculando ganhos do período...');
    const earnings = await client.getEarnings(startDate.toString(), endDate.toString());
    console.log('✅ Ganhos:');
    console.log(`   Total: €${earnings.total.toFixed(2)}`);
    console.log(`   Viagens: ${earnings.trips}`);
    console.log(`   Média por viagem: €${earnings.averagePerTrip.toFixed(2)}`);

    // 5. Buscar motoristas
    console.log('\n5️⃣ Buscando motoristas...');
    const drivers = await client.getDrivers();
    console.log(`✅ Encontrados ${drivers.length} motoristas`);
    
    if (drivers.length > 0) {
      const driver = drivers[0];
      console.log(`   Exemplo: ${driver.name} (${driver.status})`);
      console.log(`   Email: ${driver.email}`);
    }

    // 6. Métricas consolidadas
    console.log('\n6️⃣ Métricas consolidadas:');
    const totalDistance = trips.reduce((sum, t) => sum + t.distance, 0);
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const cancelledTrips = trips.filter(t => t.status === 'cancelled').length;
    
    console.log(`   📊 Total: ${trips.length} viagens (${completedTrips} completas, ${cancelledTrips} canceladas)`);
    console.log(`   🚗 Distância total: ${totalDistance.toFixed(1)}km`);
    console.log(`   💰 Receita total: €${earnings.total.toFixed(2)}`);
    console.log(`   👥 Motoristas ativos: ${drivers.filter(d => d.status === 'active').length}`);

    console.log('\n✅ Teste completo com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante teste:', error);
    if (error instanceof Error) {
      console.error('   Mensagem:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

testUber();
