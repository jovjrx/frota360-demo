/**
 * API: GET /api/driver/performance/my-kpis
 * Busca KPIs do motorista autenticado
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebaseAdmin';
import { getDriverKPIs, getLatestKPI } from '@/lib/services/kpi-calculator';

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

    // Buscar KPIs (últimas 12 semanas)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 84); // 12 semanas
    const endDate = new Date().toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];

    const kpis = await getDriverKPIs(driverId, startDateStr, endDate);
    const latestKPI = await getLatestKPI(driverId);

    return res.status(200).json({
      success: true,
      driver: {
        id: driverId,
        name: driver.fullName || driver.name,
        type: driver.type,
      },
      currentKPI: latestKPI ? {
        weekId: latestKPI.weekId,
        weekStart: latestKPI.weekStart,
        weekEnd: latestKPI.weekEnd,
        overallScore: latestKPI.overallScore,
        performanceLevel: latestKPI.performanceLevel,
        kpis: {
          weeklyRevenue: latestKPI.weeklyRevenue,
          acceptanceRate: latestKPI.acceptanceRate,
          passengerRating: latestKPI.passengerRating,
          recruitmentsActive: latestKPI.recruitmentsActive,
          activeHoursPerWeek: latestKPI.activeHoursPerWeek,
        },
      } : null,
      history: kpis.map(k => ({
        weekId: k.weekId,
        weekStart: k.weekStart,
        weekEnd: k.weekEnd,
        overallScore: k.overallScore,
        performanceLevel: k.performanceLevel,
      })),
    });
  } catch (error: any) {
    console.error('[/api/driver/performance/my-kpis]', error);
    return res.status(500).json({ error: 'Erro ao buscar KPIs' });
  }
}

