import type { NextApiRequest, NextApiResponse } from 'next';
import { getAggregatedPerformanceMetrics } from '@/lib/performance/metrics';
import { getSession } from '@/lib/session/ironSession';

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
  if (!session?.isLoggedIn || (session.role !== 'admin' && session.user?.role !== 'admin')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
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

    const metrics = await getAggregatedPerformanceMetrics(period as 'week' | 'month' | 'total');

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('[admin/performance/metrics]', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao calcular métricas',
    });
  }
}

