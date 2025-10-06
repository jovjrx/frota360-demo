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

    // Mock data for now - will be replaced with real integrations
    metrics.platforms.bolt = {
      totalTrips: 1250,
      totalEarnings: 15680.50,
      activeDrivers: 45,
      success: true,
      lastUpdate: new Date().toISOString(),
    };
    
    metrics.summary.totalTrips += 1250;
    metrics.summary.totalEarnings += 15680.50;
    metrics.summary.activeDrivers += 45;

    // Mock Cartrack data
    metrics.platforms.cartrack = {
      activeVehicles: 38,
      totalMileage: 45670,
      averageUtilization: 78.5,
      success: true,
      lastUpdate: new Date().toISOString(),
    };
    
    metrics.summary.activeVehicles += 38;

    // Mock FONOA data
    metrics.platforms.fonoa = {
      totalBilled: 12500.00,
      taxesPaid: 2875.00,
      invoicesGenerated: 45,
      success: true,
      lastUpdate: new Date().toISOString(),
    };

    // Mock ViaVerde data
    metrics.platforms.viaverde = {
      totalSpent: 1250.75,
      transactionsCount: 156,
      averageTransaction: 8.02,
      success: true,
      lastUpdate: new Date().toISOString(),
    };
    
    metrics.summary.totalExpenses += 1250.75;

    // Mock myprio data
    metrics.platforms.myprio = {
      totalExpenses: 3450.25,
      categories: {
        fuel: 2100.00,
        maintenance: 850.25,
        insurance: 500.00,
      },
      success: true,
      lastUpdate: new Date().toISOString(),
    };
    
    metrics.summary.totalExpenses += 3450.25;

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
