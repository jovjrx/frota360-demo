import { z } from 'zod';

export const DriverKycSchema = z.object({
  docType: z.enum(['CNH', 'Certificado TVDE', 'Seguro', 'Outro']),
  docNumber: z.string().min(1),
  files: z.array(z.string()).default([]),
});

export const DriverVehicleSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  plate: z.string().min(1),
});

export const DriverAvailabilitySchema = z.object({
  active: z.boolean().default(false),
});

export const DriverCommissionSchema = z.object({
  percent: z.number().min(0).max(100).optional(),
});

export const DriverStatusSchema = z.enum(['pending', 'approved', 'rejected', 'suspended']);

export const DriverSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  locale: z.string().default('pt'),
  status: DriverStatusSchema.default('pending'),
  kyc: DriverKycSchema.optional(),
  vehicle: DriverVehicleSchema.optional(),
  availability: DriverAvailabilitySchema.optional(),
  commission: DriverCommissionSchema.optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export const CreateDriverSchema = DriverSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDriverSchema = DriverSchema.partial().omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const VerifyDriverSchema = z.object({
  status: DriverStatusSchema,
  reason: z.string().optional(),
});

export type Driver = z.infer<typeof DriverSchema>;
export type CreateDriver = z.infer<typeof CreateDriverSchema>;
export type UpdateDriver = z.infer<typeof UpdateDriverSchema>;
export type VerifyDriver = z.infer<typeof VerifyDriverSchema>;
export type DriverStatus = z.infer<typeof DriverStatusSchema>;
