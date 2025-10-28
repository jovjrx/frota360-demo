import { z } from 'zod';

export const WeeklyPlatformDataSchema = z.object({
  id: z.string().optional(), // driverId_weekId_platform
  driverId: z.string(),
  weekId: z.string(),
  platform: z.enum(['uber', 'bolt', 'myprio', 'viaverde', 'cartrack']), // Adicionar 'cartrack' se necessário
  totalValue: z.number().default(0),
  totalTrips: z.number().default(0),
  rawDataRef: z.string().optional(), // Referência ao documento em rawFileArchive
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WeeklyPlatformData = z.infer<typeof WeeklyPlatformDataSchema>;

export function createWeeklyPlatformData(data: Partial<WeeklyPlatformData>): WeeklyPlatformData {
  const now = new Date().toISOString();
  return {
    driverId: data.driverId || '',
    weekId: data.weekId || '',
    platform: data.platform || 'uber', // Default, mas deve ser sempre fornecido
    totalValue: data.totalValue || 0,
    totalTrips: data.totalTrips || 0,
    rawDataRef: data.rawDataRef || undefined,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
}


