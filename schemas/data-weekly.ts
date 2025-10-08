import { z } from "zod";

export const WeeklyNormalizedDataSchema = z.object({
  id: z.string(),
  weekId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  platform: z.enum(["uber", "bolt", "myprio", "viaverde"]),
  referenceId: z.string(),
  referenceLabel: z.string().optional(),
  driverId: z.string().nullable().default(null),
  driverName: z.string().nullable().default(null),
  vehiclePlate: z.string().nullable().default(null),
  totalValue: z.number().default(0),
  totalTrips: z.number().default(0),
  rawDataRef: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WeeklyNormalizedData = z.infer<typeof WeeklyNormalizedDataSchema>;

export function createWeeklyNormalizedData(
  input: Partial<WeeklyNormalizedData>
): WeeklyNormalizedData {
  const now = new Date().toISOString();

  return {
    id: input.id || "",
    weekId: input.weekId || "",
    weekStart: input.weekStart || "",
    weekEnd: input.weekEnd || "",
    platform: input.platform || "uber",
    referenceId: input.referenceId || "",
    referenceLabel: input.referenceLabel,
    driverId: input.driverId ?? null,
    driverName: input.driverName ?? null,
    vehiclePlate: input.vehiclePlate ?? null,
    totalValue: input.totalValue || 0,
    totalTrips: input.totalTrips || 0,
    rawDataRef: input.rawDataRef,
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}
