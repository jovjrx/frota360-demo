import { z } from 'zod';

export const FleetRecordSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  vehicleId: z.string(),
  vehiclePlate: z.string(),
  periodStart: z.string(), // YYYY-MM-DD
  periodEnd: z.string(),   // YYYY-MM-DD
  
  // Ganhos
  earningsUber: z.number().default(0),
  earningsBolt: z.number().default(0),
  earningsTotal: z.number().default(0),
  
  // Gorjetas
  tipsUber: z.number().default(0),
  tipsBolt: z.number().default(0),
  tipsTotal: z.number().default(0),
  
  // Portagens
  tollsUber: z.number().default(0),
  tollsAdjusted: z.number().default(0),
  
  // Despesas
  rental: z.number().default(0),
  fuel: z.number().default(0),
  otherExpenses: z.number().default(0),
  
  // Comissão
  commissionRate: z.number().default(0.07), // 7%
  commissionBase: z.number().default(0),    // Ganhos - Portagens
  commissionAmount: z.number().default(0),  // Base × Rate
  
  // Repasse
  netPayout: z.number().default(0),
  
  // Pagamento
  iban: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  paymentDate: z.string().optional(),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  notes: z.string().optional(),
});

export type FleetRecord = z.infer<typeof FleetRecordSchema>;

// Função para calcular valores
export function calculateFleetRecord(data: Partial<FleetRecord>): FleetRecord {
  const earningsTotal = (data.earningsUber || 0) + (data.earningsBolt || 0);
  const tipsTotal = (data.tipsUber || 0) + (data.tipsBolt || 0);
  const commissionBase = earningsTotal - (data.tollsAdjusted || 0);
  const commissionAmount = commissionBase * (data.commissionRate || 0.07);
  const netPayout = 
    earningsTotal + 
    tipsTotal - 
    commissionAmount - 
    (data.fuel || 0) - 
    (data.rental || 0) - 
    (data.otherExpenses || 0);
  
  return {
    ...data,
    earningsTotal,
    tipsTotal,
    commissionBase,
    commissionAmount,
    netPayout,
  } as FleetRecord;
}
