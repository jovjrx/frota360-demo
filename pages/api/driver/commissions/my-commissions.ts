/**
 * API: GET /api/driver/commissions/my-commissions
 * Busca comissões do motorista autenticado
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebaseAdmin';
import { getDriverCommissions, getTotalCommissionsEarned } from '@/lib/services/commission-calculator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);

    // Buscar motorista
    const driverSnapshot = await adminDb
      .collection('drivers')
      .where('uid', '==', decodedToken.uid)
      .limit(1)
      .get();

    if (driverSnapshot.empty) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }

    const driver = driverSnapshot.docs[0].data();
    const driverId = driverSnapshot.docs[0].id;

    // Apenas afiliados têm comissões
    if (driver.type !== 'affiliate') {
      return res.status(403).json({ error: 'Apenas afiliados têm comissões' });
    }

    // Buscar comissões (últimas 12 semanas)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 84); // 12 semanas
    const endDate = new Date().toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];

    const commissions = await getDriverCommissions(driverId, startDateStr, endDate);
    const totalEarned = await getTotalCommissionsEarned(driverId);

    return res.status(200).json({
      success: true,
      driver: {
        id: driverId,
        name: driver.fullName || driver.name,
        affiliateLevel: driver.affiliateLevel || 1,
        activeRecruitments: driver.activeRecruitments || 0,
      },
      commissions: commissions.map(c => ({
        weekId: c.weekId,
        weekStart: c.weekStart,
        weekEnd: c.weekEnd,
        driverRevenue: c.driverRevenue,
        baseCommission: c.baseCommission,
        recruitmentCommission: c.recruitmentCommission,
        totalCommission: c.totalCommission,
        recruitmentBreakdown: c.recruitmentBreakdown,
      })),
      summary: {
        totalEarned,
        totalWeeks: commissions.length,
        averageWeekly: commissions.length > 0 ? totalEarned / commissions.length : 0,
      },
    });
  } catch (error: any) {
    console.error('[/api/driver/commissions/my-commissions]', error);
    return res.status(500).json({ error: 'Erro ao buscar comissões' });
  }
}

