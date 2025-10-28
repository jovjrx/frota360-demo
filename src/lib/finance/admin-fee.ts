import { adminDb } from '@/lib/firebaseAdmin';

// Bases possíveis para calcular a taxa administrativa
export type AdminFeeBase =
  | 'ganhosBrutos'                     // Uber + Bolt
  | 'ganhosMenosIVA'                   // Ganhos - IVA
  | 'ganhosBrutosMenosDespesas'       // Ganhos - (combustível + portagens + aluguel + financiamento)
  | 'ganhosMenosIVAMenosDespesas';    // Ganhos - IVA - (combustível + portagens + aluguel + financiamento)

export interface AdminFeeRule {
  mode: 'percent' | 'fixed';
  value: number;              // percentual (0-100) ou valor em €
  base: AdminFeeBase;         // sobre qual base calcular
}

export interface AdminFeeConfig {
  affiliate: AdminFeeRule;    // Regra padrão para afiliados
  renter: AdminFeeRule;       // Regra padrão para locatários
}

export interface AdminFeeContextBases {
  ganhosBrutos: number;       // uber + bolt
  ivaValor: number;           // 6% dos ganhos brutos
  combustivel: number;        // MyPrio
  portagens: number;          // ViaVerde (apenas se aplicável)
  aluguel: number;            // Se locatário
  financiamentoTotal: number; // parcela semanal + juros (weeklyWithFees)
}

const DEFAULT_CONFIG: AdminFeeConfig = {
  affiliate: { mode: 'fixed', value: 25, base: 'ganhosMenosIVA' },
  renter: { mode: 'percent', value: 4, base: 'ganhosMenosIVA' },
};

const CONFIG_PATH = 'config/adminFee';

// Leitura com retrocompatibilidade (aceita formato antigo {mode, percentValue, fixedValue, appliedToBase})
export async function getAdminFeeConfig(): Promise<AdminFeeConfig> {
  try {
    const doc = await adminDb.doc(CONFIG_PATH).get();
    if (!doc.exists) return DEFAULT_CONFIG;
    const data = doc.data() || {} as any;

    // Novo formato (por tipo)
    if (data.affiliate || data.renter) {
      const sanitize = (rule: any, fallback: AdminFeeRule): AdminFeeRule => ({
        mode: rule?.mode === 'percent' ? 'percent' : rule?.mode === 'fixed' ? 'fixed' : fallback.mode,
        value: typeof rule?.value === 'number' ? Math.max(0, rule.value) : fallback.value,
        base: (['ganhosBrutos', 'ganhosMenosIVA', 'ganhosBrutosMenosDespesas', 'ganhosMenosIVAMenosDespesas'] as AdminFeeBase[])
          .includes(rule?.base) ? rule.base : fallback.base,
      });
      return {
        affiliate: sanitize(data.affiliate, DEFAULT_CONFIG.affiliate),
        renter: sanitize(data.renter, DEFAULT_CONFIG.renter),
      };
    }

    // Formato antigo → converter para ambos os tipos
    const mode = data.mode === 'fixed' ? 'fixed' : 'percent';
    const value = mode === 'percent'
      ? (typeof data.percentValue === 'number' ? Math.max(0, Math.min(100, data.percentValue)) : DEFAULT_CONFIG.affiliate.value)
      : (typeof data.fixedValue === 'number' ? Math.max(0, data.fixedValue) : DEFAULT_CONFIG.affiliate.value);
    const base: AdminFeeBase = ((): AdminFeeBase => {
      switch (data.appliedToBase) {
        case 'repasse':
          // Diário antigo: aproximar para ganhosMenosIVAMenosDespesas (mais próximo do repasse antes de bônus)
          return 'ganhosMenosIVAMenosDespesas';
        case 'ganhosMenosIVA':
        default:
          return 'ganhosMenosIVA';
      }
    })();
    const legacyRule: AdminFeeRule = { mode, value, base };
    return { affiliate: legacyRule, renter: legacyRule };
  } catch (e) {
    console.warn('[getAdminFeeConfig] usando padrão:', e);
    return DEFAULT_CONFIG;
  }
}

