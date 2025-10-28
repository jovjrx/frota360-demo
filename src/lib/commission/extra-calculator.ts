import { adminDb } from '@/lib/firebaseAdmin';
import { APP_CONFIG } from '@/lib/config';

export interface ExtraCommissionResult {
  enabled: boolean;
  mode: 'fixed' | 'percent';
  commissionAmount: number;
  percent: number;
  base: number;
}

/**
 * Calcula comissão extra baseada na configuração do APP_CONFIG
 * Esta função foi extraída de driver-week-data.ts para melhor organização
 */
export async function calculateExtraCommission(
  driverId: string,
  driverType: string | undefined,
  completeRecord: any
): Promise<ExtraCommissionResult> {
  const result: ExtraCommissionResult = {
    enabled: false,
    mode: 'fixed',
    commissionAmount: 0,
    percent: 0,
    base: 0,
  };

  try {
    const cfg = APP_CONFIG.finance?.commission;
    const apply = !!(cfg && (cfg as any).enabled);
    const driverApplies = (() => {
      if (!driverType || !cfg) return false;
      if (cfg.applyTo === 'all') return true;
      return cfg.applyTo === driverType;
    })();

    if (!apply || !driverApplies) {
      return result;
    }

    result.enabled = true;

    // Calcular base conforme configuração
    const base = cfg.base === 'repasseBeforeCommission'
      ? (completeRecord.ganhosMenosIVA
          - completeRecord.despesasAdm
          - completeRecord.combustivel
          - completeRecord.viaverde
          - (completeRecord.aluguel || 0)
          - (completeRecord.financingDetails?.totalCost || 0))
      : completeRecord.ganhosMenosIVA;

    result.base = base;

    let commissionAmount = 0;
    if (cfg.mode === 'fixed') {
      commissionAmount = Math.max(0, Number(cfg.fixedAmount || 0));
      result.mode = 'fixed';
    } else {
      const pct = Math.max(0, Number(cfg.percent || 0));
      commissionAmount = base * (pct / 100);
      result.mode = 'percent';
      result.percent = pct;
    }

    result.commissionAmount = commissionAmount;
    return result;
  } catch (e) {
    console.warn('[calculateExtraCommission] Falha ao calcular comissão extra:', e);
    return result;
  }
}

/**
 * Obtém a configuração de comissão extra
 */
export function getExtraCommissionConfig() {
  return APP_CONFIG.finance?.commission || null;
}

