import { z } from 'zod';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * SCHEMA: Commission Rule
 * Define regras de comissão que o admin configura
 */

export const CommissionRuleSchema = z.object({
  id: z.string().optional(),
  
  // Tipo de comissão
  type: z.enum(['base', 'recruitment']).describe('base: sobre ganhos próprios, recruitment: sobre indicados'),
  
  // Nível de afiliado
  level: z.number().int().min(1).max(3).describe('1=Bronze, 2=Silver, 3=Gold'),
  
  // Valor da comissão
  percentage: z.number().min(0).max(100).describe('Percentual (0-100)'),
  value: z.number().min(0).optional().describe('Valor fixo em € (alternativa ao percentual)'),
  
  // Descrição
  descricao: z.string().default(''),
  
  // Status
  ativo: z.boolean().default(true),
  
  // Critérios de elegibilidade
  criterios: z.object({
    minGanhos: z.number().default(0).describe('Ganhos mínimos para se qualificar'),
    minRecruitments: z.number().default(0).describe('Mínimo de indicações (para recruitment)'),
    maxWeeksPerYear: z.number().default(52).describe('Máximo de semanas para receber por ano'),
  }).optional(),
  
  // Datas
  dataInicio: z.string().optional(),
  dataFim: z.string().nullable().optional(),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().optional(),
});

export type CommissionRule = z.infer<typeof CommissionRuleSchema>;

export const CreateCommissionRuleSchema = CommissionRuleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export const UpdateCommissionRuleSchema = CreateCommissionRuleSchema.partial();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Cria nova regra de comissão com validação
 */
export function createCommissionRule(
  data: Omit<CommissionRule, 'id' | 'createdAt' | 'updatedAt'>
): CommissionRule {
  const parsed = CreateCommissionRuleSchema.parse(data);
  const now = new Date().toISOString();
  
  return {
    id: `commission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...parsed,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Busca regras de comissão ativas
 */
export async function getActiveCommissionRules(): Promise<CommissionRule[]> {
  try {
    const snapshot = await adminDb
      .collection('commissions')
      .where('ativo', '==', true)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as CommissionRule));
  } catch (error) {
    console.error('[getActiveCommissionRules] Erro:', error);
    return [];
  }
}

/**
 * Busca regra de comissão por nível
 */
export async function getCommissionByLevel(level: number): Promise<CommissionRule[]> {
  try {
    const snapshot = await adminDb
      .collection('commissions')
      .where('level', '==', level)
      .where('ativo', '==', true)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as CommissionRule));
  } catch (error) {
    console.error('[getCommissionByLevel] Erro:', error);
    return [];
  }
}

/**
 * Valida se motorista é elegível para comissão
 */
export function validateCommissionEligibility(
  rule: CommissionRule,
  ganhos: number,
  recruitmentsCount: number
): { eligible: boolean; amount: number } {
  const criteria = rule.criterios || { minGanhos: 0, minRecruitments: 0 };
  
  let eligible = true;
  let amount = 0;

  if (rule.type === 'base') {
    // Comissão base precisa de ganhos mínimos
    if (criteria.minGanhos && ganhos < criteria.minGanhos) {
      eligible = false;
    }
    if (eligible) {
      amount = rule.percentage ? (ganhos * rule.percentage) / 100 : rule.value || 0;
    }
  } else if (rule.type === 'recruitment') {
    // Comissão de recrutamento precisa de indicações
    if (criteria.minRecruitments && recruitmentsCount < criteria.minRecruitments) {
      eligible = false;
    }
    if (eligible) {
      amount = rule.value || 0; // Usualmente valor fixo por indicação
    }
  }

  return { eligible, amount };
}
