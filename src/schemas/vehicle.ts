import { z } from 'zod';

export const VehicleSchema = z.object({
  id: z.string().optional(),
  driverId: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  plate: z.string().min(1),
  color: z.string().optional(),
  vin: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceExpiry: z.number().optional(),
  registrationExpiry: z.number().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const CreateVehicleSchema = VehicleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateVehicleSchema = VehicleSchema.partial().omit({
  id: true,
  driverId: true,
  createdAt: true,
});

export type Vehicle = z.infer<typeof VehicleSchema>;
export type CreateVehicle = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicle = z.infer<typeof UpdateVehicleSchema>;

