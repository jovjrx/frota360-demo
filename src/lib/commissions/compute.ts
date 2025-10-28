import { adminDb } from '@/lib/firebaseAdmin';
import { getCommissionConfig } from '@/lib/commissions/bonusConfig';
import { getFinancialConfig } from '@/lib/finance/config';

type Platform = 'uber' | 'bolt' | 'myprio' | 'viaverde';

interface DataWeeklyEntry {
  driverId: string | null;
  driverName?: string | null;
  weekId: string;
  platform: Platform;
  totalValue?: number;
  amount?: number;
}

interface DriverWeeklyFixed {
  aluguel: number;
  financingTotalCost: number;
}

interface BonusDetail {
  level: number;
  referredDriverId: string;
  bonusAmount: number;
  base: number;
}

export interface BonusResult {
  total: number;
  details: BonusDetail[];
}

async function getWeeklyPlatformAggregates(weekId: string) {
  const snap = await adminDb
    .collection('dataWeekly')
    .where('weekId', '==', weekId)
    .get();
  const perDriver: Record<string, { uber: number; bolt: number; myprio: number; viaverde: number; name?: string }>
    = {} as any;
  for (const doc of snap.docs) {
    const d = doc.data() as DataWeeklyEntry;
    const id = d.driverId || '';
    if (!id) continue;
    if (!perDriver[id]) perDriver[id] = { uber: 0, bolt: 0, myprio: 0, viaverde: 0, name: d.driverName || undefined };
    const value = (typeof d.totalValue === 'number' ? d.totalValue : (typeof d.amount === 'number' ? d.amount : 0)) || 0;
    switch (d.platform) {
      case 'uber': perDriver[id].uber += value; break;
      case 'bolt': perDriver[id].bolt += value; break;
      case 'myprio': perDriver[id].myprio += value; break;
      case 'viaverde': perDriver[id].viaverde += value; break;
    }
  }
  return perDriver;
}

async function getWeeklyFixedCostsForDriver(driverId: string, weekId: string): Promise<DriverWeeklyFixed> {
  const recId = `${driverId}_${weekId}`;
  // Tenta primeiro em driverPayments (nova estrutura)
  let doc = await adminDb.collection('driverPayments').doc(recId).get();
  // Fallback para driverWeeklyRecords (para compatibilidade com dados antigos)
  if (!doc.exists) {
    doc = await adminDb.collection('driverWeeklyRecords').doc(recId).get();
  }
  const data = doc.exists ? doc.data() : null;
  return {
    aluguel: data?.aluguel || 0,
    financingTotalCost: data?.financingDetails?.totalCost || 0,
  };
}

async function getDriverReferredBy(driverId: string): Promise<string | null> {
  const d = await adminDb.collection('drivers').doc(driverId).get();
  if (!d.exists) return null;
  const data = d.data() || {} as any;
  return data.referredBy || null;
}

export async function computeAllAffiliateBonuses(weekId: string): Promise<{ processed: number; indicators: number }> {
  const [commissionCfg, financialCfg] = await Promise.all([
    getCommissionConfig(),
    getFinancialConfig().catch(() => ({ adminFeePercent: 7 })),
  ]);

  const adminFeePercent = Math.max(0, Number(financialCfg.adminFeePercent || 7));
  const perDriver = await getWeeklyPlatformAggregates(weekId);

  // Compute base per driver (ganhosMenosIVA or repasse-like base before commissions)
  const baseByDriver: Record<string, number> = {};
  const ganhosMenosIVAByDriver: Record<string, number> = {};

  const driverIds = Object.keys(perDriver);
  for (const driverId of driverIds) {
    const agg = perDriver[driverId];
    const ganhosTotal = (agg?.uber || 0) + (agg?.bolt || 0);
    const ganhosMenosIVA = ganhosTotal - ganhosTotal * 0.06; // 6% IVA
    ganhosMenosIVAByDriver[driverId] = ganhosMenosIVA;

    const despesasAdm = ganhosMenosIVA * (adminFeePercent / 100);
    const fixed = await getWeeklyFixedCostsForDriver(driverId, weekId);
    const repasseBase = ganhosMenosIVA - despesasAdm - (agg?.myprio || 0) - (agg?.viaverde || 0) - (fixed.aluguel || 0) - (fixed.financingTotalCost || 0);
    baseByDriver[driverId] = commissionCfg.base === 'repasse' ? repasseBase : ganhosMenosIVA;
  }

  // Accumulate bonuses per indicator
  const totals: Record<string, { total: number; details: BonusDetail[] }> = {};

  for (const driverId of driverIds) {
    const driverBase = baseByDriver[driverId] || 0;
    if (driverBase <= 0) continue;

    // walk up referredBy chain
    let current: string | null = await getDriverReferredBy(driverId);
    let level = 1;
    while (current && level <= commissionCfg.maxLevels) {
      const pct = commissionCfg.levels[level] || 0;
      if (pct > 0) {
        // eligibility: indicator must meet threshold in the same week
        const indicatorBase = baseByDriver[current] ?? (commissionCfg.base === 'repasse' ? 0 : (ganhosMenosIVAByDriver[current] || 0));
        if (indicatorBase >= commissionCfg.minWeeklyRevenueForEligibility) {
          const bonus = driverBase * pct;
          if (!totals[current]) totals[current] = { total: 0, details: [] };
          totals[current].total += bonus;
          totals[current].details.push({ level, referredDriverId: driverId, bonusAmount: bonus, base: driverBase });
        }
      }
      // move up
      current = await getDriverReferredBy(current);
      level += 1;
    }
  }

  // Persist
  let indicators = 0;
  const batch = adminDb.batch();
  for (const [indicatorId, data] of Object.entries(totals)) {
    indicators += 1;
    const docRef = adminDb.collection('affiliate_bonuses').doc(`${indicatorId}_${weekId}`);
    batch.set(docRef, {
      indicatorId,
      weekId,
      total: data.total,
      details: data.details,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  if (indicators > 0) await batch.commit();

  return { processed: driverIds.length, indicators };
}

export async function getBonusForDriverWeek(indicatorId: string, weekId: string): Promise<BonusResult | null> {
  const doc = await adminDb.collection('affiliate_bonuses').doc(`${indicatorId}_${weekId}`).get();
  if (!doc.exists) return { total: 0, details: [] };
  const data = doc.data() || {} as any;
  return {
    total: Number(data.total || 0),
    details: Array.isArray(data.details) ? data.details.map((d: any) => ({
      level: Number(d?.level || 0),
      referredDriverId: String(d?.referredDriverId || ''),
      bonusAmount: Number(d?.bonusAmount || 0),
      base: Number(d?.base || 0),
    })) : [],
  };
}

