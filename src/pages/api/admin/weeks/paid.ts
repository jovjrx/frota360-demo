/**
 * API ENDPOINT: Buscar semanas PAGAS
 * GET /api/admin/weeks/paid
 * 
 * Query params:
 * - driverId (opcional)
 * - weekId (opcional)
 * - startDate (opcional)
 * - endDate (opcional)
 * - limit (default: 50)
 * - sort (default: 'desc')
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import type { SessionRequest } from '@/lib/session/ironSession';
import {
  getWeekPaidPayments,
  getDriverPayments,
  getPaidPaymentsBetweenDates,
} from '@/lib/api/payment-data-service';

export default withIronSessionApiRoute(async (req: SessionRequest, res: NextApiResponse) => {
  try {
    // ✅ Apenas admin
    if (req.session.user?.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const {
      driverId,
      weekId,
      startDate,
      endDate,
    } = req.query;

    let data: any[] = [];

    // Estratégia de busca baseada em parâmetros
    if (weekId && typeof weekId === 'string') {
      // Se tem weekId, busca todos os pagamentos dessa semana
      data = await getWeekPaidPayments(weekId);
    } else if (driverId && typeof driverId === 'string') {
      // Se tem driverId, busca pagamentos desse motorista
      data = await getDriverPayments(driverId);
    } else if (startDate && endDate && typeof startDate === 'string' && typeof endDate === 'string') {
      // Se tem data range, busca entre essas datas
      data = await getPaidPaymentsBetweenDates(startDate, endDate);
    } else {
      // Sem filtros específicos, busca tudo (cuidado com performance!)
      data = await getWeekPaidPayments(new Date().toISOString().split('T')[0]);
    }

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('[/api/admin/weeks/paid] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

