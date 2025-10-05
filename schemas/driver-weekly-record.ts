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
  
  // Totais
  grossTotal: z.number().default(0),
  
  // Despesas
  fuel: z.number().default(0),
  otherCosts: z.number().default(0),
  
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
  const grossTotal = 
    (data.uberTrips || 0) + 
    (data.uberTips || 0) + 
    (data.uberTolls || 0) + 
    (data.boltTrips || 0) + 
    (data.boltTips || 0);
  
  const commissionBase = (data.uberTrips || 0) + (data.boltTrips || 0);
  const commissionAmount = commissionBase * (data.commissionRate || 0.07);
  
  const netPayout = 
    grossTotal - 
    commissionAmount - 
    (data.fuel || 0) - 
    (data.otherCosts || 0);
  
  return {
    ...data,
    grossTotal,
    commissionBase,
    commissionAmount,
    netPayout,
  } as DriverWeeklyRecord;
}
