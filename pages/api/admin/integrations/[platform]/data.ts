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
  const validPlatforms: IntegrationPlatform[] = ['uber', 'bolt', 'cartrack', 'viaverde', 'fonoa', 'myprio'];
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
          
          // Buscar viagens dos últimos 7 dias
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);

          // Formatar datas para string ISO
          const trips = await cartrackClient.getTrips(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          );
          const vehicles = await cartrackClient.getVehicles();

          data = {
            platform: 'cartrack',
            lastUpdate: new Date().toISOString(),
            count: trips.length,
            summary: {
              totalTrips: trips.length,
              totalVehicles: vehicles.length,
              totalDistance: trips.reduce((sum, trip) => sum + (trip.distance || 0), 0),
              period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
              },
            },
            trips: trips.slice(0, 10), // Primeiras 10 viagens
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
      case 'fonoa':
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
