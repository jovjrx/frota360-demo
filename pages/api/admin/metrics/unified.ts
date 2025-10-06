import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth/helpers';
import { ApiResponse } from '@/types';
// import {
//   BoltClient,
//   CartrackClient,
//   FONOAClient,
//   ViaVerdeClient,
//   MyprioClient,
// } from '@/lib/integrations';

export interface UnifiedMetrics {
  period: {
    start: string;
    end: string;
  };
  platforms: {
    uber?: any;
    bolt?: any;
    cartrack?: any;
    fonoa?: any;
    viaverde?: any;
    myprio?: any;
  };
  summary: {
    totalTrips: number;
    totalEarnings: number;
    totalExpenses: number;
    netProfit: number;
    activeVehicles: number;
    activeDrivers: number;
  };
  errors: string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<UnifiedMetrics>>
) {
  // Verificar autenticação admin
  const session = await requireAdmin(req, res);
  if (!session) return; // requireAdmin já enviou a resposta 401

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Datas de início e fim são obrigatórias',
      });
    }

    const metrics: UnifiedMetrics = {
      period: {
        start: startDate as string,
        end: endDate as string,
      },
      platforms: {},
      summary: {
        totalTrips: 0,
        totalEarnings: 0,
        totalExpenses: 0,
        netProfit: 0,
        activeVehicles: 0,
        activeDrivers: 0,
      },
      errors: [],
    };

    const platforms = ['uber', 'bolt', 'cartrack', 'viaverde', 'myprio'];

    // Buscar dados reais de cada plataforma
    for (const platform of platforms) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/integrations/${platform}/data`,
          {
            headers: {
              cookie: req.headers.cookie || '',
            },
          }
        );

        if (response.ok) {
          const result = await response.json();
          
          if (result.success && result.data) {
            metrics.platforms[platform] = {
              online: true,
              lastSync: result.data.lastUpdate || new Date().toISOString(),
              data: result.data,
            };

            // Processar dados por plataforma
            switch (platform) {
              case 'uber':
              case 'bolt':
                if (result.data.summary) {
                  metrics.summary.totalTrips += result.data.summary.totalTrips || 0;
                  metrics.summary.totalEarnings += result.data.summary.totalEarnings || 0;
                }
                break;

              case 'cartrack':
                if (result.data.summary) {
                  metrics.summary.totalTrips += result.data.summary.totalTrips || 0;
                  metrics.summary.activeVehicles += result.data.summary.totalVehicles || 0;
                }
                break;

              case 'viaverde':
              case 'myprio':
                if (result.data.summary) {
                  metrics.summary.totalExpenses += result.data.summary.totalExpenses || 0;
                }
                break;
            }
          } else {
            metrics.platforms[platform] = {
              online: false,
              lastSync: new Date().toISOString(),
              error: result.error || 'Erro ao buscar dados',
            };
            metrics.errors.push(`${platform}: ${result.error || 'Erro desconhecido'}`);
          }
        } else {
          metrics.platforms[platform] = {
            online: false,
            lastSync: new Date().toISOString(),
            error: 'Plataforma não responde',
          };
          metrics.errors.push(`${platform}: Plataforma não responde`);
        }
      } catch (error: any) {
        metrics.platforms[platform] = {
          online: false,
          lastSync: new Date().toISOString(),
          error: error.message || 'Erro de conexão',
        };
        metrics.errors.push(`${platform}: ${error.message || 'Erro de conexão'}`);
      }
    }

    // Calcular lucro líquido
    metrics.summary.netProfit = metrics.summary.totalEarnings - metrics.summary.totalExpenses;

    return res.status(200).json({
      success: true,
      data: metrics,
      message: metrics.errors.length > 0 
        ? `Métricas obtidas com ${metrics.errors.length} erro(s)`
        : 'Métricas obtidas com sucesso',
    });
  } catch (error: any) {
    console.error('Error fetching unified metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar métricas',
      message: error.message,
    });
  }
}
