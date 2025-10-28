import { z } from 'zod';

/**
 * Schema para uma semana específica (maestro)
 * Rastreia o status geral, quais integrações foram importadas e processadas
 */

export const WeeklyPlatformStatusSchema = z.object({
  platform: z.enum(['uber', 'bolt', 'myprio', 'viaverde']),
  imported: z.boolean().default(false),
  importedAt: z.string().optional(), // ISO 8601
  recordsCount: z.number().default(0),
  processedAt: z.string().optional(), // ISO 8601 (FASE 2)
  paidAt: z.string().optional(), // ISO 8601 (FASE 3)
  error: z.string().optional(),
});

export type WeeklyPlatformStatus = z.infer<typeof WeeklyPlatformStatusSchema>;

export const WeeklySchema = z.object({
  id: z.string(), // weekId (e.g., "2025-W43")
  weekId: z.string(), // (e.g., "2025-W43")
  weekStart: z.string(), // YYYY-MM-DD
  weekEnd: z.string(), // YYYY-MM-DD
  
  // Status das 4 plataformas
  platforms: z.object({
    uber: WeeklyPlatformStatusSchema,
    bolt: WeeklyPlatformStatusSchema,
    myprio: WeeklyPlatformStatusSchema,
    viaverde: WeeklyPlatformStatusSchema,
  }),
  
  // Status geral da semana
  status: z.enum(['draft', 'imported', 'processed', 'paid']).default('draft'),
  
  // Totais agregados
  totalRecords: z.number().default(0),
  totalAmount: z.number().default(0),
  totalBonus: z.number().default(0),
  
  // Timestamps
  createdAt: z.string(), // ISO 8601
  updatedAt: z.string(), // ISO 8601
  
  // Metadados
  notes: z.string().optional(),
});

export type Weekly = z.infer<typeof WeeklySchema>;

/**
 * Cria um novo registro de semana com status inicial
 */
export function createWeekly(
  weekId: string,
  weekStart: string,
  weekEnd: string,
  notes?: string
): Weekly {
  const now = new Date().toISOString();
  const result: Weekly = {
    id: weekId,
    weekId,
    weekStart,
    weekEnd,
    platforms: {
      uber: { platform: 'uber', imported: false, recordsCount: 0 },
      bolt: { platform: 'bolt', imported: false, recordsCount: 0 },
      myprio: { platform: 'myprio', imported: false, recordsCount: 0 },
      viaverde: { platform: 'viaverde', imported: false, recordsCount: 0 },
    },
    status: 'draft',
    totalRecords: 0,
    totalAmount: 0,
    totalBonus: 0,
    createdAt: now,
    updatedAt: now,
  };
  
  // Apenas adicionar notes se fornecido
  if (notes) {
    result.notes = notes;
  }
  
  return result;
}

/**
 * Atualiza status de uma plataforma após importação
 */
export function updatePlatformImported(
  weekly: Weekly,
  platform: 'uber' | 'bolt' | 'myprio' | 'viaverde',
  recordsCount: number
): Weekly {
  return {
    ...weekly,
    platforms: {
      ...weekly.platforms,
      [platform]: {
        ...weekly.platforms[platform],
        imported: true,
        importedAt: new Date().toISOString(),
        recordsCount,
      },
    },
    // Determina se todas as integrações foram importadas
    status: Object.entries(weekly.platforms).every(
      ([key, p]) => key === platform || p.imported
    )
      ? 'imported'
      : 'draft',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Marca a semana como processada (FASE 2)
 */
export function markWeeklyProcessed(
  weekly: Weekly,
  totals: { totalRecords: number; totalAmount: number; totalBonus: number }
): Weekly {
  return {
    ...weekly,
    status: 'processed',
    totalRecords: totals.totalRecords,
    totalAmount: totals.totalAmount,
    totalBonus: totals.totalBonus,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Marca a semana como paga (FASE 3)
 */
export function markWeeklyPaid(weekly: Weekly): Weekly {
  return {
    ...weekly,
    status: 'paid',
    updatedAt: new Date().toISOString(),
  };
}
