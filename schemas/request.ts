import { z } from 'zod';

export const requestSchema = z.object({
  fullName: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(9, 'Telefone deve ter pelo menos 9 dígitos'),
  city: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  nif: z.string().length(9, 'NIF deve ter 9 dígitos'),
  licenseNumber: z.string().optional(),
  driverType: z.enum(['affiliate', 'renter'], {
    message: 'Tipo de motorista é obrigatório',
  }),
  vehicle: z.object({
    make: z.string().min(2, 'Marca deve ter pelo menos 2 caracteres'),
    model: z.string().min(2, 'Modelo deve ter pelo menos 2 caracteres'),
    year: z.number().min(2000, 'Ano deve ser maior que 2000').max(new Date().getFullYear() + 1, 'Ano inválido'),
    plate: z.string().min(6, 'Matrícula deve ter pelo menos 6 caracteres'),
  }).optional(),
}).refine((data) => {
  // Se for afiliado, o veículo é obrigatório
  if (data.driverType === 'affiliate' && !data.vehicle) {
    return false;
  }
  return true;
}, {
  message: 'Informações do veículo são obrigatórias para motoristas afiliados',
  path: ['vehicle'],
});

export type RequestData = z.infer<typeof requestSchema>;

export const requestStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export type RequestStatus = z.infer<typeof requestStatusSchema>;

export const requestWithIdSchema = requestSchema.safeExtend({
  id: z.string(),
  status: requestStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

export type RequestWithId = z.infer<typeof requestWithIdSchema>;

// Schema para aprovação de solicitação
export const approveRequestSchema = z.object({
  requestId: z.string().min(1, 'ID da solicitação é obrigatório'),
  adminNotes: z.string().optional(),
});

export type ApproveRequestSchema = z.infer<typeof approveRequestSchema>;

// Schema para rejeição de solicitação
export const rejectRequestSchema = z.object({
  requestId: z.string().min(1, 'ID da solicitação é obrigatório'),
  rejectionReason: z.string().min(1, 'Motivo da rejeição é obrigatório'),
});

export type RejectRequestSchema = z.infer<typeof rejectRequestSchema>;