import { z } from 'zod';

// Schema para check-in
export const CheckInSchema = z.object({
  id: z.string().optional(),
  driverId: z.string(),
  timestamp: z.number(),
  location: z.object({
    city: z.string(),
    country: z.string(),
    region: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    ip: z.string()
  }),
  type: z.enum(['automatic', 'manual']),
  status: z.enum(['active', 'inactive']),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional()
});

// Schema para criar check-in
export const CreateCheckInSchema = CheckInSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Schema para atualizar status do motorista
export const UpdateDriverStatusSchema = z.object({
  isActive: z.boolean(),
  lastCheckin: z.number().optional(),
  nextCheckin: z.number().optional(),
  checkinCount: z.number().optional()
});

// Tipos TypeScript
export type CheckIn = z.infer<typeof CheckInSchema>;
export type CreateCheckIn = z.infer<typeof CreateCheckInSchema>;
export type UpdateDriverStatus = z.infer<typeof UpdateDriverStatusSchema>;

