import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { ApiResponse } from '@/types';
import {
  createBoltClient,
  createCartrackClient,
  createFonoaClient,
  createViaVerdeClient,
  createMyprioClient,
} from '@/lib/integrations';

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
  // Verificar autenticação
  const session = await getSession(req, res);
  if (!session?.user || session.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      error: 'Não autorizado',
    });
  }

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

    // Buscar dados do Bolt
    try {
      const boltClient = createBoltClient();
      const boltStats = await boltClient.getStats(startDate as string, endDate as string);
      
      if (boltStats.success && boltStats.data) {
        metrics.platforms.bolt = boltStats.data;
        metrics.summary.totalTrips += boltStats.data.totalTrips || 0;
        metrics.summary.totalEarnings += boltStats.data.totalEarnings || 0;
        metrics.summary.activeDrivers += boltStats.data.activeDrivers || 0;
      } else {
        metrics.errors.push(`Bolt: ${boltStats.error}`);
      }
    } catch (error: any) {
      metrics.errors.push(`Bolt: ${error.message}`);
    }

    // Buscar dados do Cartrack
    try {
      const cartrackClient = createCartrackClient();
      const cartrackStats = await cartrackClient.getStats(startDate as string, endDate as string);
      
      if (cartrackStats.success && cartrackStats.data) {
        metrics.platforms.cartrack = cartrackStats.data;
        metrics.summary.totalTrips += cartrackStats.data.totalTrips || 0;
        metrics.summary.activeVehicles += cartrackStats.data.activeVehicles || 0;
      } else {
        metrics.errors.push(`Cartrack: ${cartrackStats.error}`);
      }
    } catch (error: any) {
      metrics.errors.push(`Cartrack: ${error.message}`);
    }

    // Buscar dados do FONOA
    try {
      const fonoaClient = createFonoaClient();
      const fonoaReport = await fonoaClient.getTaxReport(startDate as string, endDate as string);
      
      if (fonoaReport.success && fonoaReport.data) {
        metrics.platforms.fonoa = fonoaReport.data;
        // FONOA fornece dados fiscais, não afeta earnings diretamente
      } else {
        metrics.errors.push(`FONOA: ${fonoaReport.error}`);
      }
    } catch (error: any) {
      metrics.errors.push(`FONOA: ${error.message}`);
    }

    // Buscar dados do ViaVerde
    try {
      const viaverdeClient = createViaVerdeClient();
      const viaverdeStats = await viaverdeClient.getStats(startDate as string, endDate as string);
      
      if (viaverdeStats.success && viaverdeStats.data) {
        metrics.platforms.viaverde = viaverdeStats.data;
        metrics.summary.totalExpenses += viaverdeStats.data.totalAmount || 0;
      } else {
        metrics.errors.push(`ViaVerde: ${viaverdeStats.error}`);
      }
    } catch (error: any) {
      metrics.errors.push(`ViaVerde: ${error.message}`);
    }

    // Buscar dados do myprio
    try {
      const myprioClient = createMyprioClient();
      const myprioStats = await myprioClient.getStats(startDate as string, endDate as string);
      
      if (myprioStats.success && myprioStats.data) {
        metrics.platforms.myprio = myprioStats.data;
        metrics.summary.totalExpenses += myprioStats.data.totalExpenses || 0;
      } else {
        metrics.errors.push(`myprio: ${myprioStats.error}`);
      }
    } catch (error: any) {
      metrics.errors.push(`myprio: ${error.message}`);
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
