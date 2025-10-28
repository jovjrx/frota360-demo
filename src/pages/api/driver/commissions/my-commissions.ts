/**
 * API: GET /api/driver/commissions/my-commissions
 * Busca comissões do motorista autenticado
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';

async function getWeekDates(weekId: string) {
  const snap = await adminDb.collection('dataWeekly').where('weekId', '==', weekId).limit(1).get();
  if (snap.empty) return { weekStart: '', weekEnd: '' };
  const d = snap.docs[0].data() as any;
  return { weekStart: d.weekStart || '', weekEnd: d.weekEnd || '' };
}

async function getDriverRevenueForWeek(driverId: string, weekId: string): Promise<number> {
  const snap = await adminDb
    .collection('dataWeekly')
    .where('driverId', '==', driverId)
    .where('weekId', '==', weekId)
    .get();
  if (snap.empty) return 0;
  let total = 0;
  for (const doc of snap.docs) {
    const data = doc.data() as any;
    const v = (typeof data.totalValue === 'number' ? data.totalValue : (typeof data.amount === 'number' ? data.amount : 0)) || 0;
    if (data.platform === 'uber' || data.platform === 'bolt') total += v;
  }
  return total;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getSession(req, res);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

  const userEmail = session.user?.email || session.email || session.userId;

    // Buscar motorista
    const driverSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (driverSnapshot.empty) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }

    const driver = driverSnapshot.docs[0].data();
    const driverId = driverSnapshot.docs[0].id;

    // Buscar bônus de afiliados para as últimas 12 semanas
    const bonusesSnap = await adminDb
      .collection('affiliate_bonuses')
      .where('indicatorId', '==', driverId)
      .orderBy('weekId', 'desc')
      .limit(12)
      .get();

    const commissions: Array<any> = [];
    let totalEarned = 0;

    // cache week dates
    const weekCache = new Map<string, { weekStart: string; weekEnd: string }>();

    for (const doc of bonusesSnap.docs) {
      const data = doc.data() as any;
      const weekId: string = data.weekId;
      const total: number = Number(data.total || 0);

      totalEarned += total;

      let dates = weekCache.get(weekId);
      if (!dates) {
        dates = await getWeekDates(weekId);
        weekCache.set(weekId, dates);
      }

      const driverRevenue = await getDriverRevenueForWeek(driverId, weekId);

      const details = Array.isArray(data.details) ? data.details as Array<any> : [];
      const breakdownMap = new Map<number, { count: number; commission: number }>();
      for (const d of details) {
        const lvl = Number(d?.level || 0);
        const amt = Number(d?.bonusAmount || 0);
        const cur = breakdownMap.get(lvl) || { count: 0, commission: 0 };
        cur.count += 1; cur.commission += amt;
        breakdownMap.set(lvl, cur);
      }
      const recruitmentBreakdown = Array.from(breakdownMap.entries()).map(([level, v]) => ({ level, count: v.count, commission: v.commission }));

      commissions.push({
        weekId,
        weekStart: dates.weekStart,
        weekEnd: dates.weekEnd,
        driverRevenue,
        baseCommission: 0,
        recruitmentCommission: total,
        totalCommission: total,
        recruitmentBreakdown,
      });
    }

    return res.status(200).json({
      success: true,
      driver: {
        id: driverId,
        name: driver.fullName || driver.name,
        affiliateLevel: driver.affiliateLevel || 1,
        activeRecruitments: driver.activeRecruitments || 0,
      },
      commissions,
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


