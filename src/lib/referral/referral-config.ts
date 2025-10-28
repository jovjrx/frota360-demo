import { adminDb } from '@/lib/firebaseAdmin';

export type BonusLevels = Record<number, number>; // level -> percent (e.g., {1: 0.02, 2: 0.01})

export interface ReferralConfig {
  minWeeklyRevenueForEligibility: number; // e.g., 550
  minWeeksToPayBonus: number; // e.g., 4 - mínimo de semanas que o indicado precisa trabalhar
  levels: BonusLevels;
  base: 'repasse' | 'ganhosMenosIVA';
  maxLevels: number;
}

const DEFAULT_CONFIG: ReferralConfig = {
  minWeeklyRevenueForEligibility: 550,
  minWeeksToPayBonus: 4,
  levels: { 1: 0.02, 2: 0.01, 3: 0.005 },
  base: 'repasse',
  maxLevels: 3,
};

export async function getReferralConfig(): Promise<ReferralConfig> {
  try {
    const doc = await adminDb.collection('config').doc('referralConfig').get();
    if (!doc.exists) return DEFAULT_CONFIG;
    const data = doc.data() || {};
    const levels: BonusLevels = data.levels || DEFAULT_CONFIG.levels;
    return {
      minWeeklyRevenueForEligibility: Number(data.minWeeklyRevenueForEligibility ?? DEFAULT_CONFIG.minWeeklyRevenueForEligibility),
      minWeeksToPayBonus: Number(data.minWeeksToPayBonus ?? DEFAULT_CONFIG.minWeeksToPayBonus),
      levels,
      base: (data.base === 'ganhosMenosIVA' ? 'ganhosMenosIVA' : 'repasse'),
      maxLevels: Number((data.maxLevels ?? Object.keys(levels).length) || DEFAULT_CONFIG.maxLevels),
    };
  } catch (e) {
    console.warn('[getReferralConfig] fallback to default:', e);
    return DEFAULT_CONFIG;
  }
}

export async function updateReferralConfig(partial: Partial<ReferralConfig>): Promise<ReferralConfig> {
  const current = await getReferralConfig();
  const next: ReferralConfig = {
    minWeeklyRevenueForEligibility: typeof partial.minWeeklyRevenueForEligibility === 'number' ? partial.minWeeklyRevenueForEligibility : current.minWeeklyRevenueForEligibility,
    minWeeksToPayBonus: typeof partial.minWeeksToPayBonus === 'number' ? partial.minWeeksToPayBonus : current.minWeeksToPayBonus,
    levels: partial.levels || current.levels,
    base: partial.base || current.base,
    maxLevels: typeof partial.maxLevels === 'number' ? partial.maxLevels : current.maxLevels,
  };
  await adminDb.collection('config').doc('referralConfig').set(next, { merge: true });
  return next;
}

// Para compatibilidade - manter interface CommissionConfig
export type CommissionConfig = ReferralConfig;
export const getCommissionConfig = getReferralConfig;
export const updateCommissionConfig = updateReferralConfig;

