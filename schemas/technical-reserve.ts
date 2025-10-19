import { z } from 'zod';

/**
 * SCHEMA: Technical Reserve
 * Rastreia reserva técnica (25% do lucro líquido)
 */

export const TechnicalReserveEntrySchema = z.object({
  id: z.string().optional(),
  
  // Referência semanal
  weekId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  
  // Cálculo
  netProfit: z.number().default(0),
  reservePercentage: z.number().default(0.25), // 25%
  reserveAmount: z.number().default(0),
  
  // Acumulado
  accumulatedTotal: z.number().default(0),
  
  // Saúde financeira
  operationalMargin: z.object({
    percentage: z.number().default(0),
    status: z.enum(['healthy', 'warning', 'critical']).default('healthy'),
  }),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const TechnicalReserveSummarySchema = z.object({
  id: z.string().optional(),
  
  // Período
  year: z.number().int().min(2020),
  quarter: z.number().int().min(1).max(4),
  
  // Totais
  totalReserveAccumulated: z.number().default(0),
  totalNetProfit: z.number().default(0),
  averageWeeklyReserve: z.number().default(0),
  
  // Histórico semanal
  weeklyEntries: z.array(z.object({
    weekId: z.string(),
    weekStart: z.string(),
    weekEnd: z.string(),
    reserveAmount: z.number(),
    accumulatedTotal: z.number(),
  })).default([]),
  
  // Cobertura
  weeksOfOperationsCovered: z.number().default(0),
  
  // Saúde geral
  averageOperationalMargin: z.number().default(0),
  healthStatus: z.enum(['healthy', 'warning', 'critical']).default('healthy'),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ReserveCoverageAnalysisSchema = z.object({
  id: z.string().optional(),
  
  // Período
  year: z.number().int().min(2020),
  quarter: z.number().int().min(1).max(4),
  
  // Análise de cobertura
  totalReserve: z.number().default(0),
  
  // Custos operacionais semanais
  averageWeeklyOperatingCosts: z.number().default(0),
  
  // Cálculos
  weeksOfCoverage: z.number().default(0),
  daysOfCoverage: z.number().default(0),
  
  // Cenários adversos
  adverseScenarios: z.array(z.object({
    name: z.string(),
    description: z.string(),
    revenueDecline: z.number().default(0), // Percentual de queda
    costIncrease: z.number().default(0),   // Percentual de aumento
    weeksOfCoverageRemaining: z.number().default(0),
    isViable: z.boolean().default(true),
  })).default([]),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types
export type TechnicalReserveEntry = z.infer<typeof TechnicalReserveEntrySchema>;
export type TechnicalReserveSummary = z.infer<typeof TechnicalReserveSummarySchema>;
export type ReserveCoverageAnalysis = z.infer<typeof ReserveCoverageAnalysisSchema>;

/**
 * Determinar status de saúde financeira baseado na margem operacional
 */
export function getHealthStatus(operationalMargin: number): 'healthy' | 'warning' | 'critical' {
  if (operationalMargin >= 24) return 'healthy';
  if (operationalMargin >= 20) return 'warning';
  return 'critical';
}

/**
 * Calcular semanas de cobertura
 */
export function calculateWeeksOfCoverage(totalReserve: number, averageWeeklyOperatingCosts: number): number {
  if (averageWeeklyOperatingCosts === 0) return 0;
  return Math.floor(totalReserve / averageWeeklyOperatingCosts);
}

/**
 * Calcular dias de cobertura
 */
export function calculateDaysOfCoverage(weeksOfCoverage: number): number {
  return weeksOfCoverage * 7;
}

/**
 * Simular cenário adverso
 */
export function simulateAdverseScenario(
  totalReserve: number,
  averageWeeklyOperatingCosts: number,
  revenueDecline: number,
  costIncrease: number
): { weeksOfCoverageRemaining: number; isViable: boolean } {
  // Custos aumentados
  const increasedCosts = averageWeeklyOperatingCosts * (1 + costIncrease / 100);
  
  // Semanas de cobertura com custos aumentados
  const weeksOfCoverageRemaining = Math.floor(totalReserve / increasedCosts);
  
  // Viável se conseguir cobrir pelo menos 6 semanas
  const isViable = weeksOfCoverageRemaining >= 6;
  
  return { weeksOfCoverageRemaining, isViable };
}

