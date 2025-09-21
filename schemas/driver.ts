import { z } from 'zod';

// Schema para cadastro do motorista (apenas campos que ele pode preencher)
export const DriverSignupSchema = z.object({
  // Informações básicas obrigatórias
  firstName: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  
  // Informações pessoais opcionais
  birthDate: z.string().optional(),
  city: z.string().optional(),
  
  // Informações de condução opcionais
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  vehicleType: z.string().nullable().optional(),
});

// Schema para campos administrativos (gerenciados pelo admin)
export const DriverAdminFieldsSchema = z.object({
  // Status e ativação
  status: z.enum(['pending', 'active', 'inactive', 'suspended']).default('pending'),
  isActive: z.boolean().default(false),
  isApproved: z.boolean().default(false),
  approvedAt: z.any().nullable().optional(),
  approvedBy: z.string().nullable().optional(),
  statusUpdatedAt: z.any().nullable().optional(),
  statusUpdatedBy: z.string().nullable().optional(),
  
  // Métricas e ganhos
  weeklyEarnings: z.number().default(0),
  monthlyEarnings: z.number().default(0),
  totalTrips: z.number().default(0),
  rating: z.number().default(0),
  
  // Documentos e verificação
  documents: z.object({
    license: z.object({
      uploaded: z.boolean().default(false),
      verified: z.boolean().default(false),
      url: z.string().nullable().default(null),
    }),
    insurance: z.object({
      uploaded: z.boolean().default(false),
      verified: z.boolean().default(false),
      url: z.string().nullable().default(null),
    }),
    vehicle: z.object({
      uploaded: z.boolean().default(false),
      verified: z.boolean().default(false),
      url: z.string().nullable().default(null),
    }),
  }).optional(),
  
  // Informações do veículo (preenchidas pelo admin)
  vehicle: z.object({
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    plate: z.string().min(1),
  }).optional(),
  
  // Plano e comissão (definidos pelo admin)
  planId: z.string().optional(),
  commission: z.object({
    percent: z.number().min(0).max(100).optional(),
  }).optional(),
  
  // Notas administrativas
  notes: z.string().default(''),
  
  // Último pagamento (gerenciado pelo sistema)
  lastPayoutAt: z.any().nullable().optional(),
  lastPayoutAmount: z.number().default(0),
  
  // Campos de check-in
  lastCheckin: z.number().nullable().optional(),
  nextCheckin: z.number().nullable().optional(),
  checkinCount: z.number().default(0),
});

// Schema completo do driver (combinação dos dois)
export const DriverSchema = DriverSignupSchema.extend({
  // Campos técnicos
  id: z.string().optional(),
  uid: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  fullName: z.string().min(1),
  locale: z.string().default('pt'),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  createdBy: z.string().default('self'),
  lastLoginAt: z.any().nullable().optional(),
}).merge(DriverAdminFieldsSchema);

// Schema para criação de driver (combina signup + campos administrativos padrão)
export const CreateDriverSchema = DriverSignupSchema.extend({
  uid: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  fullName: z.string().min(1),
  locale: z.string().default('pt'),
  createdBy: z.string().default('self'),
}).merge(DriverAdminFieldsSchema);

// Schema para atualização de driver
export const UpdateDriverSchema = DriverSchema.partial().omit({
  id: true,
  uid: true,
  userId: true,
  createdAt: true,
});

// Schema para verificação de driver (admin)
export const VerifyDriverSchema = z.object({
  status: z.enum(['pending', 'active', 'inactive', 'suspended']),
  reason: z.string().optional(),
});

// Schema para atualização de campos administrativos
export const UpdateDriverAdminSchema = DriverAdminFieldsSchema.partial();

export type DriverSignup = z.infer<typeof DriverSignupSchema>;
export type DriverAdminFields = z.infer<typeof DriverAdminFieldsSchema>;
export type Driver = z.infer<typeof DriverSchema>;
export type CreateDriver = z.infer<typeof CreateDriverSchema>;
export type UpdateDriver = z.infer<typeof UpdateDriverSchema>;
export type VerifyDriver = z.infer<typeof VerifyDriverSchema>;
export type UpdateDriverAdmin = z.infer<typeof UpdateDriverAdminSchema>;
export type DriverStatus = z.infer<typeof VerifyDriverSchema>['status'];