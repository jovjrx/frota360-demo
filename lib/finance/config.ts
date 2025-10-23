import { adminDb } from '@/lib/firebaseAdmin';

export type FinancingEligibilityPolicy = 'startDateToWeekEnd' | 'startDateToWeekStart';

export interface FinancialConfig {
  adminFeePercent: number; // e.g., 7
  adminFeeFixedDefault: number; // e.g., 25 (valor fixo padrão em euros)
  financing?: {
    // Recalcular financiamento por semana de forma dinâmica (não confiar no snapshot salvo)
    dynamicCalculation?: boolean;
    // Política para considerar a semana elegível: comparar startDate com weekEnd (padrão) ou weekStart
    eligibilityPolicy?: FinancingEligibilityPolicy;
    // No pagamento, decrementar parcelas com base no estado atual e elegibilidade dinâmica (ignora flag salvo)
    paymentDecrementDynamic?: boolean;
  };
}

const DEFAULT_FINANCIAL_CONFIG: FinancialConfig = {
  adminFeePercent: 7,
  adminFeeFixedDefault: 25,
  financing: {
    dynamicCalculation: true,
    eligibilityPolicy: 'startDateToWeekEnd',
    paymentDecrementDynamic: true,
  },
};

export async function getFinancialConfig(): Promise<FinancialConfig> {
  try {
    const doc = await adminDb.collection('config').doc('financialConfig').get();
    if (!doc.exists) return DEFAULT_FINANCIAL_CONFIG;
    const data = (doc.data() || {}) as any;
    return {
      adminFeePercent: Number(data.adminFeePercent ?? DEFAULT_FINANCIAL_CONFIG.adminFeePercent),
      adminFeeFixedDefault: Number(data.adminFeeFixedDefault ?? DEFAULT_FINANCIAL_CONFIG.adminFeeFixedDefault),
      financing: {
        dynamicCalculation: typeof data.financing?.dynamicCalculation === 'boolean'
          ? data.financing.dynamicCalculation
          : DEFAULT_FINANCIAL_CONFIG.financing!.dynamicCalculation,
        eligibilityPolicy: (data.financing?.eligibilityPolicy as FinancingEligibilityPolicy)
          || DEFAULT_FINANCIAL_CONFIG.financing!.eligibilityPolicy,
        paymentDecrementDynamic: typeof data.financing?.paymentDecrementDynamic === 'boolean'
          ? data.financing.paymentDecrementDynamic
          : DEFAULT_FINANCIAL_CONFIG.financing!.paymentDecrementDynamic,
      },
    };
  } catch (e) {
    console.warn('[getFinancialConfig] using defaults due to error:', e);
    return DEFAULT_FINANCIAL_CONFIG;
  }
}

export async function updateFinancialConfig(partial: Partial<FinancialConfig>): Promise<FinancialConfig> {
  const current = await getFinancialConfig();
  const next: FinancialConfig = {
    adminFeePercent: typeof partial.adminFeePercent === 'number' ? partial.adminFeePercent : current.adminFeePercent,
    adminFeeFixedDefault: typeof partial.adminFeeFixedDefault === 'number' ? partial.adminFeeFixedDefault : current.adminFeeFixedDefault,
    financing: {
      dynamicCalculation: typeof partial.financing?.dynamicCalculation === 'boolean'
        ? partial.financing.dynamicCalculation
        : current.financing?.dynamicCalculation ?? DEFAULT_FINANCIAL_CONFIG.financing!.dynamicCalculation,
      eligibilityPolicy: (partial.financing?.eligibilityPolicy as FinancingEligibilityPolicy)
        || current.financing?.eligibilityPolicy
        || DEFAULT_FINANCIAL_CONFIG.financing!.eligibilityPolicy!,
      paymentDecrementDynamic: typeof partial.financing?.paymentDecrementDynamic === 'boolean'
        ? partial.financing.paymentDecrementDynamic
        : current.financing?.paymentDecrementDynamic ?? DEFAULT_FINANCIAL_CONFIG.financing!.paymentDecrementDynamic,
    },
  };

  await adminDb.collection('config').doc('financialConfig').set(next, { merge: true });
  return next;
}

export function isWeekEligibleByStart(startDateIso?: string | null, weekStartIso?: string, weekEndIso?: string, policy: FinancingEligibilityPolicy = 'startDateToWeekEnd'): boolean {
  if (!startDateIso) return true; // sem startDate, considerar elegível
  const start = new Date(startDateIso);
  if (Number.isNaN(start.getTime())) return true;
  const boundStr = policy === 'startDateToWeekStart' ? weekStartIso : weekEndIso;
  if (!boundStr) return true;
  const bound = new Date(boundStr);
  if (Number.isNaN(bound.getTime())) return true;
  return start.getTime() <= bound.getTime();
}
