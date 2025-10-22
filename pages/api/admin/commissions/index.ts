import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

interface CommissionRecordDto {
  driverId: string;
  driverName: string;
  affiliateLevel: number;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  driverRevenue: number;
  baseCommission: number;
  recruitmentCommission: number;
  totalCommission: number;
}

interface AdminCommissionsDataDto {
  success: boolean;
  summary: {
    totalCommissions: number;
    totalPaid: number;
    totalPending: number;
    averageCommission: number;
    totalDrivers: number;
  };
  commissions: CommissionRecordDto[];
}

async function getWeekDates(weekId: string): Promise<{ weekStart: string; weekEnd: string }> {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<AdminCommissionsDataDto | any>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session?.userId || session.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const limit = Math.min(Number(req.query.limit || 50), 200);
    const bonusesSnap = await adminDb
      .collection('affiliate_bonuses')
      .orderBy('weekId', 'desc')
      .limit(limit)
      .get();

    const commissions: CommissionRecordDto[] = [];
    let totalCommissions = 0;
    let totalPaid = 0;
    const uniqueDrivers = new Set<string>();

    // cache helpers to reduce reads
    const driverCache = new Map<string, { name: string; level: number }>();
    const weekDatesCache = new Map<string, { weekStart: string; weekEnd: string }>();

    for (const doc of bonusesSnap.docs) {
      const data = doc.data() as any;
      const indicatorId: string = data.indicatorId;
      const weekId: string = data.weekId;
      const total: number = Number(data.total || 0);
      const status: string | undefined = data.status; // optional

      uniqueDrivers.add(indicatorId);
      totalCommissions += total;
      if (status === 'paid') totalPaid += total;

      // driver name & level
      let driverInfo = driverCache.get(indicatorId);
      if (!driverInfo) {
        const d = await adminDb.collection('drivers').doc(indicatorId).get();
        const dv = d.exists ? d.data() : null;
        driverInfo = {
          name: dv?.fullName || dv?.name || dv?.firstName || indicatorId,
          level: Number(dv?.affiliateLevel || 1),
        };
        driverCache.set(indicatorId, driverInfo);
      }

      // week dates
      let dates = weekDatesCache.get(weekId);
      if (!dates) {
        dates = await getWeekDates(weekId);
        weekDatesCache.set(weekId, dates);
      }

      // indicator revenue that week (optional KPI)
      const driverRevenue = await getDriverRevenueForWeek(indicatorId, weekId);

      commissions.push({
        driverId: indicatorId,
        driverName: driverInfo.name,
        affiliateLevel: driverInfo.level,
        weekId,
        weekStart: dates.weekStart,
        weekEnd: dates.weekEnd,
        driverRevenue,
        baseCommission: 0,
        recruitmentCommission: total,
        totalCommission: total,
      });
    }

    const averageCommission = bonusesSnap.size > 0 ? totalCommissions / bonusesSnap.size : 0;
    const totalPending = totalCommissions - totalPaid;

    return res.status(200).json({
      success: true,
      summary: {
        totalCommissions,
        totalPaid,
        totalPending,
        averageCommission,
        totalDrivers: uniqueDrivers.size,
      },
      commissions,
    });
  } catch (error: any) {
    console.error('[/api/admin/commissions]', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal Server Error' });
  }
}
