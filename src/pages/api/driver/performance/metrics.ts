import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getDriverPerformanceMetrics } from '@/lib/performance/metrics';

interface PerformanceResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PerformanceResponse>
) {
  const session = await getSession(req, res);

  if (!session?.isLoggedIn || session.role !== 'driver') {
    return res.status(401).json({
      success: false,
      error: 'Não autorizado',
    });
  }

  const { method } = req;

  if (method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: `Método ${method} não permitido`,
    });
  }

  try {
    const { period = 'month' } = req.query;

    if (!['week', 'month', 'total'].includes(period as string)) {
      return res.status(400).json({
        success: false,
        error: 'Período inválido (week/month/total)',
      });
    }

    const driverId = session.user?.id || session.userId;
    if (!driverId) {
      return res.status(400).json({
        success: false,
        error: 'ID do motorista não encontrado',
      });
    }

    const metrics = await getDriverPerformanceMetrics(
      driverId,
      period as 'week' | 'month' | 'total'
    );

    if (!metrics) {
      return res.status(404).json({
        success: false,
        error: 'Nenhum dado de performance encontrado',
      });
    }

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[driver/performance/metrics]', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao calcular métricas',
    });
  }
}

