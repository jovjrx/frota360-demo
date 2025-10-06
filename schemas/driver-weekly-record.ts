import { z } from 'zod';

export const DriverWeeklyRecordSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  weekStart: z.string(), // YYYY-MM-DD
  weekEnd: z.string(),   // YYYY-MM-DD
  
  // Uber
  uberTrips: z.number().default(0),
  uberTips: z.number().default(0),
  uberTolls: z.number().default(0),
  
  // Bolt
  boltTrips: z.number().default(0),
  boltTips: z.number().default(0),
  boltTolls: z.number().default(0),
  
  // Totais
  grossTotal: z.number().default(0),
  
  // Despesas
  fuel: z.number().default(0),
  viaverde: z.number().default(0),
  otherCosts: z.number().default(0),
  totalExpenses: z.number().default(0),
  
  // Comissão
  commissionBase: z.number().default(0),
  commissionRate: z.number().default(0.07),
  commissionAmount: z.number().default(0),
  
  // Líquido
  netPayout: z.number().default(0),
  
  // Pagamento
  iban: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  paymentDate: z.string().optional(),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  notes: z.string().optional(),
});

export type DriverWeeklyRecord = z.infer<typeof DriverWeeklyRecordSchema>;

export function calculateDriverWeeklyRecord(data: Partial<DriverWeeklyRecord>): DriverWeeklyRecord {
  // Total Bruto = Uber + Bolt (viagens + gorjetas + portagens)
  const grossTotal = 
    (data.uberTrips || 0) + 
    (data.uberTips || 0) + 
    (data.uberTolls || 0) + 
    (data.boltTrips || 0) + 
    (data.boltTips || 0) +
    (data.boltTolls || 0);
  
  // Base de comissão: ganhos de viagens EXCLUINDO portagens (que são reembolsadas)
  const commissionBase = 
    ((data.uberTrips || 0) + (data.boltTrips || 0)) - 
    ((data.uberTolls || 0) + (data.boltTolls || 0));
  
  const commissionAmount = commissionBase * (data.commissionRate || 0.07);
  
  // Total de Despesas
  const totalExpenses = 
    (data.fuel || 0) + 
    (data.viaverde || 0) + 
    (data.otherCosts || 0);
  
  // Valor Líquido = Total Bruto - Comissão - Despesas
  const netPayout = 
    grossTotal - 
    commissionAmount - 
    totalExpenses;
  
  return {
    ...data,
    grossTotal,
    commissionBase,
    commissionAmount,
    totalExpenses,
    netPayout,
    boltTolls: data.boltTolls || 0,
    viaverde: data.viaverde || 0,
  } as DriverWeeklyRecord;
}

/**
 * Converte ProcessedWeeklyRecord para DriverWeeklyRecord
 * Para compatibilidade entre schemas
 */
export function convertToDriverWeeklyRecord(processed: any): DriverWeeklyRecord {
  return {
    id: processed.id,
    driverId: processed.driverId,
    driverName: processed.driverName,
    weekStart: processed.weekStart,
    weekEnd: processed.weekEnd,
    
    uberTrips: processed.uber?.earnings || 0,
    uberTips: processed.uber?.tips || 0,
    uberTolls: processed.uber?.tolls || 0,
    
    boltTrips: processed.bolt?.earnings || 0,
    boltTips: processed.bolt?.tips || 0,
    boltTolls: processed.bolt?.tolls || 0,
    
    grossTotal: processed.calculations?.grossTotal || 0,
    
    fuel: processed.fuel?.amount || 0,
    viaverde: processed.viaverde?.amount || 0,
    otherCosts: 0,
    totalExpenses: (processed.fuel?.amount || 0) + (processed.viaverde?.amount || 0),
    
    commissionBase: processed.calculations?.commissionBase || 0,
    commissionRate: processed.calculations?.commissionRate || 0.07,
    commissionAmount: processed.calculations?.commissionAmount || 0,
    
    netPayout: processed.calculations?.netPayout || 0,
    
    iban: processed.payment?.iban || '',
    paymentStatus: processed.payment?.status || 'pending',
    paymentDate: processed.payment?.paidAt,
    
    createdAt: processed.createdAt,
    updatedAt: processed.updatedAt,
    notes: processed.notes,
  };
}
