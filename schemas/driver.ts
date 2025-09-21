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

export const DriverStatusSchema = z.enum(['pending', 'active', 'inactive', 'suspended']);

export const DriverDocumentSchema = z.object({
  uploaded: z.boolean().default(false),
  verified: z.boolean().default(false),
  url: z.string().nullable().default(null),
});

export const DriverDocumentsSchema = z.object({
  license: DriverDocumentSchema,
  insurance: DriverDocumentSchema,
  vehicle: DriverDocumentSchema,
});

export const DriverSchema = z.object({
  id: z.string().optional(),
  uid: z.string().min(1), // Firebase UID
  userId: z.string().min(1), // Para compatibilidade
  name: z.string().min(1),
  fullName: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  birthDate: z.string().optional(),
  city: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  vehicleType: z.string().nullable().optional(),
  locale: z.string().default('pt'),
  status: DriverStatusSchema.default('pending'),
  isActive: z.boolean().default(false),
  createdAt: z.any().optional(), // serverTimestamp
  updatedAt: z.any().optional(), // serverTimestamp
  createdBy: z.string().default('self'),
  lastLoginAt: z.any().nullable().optional(),
  weeklyEarnings: z.number().default(0),
  monthlyEarnings: z.number().default(0),
  totalTrips: z.number().default(0),
  rating: z.number().default(0),
  statusUpdatedAt: z.any().nullable().optional(),
  statusUpdatedBy: z.string().nullable().optional(),
  notes: z.string().default(''),
  documents: DriverDocumentsSchema.optional(),
  kyc: DriverKycSchema.optional(),
  vehicle: DriverVehicleSchema.optional(),
  availability: DriverAvailabilitySchema.optional(),
  commission: DriverCommissionSchema.optional(),
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
