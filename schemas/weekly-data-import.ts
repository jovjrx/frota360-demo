import { z } from 'zod';

/**
 * Schema para armazenar dados brutos das importações
 * Serve como auditoria e fonte única de verdade
 */
export const WeeklyDataImportSchema = z.object({
  id: z.string(),
  importId: z.string(), // Agrupa plataformas da mesma importação
  platform: z.enum(['uber', 'bolt', 'myprio', 'viaverde']),
  source: z.enum(['manual', 'api']),
  weekStart: z.string(), // YYYY-MM-DD
  weekEnd: z.string(),   // YYYY-MM-DD
  
  // Dados brutos (JSON original)
  rawData: z.any(),
  
  // Metadados
  importedAt: z.string(),
  importedBy: z.string(), // Admin ID
  fileName: z.string().optional(),
  
  // Status
  processed: z.boolean().default(false),
  processedAt: z.string().optional(),
  errors: z.array(z.string()).optional(),
});

export type WeeklyDataImport = z.infer<typeof WeeklyDataImportSchema>;

/**
 * Schema para motoristas na collection drivers
 */
export const DriverSchema = z.object({
  id: z.string(),
  
  // Identificação Básica
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  
  // Autenticação
  firebaseUid: z.string().optional(),
  
  // IDs das Plataformas
  integrations: z.object({
    uber: z.object({
      uuid: z.string().nullable().default(null),
      name: z.string().nullable().default(null),
      lastSync: z.string().nullable().default(null),
    }).optional(),
    bolt: z.object({
      id: z.string().nullable().default(null),
      email: z.string().nullable().default(null),
      lastSync: z.string().nullable().default(null),
    }).optional(),
  }).optional(),
  
  // Veículo
  vehicle: z.object({
    plate: z.string().nullable().default(null),
    model: z.string().nullable().default(null),
    assignedDate: z.string().nullable().default(null),
  }).optional(),
  
  // Cartões
  cards: z.object({
    myprio: z.string().nullable().default(null),
    viaverde: z.string().nullable().default(null),
  }).optional(),
  
  // Dados Bancários
  banking: z.object({
    iban: z.string().nullable().default(null),
    accountHolder: z.string().nullable().default(null),
  }).optional(),
  
  // Status e Tipo
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  type: z.enum(['affiliate', 'renter']).default('affiliate'),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.enum(['request', 'admin']).default('admin'),
  requestId: z.string().optional(),
  
  // Notas
  notes: z.string().optional(),
});

export type Driver = z.infer<typeof DriverSchema>;

/**
 * Schema para registros semanais processados
 */
export const ProcessedWeeklyRecordSchema = z.object({
  id: z.string(), // driverId_weekStart
  driverId: z.string(),
  driverName: z.string(),
  weekStart: z.string(), // YYYY-MM-DD
  weekEnd: z.string(),   // YYYY-MM-DD
  
  // Uber
  uber: z.object({
    earnings: z.number().default(0),
    tips: z.number().default(0),
    tolls: z.number().default(0),
    importId: z.string(),
  }).nullable().default(null),
  
  // Bolt
  bolt: z.object({
    earnings: z.number().default(0),
    tips: z.number().default(0),
    tolls: z.number().default(0),
    importId: z.string(),
  }).nullable().default(null),
  
  // myprio (Combustível)
  fuel: z.object({
    amount: z.number().default(0),
    transactions: z.number().default(0),
    importId: z.string(),
  }).nullable().default(null),
  
  // ViaVerde (Portagens)
  viaverde: z.object({
    amount: z.number().default(0),
    transactions: z.number().default(0),
    importId: z.string(),
  }).nullable().default(null),
  
  // Cálculos
  calculations: z.object({
    grossTotal: z.number().default(0),
    commissionBase: z.number().default(0),
    commissionRate: z.number().default(0.07),
    commissionAmount: z.number().default(0),
    netPayout: z.number().default(0),
  }),
  
  // Pagamento
  payment: z.object({
    iban: z.string().default(''),
    status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
    paidAt: z.string().optional(),
    reference: z.string().optional(),
  }),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  notes: z.string().optional(),
});

export type ProcessedWeeklyRecord = z.infer<typeof ProcessedWeeklyRecordSchema>;

/**
 * Função para calcular totais de um registro semanal
 */
export function calculateWeeklyTotals(record: ProcessedWeeklyRecord): ProcessedWeeklyRecord {
  const uberTotal = (record.uber?.earnings || 0) + (record.uber?.tips || 0) + (record.uber?.tolls || 0);
  const boltTotal = (record.bolt?.earnings || 0) + (record.bolt?.tips || 0) + (record.bolt?.tolls || 0);
  const fuelTotal = record.fuel?.amount || 0;
  const viaverdeTotal = record.viaverde?.amount || 0;
  
  const grossTotal = uberTotal + boltTotal;
  
  // Base de comissão: ganhos de viagens EXCLUINDO portagens
  const commissionBase = 
    (record.uber?.earnings || 0) + 
    (record.bolt?.earnings || 0) - 
    (record.uber?.tolls || 0) -
    (record.bolt?.tolls || 0);
  
  const commissionRate = 0.07;
  const commissionAmount = commissionBase * commissionRate;
  
  const netPayout = grossTotal - commissionAmount - fuelTotal - viaverdeTotal;
  
  record.calculations = {
    grossTotal,
    commissionBase,
    commissionRate,
    commissionAmount,
    netPayout,
  };
  
  return record;
}

/**
 * Função para criar um registro semanal vazio
 */
export function createEmptyWeeklyRecord(
  driverId: string,
  driverName: string,
  weekStart: string,
  weekEnd: string,
  iban: string = ''
): ProcessedWeeklyRecord {
  const now = new Date().toISOString();
  
  const record: ProcessedWeeklyRecord = {
    id: `${driverId}_${weekStart}`,
    driverId,
    driverName,
    weekStart,
    weekEnd,
    uber: null,
    bolt: null,
    fuel: null,
    viaverde: null,
    calculations: {
      grossTotal: 0,
      commissionBase: 0,
      commissionRate: 0.07,
      commissionAmount: 0,
      netPayout: 0,
    },
    payment: {
      iban,
      status: 'pending',
    },
    createdAt: now,
    updatedAt: now,
  };
  
  return calculateWeeklyTotals(record);
}
