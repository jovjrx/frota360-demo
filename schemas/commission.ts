import { z } from 'zod';

/**
 * SCHEMA: Commission
 * Rastreia comissões de afiliados (base + recrutamento)
 */

export const CommissionRatesSchema = z.object({
  level1: z.object({
    base: z.number().default(0.05),        // 5% de comissão base
    recruitment: z.number().default(0.02), // 2% de comissão de recrutamento
  }),
  level2: z.object({
    base: z.number().default(0.07),        // 7% de comissão base
    recruitment: z.number().default(0.03), // 3% de comissão de recrutamento
  }),
  level3: z.object({
    base: z.number().default(0.10),        // 10% de comissão base
    recruitment: z.number().default(0.05), // 5% de comissão de recrutamento
  }),
});

export const CommissionBreakdownSchema = z.object({
  recruitedDriverId: z.string(),
  recruitedDriverName: z.string(),
  recruitedDriverRevenue: z.number().default(0),
  commissionRate: z.number().default(0),
  commissionAmount: z.number().default(0),
});

export const DriverWeeklyCommissionSchema = z.object({
  id: z.string().optional(),
  driverId: z.string(),
  driverName: z.string(),
  weekId: z.string(),        // 2024-W40
  weekStart: z.string(),      // YYYY-MM-DD
  weekEnd: z.string(),        // YYYY-MM-DD
  
  // Nível do afiliado
  affiliateLevel: z.number().int().min(1).max(3).default(1),
  
  // Receita própria
  driverRevenue: z.number().default(0),
  
  // Comissão base (sobre própria receita)
  baseCommissionRate: z.number().default(0),
  baseCommission: z.number().default(0),
  
  // Comissão de recrutamento
  recruitmentCommissionRate: z.number().default(0),
  recruitmentCommission: z.number().default(0),
  recruitmentBreakdown: z.array(CommissionBreakdownSchema).default([]),
  
  // Total
  totalCommission: z.number().default(0),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AffiliateProgressionSchema = z.object({
  id: z.string().optional(),
  driverId: z.string(),
  driverName: z.string(),
  
  // Progressão de nível
  fromLevel: z.number().int().min(1).max(3),
  toLevel: z.number().int().min(1).max(3),
  progressionDate: z.string(),
  
  // Critérios atingidos
  monthsInNetwork: z.number().default(0),
  totalRecruitments: z.number().default(0),
  averagePerformanceScore: z.number().default(0),
  
  // Metadados
  createdAt: z.string(),
  createdBy: z.string().default('system'),
});

export const AffiliateMetricsSchema = z.object({
  id: z.string().optional(),
  driverId: z.string(),
  driverName: z.string(),
  
  // Nível atual
  currentLevel: z.number().int().min(1).max(3).default(1),
  
  // Recrutamentos
  totalRecruitments: z.number().default(0),
  activeRecruitments: z.number().default(0),
  recruitedAt: z.array(z.object({
    driverId: z.string(),
    driverName: z.string(),
    recruitedDate: z.string(),
    status: z.enum(['active', 'inactive', 'suspended']),
  })).default([]),
  
  // Datas importantes
  joinedAt: z.string(),
  levelProgressionDate: z.string().nullable().optional(),
  
  // Comissões acumuladas
  totalCommissionsEarned: z.number().default(0),
  commissionsByLevel: z.object({
    level1: z.number().default(0),
    level2: z.number().default(0),
    level3: z.number().default(0),
  }).default({ level1: 0, level2: 0, level3: 0 }),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Types
export type CommissionRates = z.infer<typeof CommissionRatesSchema>;
export type CommissionBreakdown = z.infer<typeof CommissionBreakdownSchema>;
export type DriverWeeklyCommission = z.infer<typeof DriverWeeklyCommissionSchema>;
export type AffiliateProgression = z.infer<typeof AffiliateProgressionSchema>;
export type AffiliateMetrics = z.infer<typeof AffiliateMetricsSchema>;

/**
 * Obter taxas de comissão padrão
 */
export function getDefaultCommissionRates(): CommissionRates {
  return {
    level1: { base: 0.05, recruitment: 0.02 },
    level2: { base: 0.07, recruitment: 0.03 },
    level3: { base: 0.10, recruitment: 0.05 },
  };
}

/**
 * Obter taxa de comissão para um nível específico
 */
export function getCommissionRateForLevel(level: 1 | 2 | 3): { base: number; recruitment: number } {
  const rates = getDefaultCommissionRates();
  return rates[`level${level}` as keyof CommissionRates];
}

