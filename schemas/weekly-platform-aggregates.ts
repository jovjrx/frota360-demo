import { z } from 'zod';

export const WeeklyPlatformAggregatesSchema = z.object({
  id: z.string().optional(),
  weekId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  platform: z.enum(['uber', 'bolt', 'myprio', 'viaverde', 'cartrack']),
  integrationKey: z.string(), // Chave de integração (UUID, email, cartão, OBU)
  totalValue: z.number().default(0),
  totalTrips: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WeeklyPlatformAggregates = z.infer<typeof WeeklyPlatformAggregatesSchema>;

export function createWeeklyPlatformAggregates(data: Partial<WeeklyPlatformAggregates>): WeeklyPlatformAggregates {
  const now = new Date().toISOString();
  return {
    weekId: data.weekId || '',
    weekStart: data.weekStart || '',
    weekEnd: data.weekEnd || '',
    platform: data.platform || 'uber', // Default para evitar erro, mas deve ser sempre fornecido
    integrationKey: data.integrationKey || '',
    totalValue: data.totalValue || 0,
    totalTrips: data.totalTrips || 0,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
}

