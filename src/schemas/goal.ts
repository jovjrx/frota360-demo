import { z } from 'zod';

/**
 * Schema para Goals/Recompensas
 * Tabela independente para gerenciar metas de motoristas
 * Consultada durante FASE 2 de processamento de pagamentos
 */

export const GoalSchema = z.object({
  id: z.string(),
  
  // Descrição da meta
  descricao: z.string().min(5).max(200),
  
  // Tipo de critério
  criterio: z.enum(['ganho', 'viagens']),
  
  // Tipo de recompensa
  tipo: z.enum(['valor', 'percentual']),
  
  // Valor da meta (€ ou número de viagens)
  valor: z.number().positive(),
  
  // Valor da recompensa (€ ou %)
  recompensa: z.number().positive(),
  
  // Nível de prioridade (1-10)
  nivel: z.number().int().min(1).max(10),
  
  // Status
  ativo: z.boolean().default(true),
  
  // Data de início (opcional)
  dataInicio: z.string().optional(), // YYYY-MM-DD
  
  // Metadados
  createdAt: z.string(), // ISO 8601
  updatedAt: z.string(), // ISO 8601
  createdBy: z.string().optional(),
});

export type Goal = z.infer<typeof GoalSchema>;

/**
 * Schema para criar nova goal (sem id, timestamps)
 */
export const CreateGoalSchema = GoalSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type CreateGoal = z.infer<typeof CreateGoalSchema>;

/**
 * Schema para atualizar goal
 */
export const UpdateGoalSchema = CreateGoalSchema.partial();

export type UpdateGoal = z.infer<typeof UpdateGoalSchema>;

/**
 * Cria uma nova goal com timestamps
 */
export function createGoal(
  data: CreateGoal,
  createdBy?: string
): Goal {
  const now = new Date().toISOString();
  return {
    id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    createdAt: now,
    updatedAt: now,
    createdBy,
  };
}

/**
 * Valida elegibilidade do motorista para uma meta
 * Retorna: { eligible, recompensa }
 */
export function validateGoalEligibility(
  goal: Goal,
  ganhos: number,
  viagens: number
): { eligible: boolean; recompensa: number } {
  let eligible = false;
  let recompensa = 0;

  if (goal.criterio === 'ganho' && ganhos >= goal.valor) {
    eligible = true;
    recompensa =
      goal.tipo === 'valor'
        ? goal.recompensa
        : (ganhos * goal.recompensa) / 100;
  }

  if (goal.criterio === 'viagens' && viagens >= goal.valor) {
    eligible = true;
    recompensa = goal.recompensa; // Sempre valor fixo para viagens
  }

  return { eligible, recompensa };
}

/**
 * Filtra goals ativos por data
 */
export function getActiveGoals(
  goals: Goal[],
  dateStr?: string
): Goal[] {
  const refDate = dateStr ? new Date(dateStr) : new Date();
  const timestamp = refDate.getTime();

  return goals.filter((goal) => {
    if (!goal.ativo) return false;
    if (!goal.dataInicio) return true;
    
    const startDate = new Date(goal.dataInicio).getTime();
    return timestamp >= startDate;
  });
}
