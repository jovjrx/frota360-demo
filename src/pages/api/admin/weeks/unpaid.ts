/**
 * API ENDPOINT: Buscar semanas NÃO PAGAS
 * GET /api/admin/weeks/unpaid
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
import { adminDb } from '@/lib/firebaseAdmin';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import type { SessionRequest } from '@/lib/session/ironSession';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

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
      limit = 50,
      sort = 'desc',
    } = req.query;

    let query = adminDb
      .collection('driverPayments')
      .where('paymentStatus', '==', 'pending');

    // Aplicar filtros
    if (driverId && typeof driverId === 'string') {
      query = query.where('driverId', '==', driverId);
    }

    if (weekId && typeof weekId === 'string') {
      query = query.where('weekId', '==', weekId);
    }

    // Filtro por data
    if (startDate && typeof startDate === 'string') {
      query = query.where('weekStart', '>=', startDate);
    }

    if (endDate && typeof endDate === 'string') {
      query = query.where('weekEnd', '<=', endDate);
    }

    // Sort e limit
    const sortOrder = sort === 'asc' ? 'asc' : 'desc';
    query = query.orderBy('weekStart', sortOrder).limit(Number(limit) || 50);

    const snapshot = await query.get();
    const data = snapshot.docs.map((doc) => ({
      ...(doc.data() as DriverWeeklyRecord),
    }));

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('[/api/admin/weeks/unpaid] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

