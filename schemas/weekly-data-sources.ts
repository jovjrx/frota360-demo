import { z } from 'zod';

/**
 * Schema para rastrear o status dos dados semanais
 * Usado para gerenciar importações manuais e sincronizações automáticas
 */

export const DataSourceStatusSchema = z.object({
  status: z.enum(['complete', 'partial', 'pending']),
  origin: z.enum(['auto', 'manual']),
  importedAt: z.string().optional(),
  driversCount: z.number().default(0),
  recordsCount: z.number().default(0),
  lastError: z.string().optional(),
  archiveRef: z.string().optional(),
});

export type DataSourceStatus = z.infer<typeof DataSourceStatusSchema>;

export const WeeklyDataSourcesSchema = z.object({
  id: z.string(), // weekId (e.g., "2024-W40")
  weekId: z.string(),
  weekStart: z.string(), // YYYY-MM-DD
  weekEnd: z.string(),   // YYYY-MM-DD
  
  // Status de cada fonte de dados
  sources: z.object({
    uber: DataSourceStatusSchema,
    bolt: DataSourceStatusSchema,
    myprio: DataSourceStatusSchema,
    viaverde: DataSourceStatusSchema,
    cartrack: DataSourceStatusSchema,
  }),
  
  // Status geral
  isComplete: z.boolean().default(false),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  notes: z.string().optional(),
});

export type WeeklyDataSources = z.infer<typeof WeeklyDataSourcesSchema>;

/**
 * Cria um novo registro de fontes de dados para uma semana
 */
export function createWeeklyDataSources(
  weekId: string,
  weekStart: string,
  weekEnd: string
): WeeklyDataSources {
  const now = new Date().toISOString();
  
  const emptySource: DataSourceStatus = {
    status: 'pending',
    origin: 'manual',
    driversCount: 0,
    recordsCount: 0,
  };
  
  return {
    id: weekId,
    weekId,
    weekStart,
    weekEnd,
    sources: {
      uber: { ...emptySource },
      bolt: { ...emptySource },
      myprio: { ...emptySource },
      viaverde: { ...emptySource },
      cartrack: { ...emptySource },
    },
    isComplete: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Atualiza o status de uma fonte de dados
 */
export function updateDataSource(
  sources: WeeklyDataSources,
  platform: 'uber' | 'bolt' | 'myprio' | 'viaverde' | 'cartrack',
  update: Partial<DataSourceStatus>
): WeeklyDataSources {
  const updatedSources = {
    ...sources,
    sources: {
      ...sources.sources,
      [platform]: {
        ...sources.sources[platform],
        ...update,
        importedAt: new Date().toISOString(),
      },
    },
    updatedAt: new Date().toISOString(),
  };
  
  // Verificar se está completo
  updatedSources.isComplete = Object.values(updatedSources.sources).every(
    source => source.status === 'complete'
  );
  
  return updatedSources;
}

/**
 * Verifica se uma semana tem dados completos
 */
export function isWeekComplete(sources: WeeklyDataSources): boolean {
  return Object.values(sources.sources).every(
    source => source.status === 'complete'
  );
}

/**
 * Obtém estatísticas de uma semana
 */
export function getWeekStats(sources: WeeklyDataSources) {
  const totalDrivers = Math.max(
    sources.sources.uber.driversCount,
    sources.sources.bolt.driversCount,
    sources.sources.myprio.driversCount,
    sources.sources.viaverde.driversCount,
    sources.sources.cartrack.driversCount
  );
  
  const completeSources = Object.values(sources.sources).filter(
    s => s.status === 'complete'
  ).length;
  
  const pendingSources = Object.values(sources.sources).filter(
    s => s.status === 'pending'
  ).length;
  
  return {
    totalDrivers,
    completeSources,
    pendingSources,
    totalSources: 5,
    completionPercentage: (completeSources / 5) * 100,
  };
}
