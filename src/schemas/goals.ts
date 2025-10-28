import { z } from 'zod';

/**
 * SCHEMA: Goals
 * Rastreia metas trimestrais e anuais
 */

export const QuarterlyGoalTargetsSchema = z.object({
  totalDrivers: z.number().int().min(0),
  activeDrivers: z.number().int().min(0),
  affiliates: z.number().int().min(0),
  renters: z.number().int().min(0),
  monthlyRevenue: z.number().default(0),
  netProfit: z.number().default(0),
  technicalReserve: z.number().default(0),
  averagePerformanceScore: z.number().min(0).max(100).default(0),
});

export const QuarterlyGoalActualSchema = z.object({
  totalDrivers: z.number().int().min(0).optional(),
  activeDrivers: z.number().int().min(0).optional(),
  affiliates: z.number().int().min(0).optional(),
  renters: z.number().int().min(0).optional(),
  monthlyRevenue: z.number().default(0).optional(),
  netProfit: z.number().default(0).optional(),
  technicalReserve: z.number().default(0).optional(),
  averagePerformanceScore: z.number().min(0).max(100).default(0).optional(),
});

export const QuarterlyGoalSchema = z.object({
  id: z.string().optional(),
  
  // Período
  year: z.number().int().min(2020),
  quarter: z.number().int().min(1).max(4),
  
  // Metas
  targets: QuarterlyGoalTargetsSchema,
  
  // Valores reais (atualizados semanalmente)
  actual: QuarterlyGoalActualSchema.optional(),
  
  // Progresso (0-100%)
  progress: z.number().min(0).max(100).default(0),
  
  // Status
  status: z.enum(['not_started', 'in_progress', 'achieved', 'missed']).default('not_started'),
  
  // Notas
  notes: z.string().optional(),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().default('system'),
});

export const AnnualGoalSchema = z.object({
  id: z.string().optional(),
  
  // Período
  year: z.number().int().min(2020),
  
  // Metas anuais
  targets: z.object({
    totalDriversEndOfYear: z.number().int().min(0),
    totalRevenueAnnual: z.number().default(0),
    totalNetProfitAnnual: z.number().default(0),
    geographicExpansion: z.array(z.string()).default([]),
    platformIntegrations: z.array(z.string()).default([]),
  }),
  
  // Metas por trimestre
  quarterlyGoals: z.array(z.string()).default([]),
  
  // Status geral
  status: z.enum(['planning', 'in_progress', 'completed']).default('planning'),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string().default('system'),
});

export const GoalProgressUpdateSchema = z.object({
  id: z.string().optional(),
  
  // Referência
  goalId: z.string(),
  year: z.number().int().min(2020),
  quarter: z.number().int().min(1).max(4),
  
  // Valores atualizados
  actual: QuarterlyGoalActualSchema,
  
  // Cálculos
  progress: z.number().min(0).max(100),
  status: z.enum(['not_started', 'in_progress', 'achieved', 'missed']),
  
  // Metadados
  updatedAt: z.string(),
  updatedBy: z.string().default('system'),
});

// Types
export type QuarterlyGoalTargets = z.infer<typeof QuarterlyGoalTargetsSchema>;
export type QuarterlyGoalActual = z.infer<typeof QuarterlyGoalActualSchema>;
export type QuarterlyGoal = z.infer<typeof QuarterlyGoalSchema>;
export type AnnualGoal = z.infer<typeof AnnualGoalSchema>;
export type GoalProgressUpdate = z.infer<typeof GoalProgressUpdateSchema>;

/**
 * Calcular progresso geral de uma meta
 * Usa média ponderada das métricas
 */
export function calculateGoalProgress(targets: QuarterlyGoalTargets, actual?: QuarterlyGoalActual): number {
  if (!actual) return 0;
  
  const metrics = [
    { target: targets.totalDrivers, actual: actual.totalDrivers || 0, weight: 0.25 },
    { target: targets.activeDrivers, actual: actual.activeDrivers || 0, weight: 0.25 },
    { target: targets.monthlyRevenue, actual: actual.monthlyRevenue || 0, weight: 0.25 },
    { target: targets.netProfit, actual: actual.netProfit || 0, weight: 0.25 },
  ];
  
  let totalProgress = 0;
  let totalWeight = 0;
  
  for (const metric of metrics) {
    if (metric.target > 0) {
      const progress = Math.min((metric.actual / metric.target) * 100, 100);
      totalProgress += progress * metric.weight;
      totalWeight += metric.weight;
    }
  }
  
  return totalWeight > 0 ? totalProgress / totalWeight : 0;
}

/**
 * Determinar status de uma meta
 */
export function determineGoalStatus(progress: number): 'not_started' | 'in_progress' | 'achieved' | 'missed' {
  if (progress >= 100) return 'achieved';
  if (progress > 0) return 'in_progress';
  return 'not_started';
}

/**
 * Metas padrão para 2026 (conforme Master Blueprint)
 */
export function getDefault2026Goals(): Record<number, QuarterlyGoal> {
  const now = new Date().toISOString();
  
  return {
    1: {
      year: 2026,
      quarter: 1,
      targets: {
        totalDrivers: 15,
        activeDrivers: 15,
        affiliates: 10,
        renters: 5,
        monthlyRevenue: 15000,
        netProfit: 3500,
        technicalReserve: 875,
        averagePerformanceScore: 75,
      },
      progress: 0,
      status: 'not_started',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    },
    2: {
      year: 2026,
      quarter: 2,
      targets: {
        totalDrivers: 25,
        activeDrivers: 25,
        affiliates: 17,
        renters: 8,
        monthlyRevenue: 25000,
        netProfit: 6000,
        technicalReserve: 1500,
        averagePerformanceScore: 76,
      },
      progress: 0,
      status: 'not_started',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    },
    3: {
      year: 2026,
      quarter: 3,
      targets: {
        totalDrivers: 40,
        activeDrivers: 40,
        affiliates: 28,
        renters: 12,
        monthlyRevenue: 40000,
        netProfit: 9500,
        technicalReserve: 2375,
        averagePerformanceScore: 77,
      },
      progress: 0,
      status: 'not_started',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    },
    4: {
      year: 2026,
      quarter: 4,
      targets: {
        totalDrivers: 60,
        activeDrivers: 60,
        affiliates: 42,
        renters: 18,
        monthlyRevenue: 60000,
        netProfit: 14000,
        technicalReserve: 3500,
        averagePerformanceScore: 78,
      },
      progress: 0,
      status: 'not_started',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system',
    },
  };
}