export async function updateAdminFeeConfig(config: Partial<AdminFeeConfig> | any): Promise<AdminFeeConfig> {
  const current = await getAdminFeeConfig();

  // Permitir também payload do formato antigo ({mode, percentValue, fixedValue, appliedToBase})
  if (config && (config.mode || config.percentValue !== undefined || config.fixedValue !== undefined || config.appliedToBase)) {
    const mode = config.mode === 'fixed' ? 'fixed' : 'percent';
    const value = mode === 'percent'
      ? (typeof config.percentValue === 'number' ? Math.max(0, Math.min(100, config.percentValue)) : current.affiliate.value)
      : (typeof config.fixedValue === 'number' ? Math.max(0, config.fixedValue) : current.affiliate.value);
    const base: AdminFeeBase = ((): AdminFeeBase => {
      switch (config.appliedToBase) {
        case 'repasse':
          return 'ganhosMenosIVAMenosDespesas';
        case 'ganhosMenosIVA':
        default:
          return 'ganhosMenosIVA';
      }
    })();
    const legacyRule: AdminFeeRule = { mode, value, base };
    const updatedLegacy: AdminFeeConfig = { affiliate: legacyRule, renter: legacyRule };
    await adminDb.doc(CONFIG_PATH).set(updatedLegacy, { merge: true });
    return updatedLegacy;
  }

  const sanitizeRule = (rule?: Partial<AdminFeeRule>, fallback?: AdminFeeRule): AdminFeeRule => ({
    mode: rule?.mode === 'fixed' ? 'fixed' : 'percent',
    value: typeof rule?.value === 'number' ? Math.max(0, rule.value) : (fallback?.value ?? 0),
    base: (['ganhosBrutos', 'ganhosMenosIVA', 'ganhosBrutosMenosDespesas', 'ganhosMenosIVAMenosDespesas'] as AdminFeeBase[])
      .includes(rule?.base as any) ? (rule!.base as AdminFeeBase) : (fallback?.base ?? 'ganhosMenosIVA'),
  });

  const updated: AdminFeeConfig = {
    affiliate: sanitizeRule(config.affiliate as any, current.affiliate),
    renter: sanitizeRule(config.renter as any, current.renter),
  };

  await adminDb.doc(CONFIG_PATH).set(updated, { merge: true });
  return updated;
}

function resolveBaseValue(rule: AdminFeeRule, ctx: AdminFeeContextBases): number {
  switch (rule.base) {
    case 'ganhosBrutos':
      return ctx.ganhosBrutos;
    case 'ganhosMenosIVA':
      return Math.max(0, ctx.ganhosBrutos - ctx.ivaValor);
    case 'ganhosBrutosMenosDespesas':
      return Math.max(0, ctx.ganhosBrutos - (ctx.combustivel + ctx.portagens + ctx.aluguel + ctx.financiamentoTotal));
    case 'ganhosMenosIVAMenosDespesas':
      return Math.max(0, ctx.ganhosBrutos - ctx.ivaValor - (ctx.combustivel + ctx.portagens + ctx.aluguel + ctx.financiamentoTotal));
    default:
      return Math.max(0, ctx.ganhosBrutos - ctx.ivaValor);
  }
}

export function computeAdminFeeForDriver(
  driver: { type?: 'affiliate' | 'renter'; adminFee?: { mode?: 'percent' | 'fixed'; percentValue?: number; fixedValue?: number } },
  config: AdminFeeConfig,
  ctx: AdminFeeContextBases
): { fee: number; baseUsed: number; ruleUsed: AdminFeeRule } {
  const type: 'affiliate' | 'renter' = driver?.type === 'renter' ? 'renter' : 'affiliate';
  const rule = config[type] || DEFAULT_CONFIG[type];

  // Se o motorista tem valor customizado, respeitar (mode + value), mas a base vem da regra do tipo
  const effectiveRule: AdminFeeRule = {
    mode: driver?.adminFee?.mode === 'fixed' ? 'fixed' : driver?.adminFee?.mode === 'percent' ? 'percent' : rule.mode,
    value: (() => {
      if (driver?.adminFee?.mode === 'fixed' && typeof driver.adminFee.fixedValue === 'number') return Math.max(0, driver.adminFee.fixedValue);
      if (driver?.adminFee?.mode === 'percent' && typeof driver.adminFee.percentValue === 'number') return Math.max(0, Math.min(100, driver.adminFee.percentValue));
      return rule.value;
    })(),
    base: rule.base,
  };

  const baseValue = resolveBaseValue(effectiveRule, ctx);
  let fee = 0;
  if (effectiveRule.mode === 'percent') {
    fee = (baseValue * effectiveRule.value) / 100;
  } else {
    fee = effectiveRule.value;
  }
  return { fee: Math.max(0, fee), baseUsed: baseValue, ruleUsed: effectiveRule };
}

