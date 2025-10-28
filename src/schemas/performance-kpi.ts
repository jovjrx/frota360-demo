import { z } from 'zod';

/**
 * SCHEMA: Performance KPI
 * Rastreia KPIs de desempenho dos motoristas
 */

export const PerformanceKPISchema = z.object({
  id: z.string().optional(),
  driverId: z.string(),
  driverName: z.string(),
  
  weekId: z.string(),        // 2024-W40
  weekStart: z.string(),      // YYYY-MM-DD
  weekEnd: z.string(),        // YYYY-MM-DD
  
  // KPI 1: Receita Semanal
  weeklyRevenue: z.object({
    value: z.number().default(0),
    targetMin: z.number().default(600),
    targetExcellence: z.number().default(800),
    score: z.number().min(0).max(100).default(0),
    weight: z.number().default(0.30),
  }),
  
  // KPI 2: Taxa de Aceitação
  acceptanceRate: z.object({
    value: z.number().default(0),        // Percentual 0-100
    targetMin: z.number().default(85),
    targetExcellence: z.number().default(95),
    score: z.number().min(0).max(100).default(0),
    weight: z.number().default(0.20),
  }),
  
  // KPI 3: Avaliação de Passageiros
  passengerRating: z.object({
    value: z.number().default(0),        // 1-5
    targetMin: z.number().default(4.5),
    targetExcellence: z.number().default(4.8),
    score: z.number().min(0).max(100).default(0),
    weight: z.number().default(0.25),
  }),
  
  // KPI 4: Recrutamentos Ativos (por trimestre)
  recruitmentsActive: z.object({
    value: z.number().default(0),
    targetMin: z.number().default(1),
    targetExcellence: z.number().default(2),
    score: z.number().min(0).max(100).default(0),
    weight: z.number().default(0.15),
  }),
  
  // KPI 5: Horas Ativas por Semana
  activeHoursPerWeek: z.object({
    value: z.number().default(0),
    targetMin: z.number().default(40),
    targetExcellence: z.number().default(50),
    score: z.number().min(0).max(100).default(0),
    weight: z.number().default(0.10),
  }),
  
  // Score geral
  overallScore: z.number().min(0).max(100).default(0),
  performanceLevel: z.enum(['Abaixo da Meta', 'Satisfatório', 'Bom', 'Excelente']).default('Satisfatório'),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PerformanceHistorySchema = z.object({
  id: z.string().optional(),
  driverId: z.string(),
  driverName: z.string(),
  
  // Período
  year: z.number().int().min(2020),
  quarter: z.number().int().min(1).max(4),
  
  // Histórico semanal
  weeklyScores: z.array(z.object({
    weekId: z.string(),
    weekStart: z.string(),
    weekEnd: z.string(),
    score: z.number().min(0).max(100),
    level: z.enum(['Abaixo da Meta', 'Satisfatório', 'Bom', 'Excelente']),
  })).default([]),
  
  // Agregados do trimestre
  averageScore: z.number().min(0).max(100).default(0),
  bestWeekScore: z.number().min(0).max(100).default(0),
  worstWeekScore: z.number().min(0).max(100).default(0),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PerformanceRankingSchema = z.object({
  id: z.string().optional(),
  
  // Período
  weekId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  
  // Rankings
  byRevenue: z.array(z.object({
    rank: z.number().int().min(1),
    driverId: z.string(),
    driverName: z.string(),
    value: z.number().default(0),
  })).default([]),
  
  byPerformanceScore: z.array(z.object({
    rank: z.number().int().min(1),
    driverId: z.string(),
    driverName: z.string(),
    score: z.number().min(0).max(100),
  })).default([]),
  
  byRecruitments: z.array(z.object({
    rank: z.number().int().min(1),
    driverId: z.string(),
    driverName: z.string(),
    value: z.number().int().default(0),
  })).default([]),
  
  // Metadados
  createdAt: z.string(),
});

// Types
export type PerformanceKPI = z.infer<typeof PerformanceKPISchema>;
export type PerformanceHistory = z.infer<typeof PerformanceHistorySchema>;
export type PerformanceRanking = z.infer<typeof PerformanceRankingSchema>;

/**
 * Calcular score de um KPI individual
 * Score linear: 60 pontos na meta mínima, 100 pontos na meta de excelência
 */
export function calculateKPIScore(value: number, targetMin: number, targetExcellence: number): number {
  if (value >= targetExcellence) return 100;
  if (value <= targetMin) return 60;
  
  const range = targetExcellence - targetMin;
  const progress = value - targetMin;
  return 60 + (progress / range) * 40;
}

/**
 * Calcular score geral ponderado
 */
export function calculateOverallScore(kpi: PerformanceKPI): number {
  return (
    kpi.weeklyRevenue.score * kpi.weeklyRevenue.weight +
    kpi.acceptanceRate.score * kpi.acceptanceRate.weight +
    kpi.passengerRating.score * kpi.passengerRating.weight +
    kpi.recruitmentsActive.score * kpi.recruitmentsActive.weight +
    kpi.activeHoursPerWeek.score * kpi.activeHoursPerWeek.weight
  );
}

/**
 * Determinar nível de desempenho
 */
export function getPerformanceLevel(score: number): 'Abaixo da Meta' | 'Satisfatório' | 'Bom' | 'Excelente' {
  if (score >= 90) return 'Excelente';
  if (score >= 75) return 'Bom';
  if (score >= 60) return 'Satisfatório';
  return 'Abaixo da Meta';
}


