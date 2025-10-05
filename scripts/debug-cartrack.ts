/**
 * Script para debug da estrutura de dados do Cartrack
 */

import { CartrackClient } from '../lib/integrations/cartrack/client';

async function debugCartrack() {
  console.log('🔍 Debug Cartrack API - Ver estrutura dos dados\n');

  const client = new CartrackClient({
    username: 'ALVO00008',
    password: '4204acaf6943762f716ce3301f38d9f10e699512bbbca783f96aec223cbef805',
  });

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  console.log('📅 Período:', startDateStr, 'até', endDateStr, '\n');

  // Buscar apenas 1 viagem para ver a estrutura
  const trips = await client.getTrips(startDateStr, endDateStr);
  
  if (trips.length > 0) {
    console.log('📊 Estrutura da primeira viagem:');
    console.log(JSON.stringify(trips[0], null, 2));
    
    console.log('\n📊 Total de viagens:', trips.length);
    
    // Ver campos disponíveis
    console.log('\n🔑 Campos disponíveis:', Object.keys(trips[0]));
  } else {
    console.log('❌ Nenhuma viagem encontrada');
  }
}

debugCartrack().catch(console.error);
