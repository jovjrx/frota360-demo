import { z } from 'zod';

export const WeeklyDriverPlatformDataSchema = z.object({
  id: z.string().optional(), // driverId_weekId_platform
  driverId: z.string(),
  weekId: z.string(),
  platform: z.enum(['uber', 'bolt', 'myprio', 'viaverde', 'cartrack']),
  totalValue: z.number().default(0),
  totalTrips: z.number().default(0),
  rawDataRef: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WeeklyDriverPlatformData = z.infer<typeof WeeklyDriverPlatformDataSchema>;

export function createWeeklyDriverPlatformData(data: Partial<WeeklyDriverPlatformData>): WeeklyDriverPlatformData {
  const now = new Date().toISOString();
  return {
    driverId: data.driverId || '',
    weekId: data.weekId || '',
    platform: data.platform || 'uber',
    totalValue: data.totalValue || 0,
    totalTrips: data.totalTrips || 0,
    rawDataRef: data.rawDataRef || undefined,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
}

