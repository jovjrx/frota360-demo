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

  const result: any = {
    id: input.id || "",
    weekId: input.weekId || "",
    weekStart: input.weekStart || "",
    weekEnd: input.weekEnd || "",
    platform: input.platform || "uber",
    referenceId: input.referenceId || "",
    driverId: input.driverId ?? null,
    driverName: input.driverName ?? null,
    vehiclePlate: input.vehiclePlate ?? null,
    totalValue: input.totalValue || 0,
    totalTrips: input.totalTrips || 0,
    createdAt: input.createdAt || now,
    updatedAt: now,
  };

  // Only add optional fields if they have values (avoid undefined in Firestore)
  if (input.referenceLabel !== undefined && input.referenceLabel !== null) {
    result.referenceLabel = input.referenceLabel;
  }
  if (input.rawDataRef !== undefined && input.rawDataRef !== null) {
    result.rawDataRef = input.rawDataRef;
  }

  return result;
}

