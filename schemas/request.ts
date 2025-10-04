import { z } from 'zod';

// Tipos de motorista
export const DriverTypeSchema = z.enum(['affiliate', 'renter']);

// Status da solicitação
export const RequestStatusSchema = z.enum(['pending', 'approved', 'rejected', 'contacted']);

// Schema para criação de solicitação
export const CreateRequestSchema = z.object({
  // Dados pessoais
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  birthDate: z.string().optional(),
  
  // Tipo de motorista
  driverType: DriverTypeSchema,
  
  // Informações da carta de condução
  licenseNumber: z.string().min(1, 'Número da carta é obrigatório'),
  licenseExpiry: z.string().min(1, 'Validade da carta é obrigatória'),
  
  // Informações do veículo (apenas para afiliados)
  vehicle: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
    plate: z.string().optional(),
  }).optional(),
  
  // Informações adicionais
  additionalInfo: z.string().optional(),
  
  // Idioma da solicitação
  locale: z.string().default('pt'),
});

// Schema completo da solicitação
export const RequestSchema = CreateRequestSchema.extend({
  id: z.string().optional(),
  uid: z.string().optional(),
  status: RequestStatusSchema.default('pending'),
  
  // Dados administrativos
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.number().optional(),
  
  // Timestamps
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

// Schema para atualização de solicitação (admin)
export const UpdateRequestSchema = z.object({
  status: RequestStatusSchema.optional(),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.number().optional(),
});

// Schema para aprovação
export const ApproveRequestSchema = z.object({
  adminNotes: z.string().optional(),
});

// Schema para rejeição
export const RejectRequestSchema = z.object({
  rejectionReason: z.string().min(1, 'Motivo da rejeição é obrigatório'),
  adminNotes: z.string().optional(),
});

// Tipos TypeScript
export type DriverType = z.infer<typeof DriverTypeSchema>;
export type RequestStatus = z.infer<typeof RequestStatusSchema>;
export type CreateRequest = z.infer<typeof CreateRequestSchema>;
export type Request = z.infer<typeof RequestSchema>;
export type UpdateRequest = z.infer<typeof UpdateRequestSchema>;
export type ApproveRequest = z.infer<typeof ApproveRequestSchema>;
export type RejectRequest = z.infer<typeof RejectRequestSchema>;
