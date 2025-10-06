import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '@/types';
import integrationService from '@/lib/integrations/integration-service';
import { IntegrationPlatform } from '@/schemas/integration';
import {
  createCartrackClient,
  createBoltClient,
  createUberClient,
} from '@/lib/integrations';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { platform } = req.query;

  if (!platform || typeof platform !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Plataforma não especificada',
    });
  }

  // Validar se é uma plataforma válida
  const validPlatforms: IntegrationPlatform[] = ['uber', 'bolt', 'cartrack', 'viaverde', 'myprio'];
  if (!validPlatforms.includes(platform as IntegrationPlatform)) {
    return res.status(400).json({
      success: false,
      error: 'Plataforma inválida',
    });
  }

  try {
    const integration = await integrationService.getIntegration(platform as IntegrationPlatform);

    if (!integration || !integration.enabled) {
      return res.status(400).json({
        success: false,
        error: 'Integração não está ativa',
      });
    }

    let data: any = {
      platform: platform,
      lastUpdate: new Date().toISOString(),
      count: 0,
      data: null,
    };

    // Buscar dados reais de cada plataforma
    switch (platform.toLowerCase()) {
      case 'cartrack':
        try {
          const cartrackClient = await createCartrackClient();
          
          // Buscar viagens da semana atual (Segunda-feira até Domingo)
          const today = new Date();
          const dayOfWeek = today.getDay(); // 0 (Domingo) a 6 (Sábado)
          
          // Calcular início da semana (Segunda-feira)
          const weekStart = new Date(today);
          const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
          weekStart.setDate(today.getDate() + daysToMonday);
          weekStart.setHours(0, 0, 0, 0);
          
          // Calcular fim da semana (Domingo)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          
          // Se não houver dados da semana atual, buscar últimos 7 dias também
          const alternativeStart = new Date(today);
          alternativeStart.setDate(today.getDate() - 7);
          alternativeStart.setHours(0, 0, 0, 0);
          
          console.log(`[Cartrack API] Buscando dados de ${alternativeStart.toISOString().split('T')[0]} até ${today.toISOString().split('T')[0]}`);
          console.log(`[Cartrack API] Semana atual: ${weekStart.toISOString().split('T')[0]} até ${weekEnd.toISOString().split('T')[0]}`);
          console.log(`[Cartrack API] Hoje é: ${today.toISOString()}`);
          
          // Buscar dados da semana atual E últimos 7 dias para ter mais dados
          const trips = await cartrackClient.getTrips(
            alternativeStart.toISOString().split('T')[0],
            today.toISOString().split('T')[0]
          );
          const vehicles = await cartrackClient.getVehicles();
          
          console.log(`[Cartrack API] Total de viagens recebidas: ${trips.length}`);
          
          // Ordenar viagens por data mais recente
          const sortedTrips = trips.sort((a: any, b: any) => {
            const dateA = new Date(a.start_timestamp).getTime();
            const dateB = new Date(b.start_timestamp).getTime();
            return dateB - dateA; // Mais recente primeiro
          });

          data = {
            platform: 'cartrack',
            lastUpdate: new Date().toISOString(),
            count: sortedTrips.length,
            summary: {
              totalTrips: sortedTrips.length,
              totalVehicles: vehicles.length,
              totalDistance: sortedTrips.reduce((sum, trip) => sum + (trip.trip_distance || 0) / 1000, 0), // metros para km
              period: {
                start: weekStart.toISOString(),
                end: today.toISOString(),
              },
            },
            trips: sortedTrips.slice(0, 50), // Primeiras 50 viagens (aumentado de 10)
            vehicles: vehicles,
          };
        } catch (error) {
          console.error('Error fetching Cartrack data:', error);
        }
        break;

      case 'bolt':
        try {
          const boltClient = await createBoltClient();
          
          // Buscar dados (placeholder - implementar quando API Bolt estiver completa)
          data = {
            platform: 'bolt',
            lastUpdate: new Date().toISOString(),
            count: 0,
            message: 'Integração Bolt configurada. Dados serão sincronizados em breve.',
          };
        } catch (error) {
          console.error('Error fetching Bolt data:', error);
        }
        break;

      case 'uber':
        try {
          const uberClient = await createUberClient();
          
          // Buscar dados (placeholder - implementar quando API Uber estiver completa)
          data = {
            platform: 'uber',
            lastUpdate: new Date().toISOString(),
            count: 0,
            message: 'Integração Uber configurada. Dados serão sincronizados em breve.',
          };
        } catch (error) {
          console.error('Error fetching Uber data:', error);
        }
        break;

      case 'viaverde':
      case 'myprio':
        data = {
          platform: platform,
          lastUpdate: new Date().toISOString(),
          count: 0,
          message: `Integração ${platform} usa scraping. Implementação pendente.`,
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Plataforma não suportada',
        });
    }

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error(`Error fetching data for ${platform}:`, error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar dados',
    });
  }
}
