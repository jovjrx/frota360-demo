import { z } from 'zod';

export const DriverRequestSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Telefone inválido'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  nif: z.string().length(9, 'NIF deve ter 9 dígitos'),
  licenseNumber: z.string().optional(),
  type: z.enum(['affiliate', 'renter'], {
    message: 'Tipo deve ser Afiliado ou Locatário',
  }),
  vehicle: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number(),
    plate: z.string(),
  }).optional(),
  status: z.enum(['pending', 'evaluation', 'approved', 'rejected']).default('pending'),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type DriverRequest = z.infer<typeof DriverRequestSchema>;

export const CreateDriverRequestSchema = DriverRequestSchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateDriverRequestSchema = DriverRequestSchema.partial();
