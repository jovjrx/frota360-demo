import { z } from 'zod';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * SCHEMA: Referral Rule
 * Define regras de indicação que o admin configura
 */

export const ReferralRuleSchema = z.object({
  id: z.string().optional(),
  
  // Valor da indicação
  valueType: z.enum(['fixed', 'percentage']).describe('fixed: valor fixo, percentage: % dos ganhos'),
  value: z.number().min(0).describe('Valor fixo em € ou percentual (0-100)'),
  
  // Critério para receber bonus
  criterioType: z.enum(['immediately', 'after_weeks']).describe('immediately: na semana, after_weeks: após N semanas'),
  weeksToWait: z.number().int().min(0).default(0).describe('Número de semanas para receber bonus'),
  
  // Elegibilidade
  minWeeksActive: z.number().int().min(1).default(1).describe('Mínimo de semanas ativo para receber'),
  
  // Descrição
  descricao: z.string().default(''),
  
  // Status
  ativo: z.boolean().default(true),
  
  // Datas
  dataInicio: z.string().optional(),
  dataFim: z.string().nullable().optional(),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().optional(),
});

export type ReferralRule = z.infer<typeof ReferralRuleSchema>;

export const CreateReferralRuleSchema = ReferralRuleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export const UpdateReferralRuleSchema = CreateReferralRuleSchema.partial();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Cria nova regra de referral com validação
 */
export function createReferralRule(
  data: Omit<ReferralRule, 'id' | 'createdAt' | 'updatedAt'>
): ReferralRule {
  const parsed = CreateReferralRuleSchema.parse(data);
  const now = new Date().toISOString();
  
  return {
    id: `referral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...parsed,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Busca regras de referral ativas
 */
export async function getActiveReferralRules(): Promise<ReferralRule[]> {
  try {
    const snapshot = await adminDb
      .collection('referralRules')
      .where('ativo', '==', true)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ReferralRule));
  } catch (error) {
    console.error('[getActiveReferralRules] Erro:', error);
    return [];
  }
}

/**
 * Valida se motorista pode receber bonus de indicação
 */
export function validateReferralEligibility(
  rule: ReferralRule,
  indicadoGanhos: number,
  weeksActive: number
): { eligible: boolean; amount: number } {
  let eligible = true;
  let amount = 0;

  // Verificar semanas ativas mínimas
  if (rule.minWeeksActive && weeksActive < rule.minWeeksActive) {
    eligible = false;
    return { eligible, amount: 0 };
  }

  if (eligible) {
    amount = rule.valueType === 'fixed' 
      ? rule.value 
      : (indicadoGanhos * rule.value) / 100;
  }

  return { eligible, amount };
}
