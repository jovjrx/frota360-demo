import { adminDb } from '@/lib/firebaseAdmin';

export type BonusLevels = Record<number, number>; // level -> percent (e.g., {1: 0.02, 2: 0.01})

export interface CommissionConfig {
  minWeeklyRevenueForEligibility: number; // e.g., 550
  levels: BonusLevels;
  base: 'repasse' | 'ganhosMenosIVA';
  maxLevels: number;
}

const DEFAULT_CONFIG: CommissionConfig = {
  minWeeklyRevenueForEligibility: 550,
  levels: { 1: 0.02, 2: 0.01, 3: 0.005 },
  base: 'repasse',
  maxLevels: 3,
};

export async function getCommissionConfig(): Promise<CommissionConfig> {
  try {
    const doc = await adminDb.collection('config').doc('bonusConfig').get();
    if (!doc.exists) return DEFAULT_CONFIG;
    const data = doc.data() || {};
    const levels: BonusLevels = data.levels || DEFAULT_CONFIG.levels;
    return {
      minWeeklyRevenueForEligibility: Number(data.minWeeklyRevenueForEligibility ?? DEFAULT_CONFIG.minWeeklyRevenueForEligibility),
      levels,
      base: (data.base === 'ganhosMenosIVA' ? 'ganhosMenosIVA' : 'repasse'),
      maxLevels: Number((data.maxLevels ?? Object.keys(levels).length) || DEFAULT_CONFIG.maxLevels),
    };
  } catch (e) {
    console.warn('[getCommissionConfig] fallback to default:', e);
    return DEFAULT_CONFIG;
  }
}

export async function updateCommissionConfig(partial: Partial<CommissionConfig>): Promise<CommissionConfig> {
  const current = await getCommissionConfig();
  const next: CommissionConfig = {
    minWeeklyRevenueForEligibility: typeof partial.minWeeklyRevenueForEligibility === 'number' ? partial.minWeeklyRevenueForEligibility : current.minWeeklyRevenueForEligibility,
    levels: partial.levels || current.levels,
    base: partial.base || current.base,
    maxLevels: typeof partial.maxLevels === 'number' ? partial.maxLevels : current.maxLevels,
  };
  await adminDb.collection('config').doc('bonusConfig').set(next, { merge: true });
  return next;
}

