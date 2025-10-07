import { z } from 'zod';

/**
 * Schema para dados brutos do Uber
 * Collection: raw_uber
 */
export const RawUberSchema = z.object({
  id: z.string(),
  importId: z.string(),
  weekStart: z.string(), // YYYY-MM-DD
  weekEnd: z.string(),   // YYYY-MM-DD
  
  // Identificação do motorista
  driverUuid: z.string(),
  driverFirstName: z.string(),
  driverLastName: z.string(),
  
  // Dados financeiros (valores originais)
  paidToYou: z.number(),
  yourEarnings: z.number(),
  tripBalance: z.number().optional(),
  cashCollected: z.number().optional(),
  fare: z.number().optional(),
  taxes: z.number().optional(),
  serviceFee: z.number().optional(),
  tip: z.number().optional(),
  tolls: z.number().optional(),
  
  // Metadados
  importedAt: z.string(),
  importedBy: z.string(),
  fileName: z.string(),
  source: z.enum(['manual', 'api']),
  
  // Dados brutos completos
  rawData: z.any(),
});

export type RawUber = z.infer<typeof RawUberSchema>;

/**
 * Schema para dados brutos do Bolt
 * Collection: raw_bolt
 */
export const RawBoltSchema = z.object({
  id: z.string(),
  importId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  
  // Identificação do motorista
  driverName: z.string(),
  driverEmail: z.string(),
  driverPhone: z.string().optional(),
  driverId: z.string().optional(),
  
  // Dados financeiros
  grossEarningsTotal: z.number(),
  grossEarningsApp: z.number().optional(),
  grossEarningsCash: z.number().optional(),
  cashCollected: z.number().optional(),
  tips: z.number().optional(),
  campaignEarnings: z.number().optional(),
  expenseReimbursements: z.number().optional(),
  cancellationFees: z.number().optional(),
  tolls: z.number().optional(),
  bookingFees: z.number().optional(),
  totalFees: z.number().optional(),
  commissions: z.number().optional(),
  passengerRefunds: z.number().optional(),
  otherFees: z.number().optional(),
  netEarnings: z.number().optional(),
  expectedPayment: z.number().optional(),
  grossEarningsPerHour: z.number().optional(),
  netEarningsPerHour: z.number().optional(),
  
  // Metadados
  importedAt: z.string(),
  importedBy: z.string(),
  fileName: z.string(),
  source: z.enum(['manual', 'api']),
  
  // Dados brutos completos
  rawData: z.any(),
});

export type RawBolt = z.infer<typeof RawBoltSchema>;

/**
 * Schema para dados brutos do Prio
 * Collection: raw_prio
 */
export const RawPrioSchema = z.object({
  id: z.string(),
  importId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  
  // Identificação
  cardNumber: z.string(),
  cardDescription: z.string().optional(),
  cardStatus: z.string().optional(),
  cardGroup: z.string().optional(),
  driverId: z.string().optional(),
  
  // Dados da transação
  transactionDate: z.string(), // YYYY-MM-DD
  transactionTime: z.string().optional(),
  station: z.string().optional(),
  country: z.string().optional(),
  network: z.string().optional(),
  fuelType: z.string().optional(),
  liters: z.number().optional(),
  unitPrice: z.number().optional(),
  netValue: z.number().optional(),
  vat: z.number().optional(),
  totalValue: z.number(),
  referenceValue: z.number().optional(),
  discountValue: z.number().optional(),
  receiptNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  kilometers: z.number().optional(),
  client: z.string().optional(),
  paymentType: z.string().optional(),
  
  // Metadados
  importedAt: z.string(),
  importedBy: z.string(),
  fileName: z.string(),
  source: z.enum(['manual', 'api']),
  
  // Dados brutos completos
  rawData: z.any(),
});

export type RawPrio = z.infer<typeof RawPrioSchema>;

/**
 * Schema para dados brutos do ViaVerde
 * Collection: raw_viaverde
 */
export const RawViaVerdeSchema = z.object({
  id: z.string(),
  importId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
  
  // Identificação do veículo
  licensePlate: z.string(),
  iai: z.string().optional(),
  obu: z.string().optional(),
  contractNumber: z.string().optional(),
  
  // Dados da transação
  entryDate: z.string(), // ISO timestamp
  exitDate: z.string().optional(),
  entryPoint: z.string().optional(),
  exitPoint: z.string().optional(),
  service: z.string().optional(),
  serviceDescription: z.string().optional(),
  market: z.string().optional(),
  marketDescription: z.string().optional(),
  
  // Valores
  value: z.number(),
  discountVV: z.number().optional(),
  discountVVPercentage: z.number().optional(),
  liquidValue: z.number(),
  discountBalance: z.number().optional(),
  mobilityAccount: z.string().optional(),
  
  // Pagamento
  isPayed: z.boolean().optional(),
  paymentDate: z.string().optional(),
  paymentMethod: z.string().optional(),
  systemEntryDate: z.string().optional(),
  
  // Metadados
  importedAt: z.string(),
  importedBy: z.string(),
  fileName: z.string(),
  source: z.enum(['manual', 'api']),
  
  // Dados brutos completos
  rawData: z.any(),
});

export type RawViaVerde = z.infer<typeof RawViaVerdeSchema>;
