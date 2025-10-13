import { z } from 'zod';

export const DriverWeeklyRecordSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  driverEmail: z.string().optional(),
  weekId: z.string(), // 2024-W40
  weekStart: z.string(), // YYYY-MM-DD
  weekEnd: z.string(),   // YYYY-MM-DD
  
  isLocatario: z.boolean().default(false),

  // Receitas por plataforma
  uberTotal: z.number().default(0),
  boltTotal: z.number().default(0),
  prio: z.number().default(0),  // MyPrio (combustível)
  
  // Despesas
  combustivel: z.number().default(0),  // myprio
  viaverde: z.number().default(0),     // ViaVerde (portagens)
  aluguel: z.number().default(0),      // Aluguel semanal (se locatário)
  
  // Financiamento (empréstimos e descontos)
  financingDetails: z.object({
    interestPercent: z.number().default(0),    // % de juros sobre a parcela
    installment: z.number().default(0),        // Parcela semanal (empréstimo) ou desconto fixo
    interestAmount: z.number().default(0),     // Valor dos juros (installment × interestPercent / 100)
    totalCost: z.number().default(0),          // Custo total (installment + interestAmount)
    hasFinancing: z.boolean().default(false),  // Indica se há financiamento ativo
  }).optional(),

  
  // Cálculos automáticos
  ganhosTotal: z.number().default(0),        // uberTotal + boltTotal
  ivaValor: z.number().default(0),           // ganhosTotal × 0.06
  ganhosMenosIVA: z.number().default(0),     // ganhosTotal × 0.94
  despesasAdm: z.number().default(0),        // ganhosMenosIVA × 0.07
  totalDespesas: z.number().default(0),      // combustivel + viaverde + aluguel
  repasse: z.number().default(0),            // ganhosMenosIVA - despesasAdm - totalDespesas
  
  // Pagamento
  iban: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  paymentDate: z.string().optional(),
  paymentInfo: z.object({
    proofUrl: z.string().optional(),
    proofFileName: z.string().optional(),
  }).optional(),
  
  // Origem dos dados
  dataSource: z.enum(['manual', 'auto']).default('manual'),
  
  // Metadados
  createdAt: z.string(),
  updatedAt: z.string(),
  notes: z.string().optional(),
});

export type DriverWeeklyRecord = z.infer<typeof DriverWeeklyRecordSchema>;

/**
 * Calcula todos os valores derivados de um registro semanal
 * Aplica as fórmulas corretas:
 * - IVA 6% sobre ganhos totais
 * - Despesas administrativas 7% sobre (ganhos - IVA)
 * - Portagens só descontadas de locatários
 */
export function createDriverWeeklyRecord(
  data: Partial<DriverWeeklyRecord>,
  platformData: { uber?: number; bolt?: number; myprio?: number; viaverde?: number; cartrack?: number } = {},
  driver?: { type: 'affiliate' | 'renter'; rentalFee?: number }): DriverWeeklyRecord {
  // 1. Ganhos Total
  const ganhosTotal = (platformData.uber || 0) + (platformData.bolt || 0) + (platformData.myprio || 0) + (platformData.viaverde || 0) + (platformData.cartrack || 0);
  
  // 2. IVA 6%
  const ivaValor = ganhosTotal * 0.06;
  const ganhosMenosIVA = ganhosTotal * 0.94;
  
  // 3. Despesas Administrativas 7%
  const despesasAdm = ganhosMenosIVA * 0.07;
  
  // 4. Aluguel (só para locatários)
  let aluguel = data.aluguel || 0;
  if (driver?.type === 'renter' && driver.rentalFee) {
    aluguel = driver.rentalFee;
  }
    
  // 5. ViaVerde (só desconta de locatários)
  let viaverdeDesconto = 0;
  if (driver?.type === 'renter') {
    viaverdeDesconto = data.viaverde || 0;
  }
    
  // 6. Total Despesas
  const totalDespesas = (data.combustivel || 0) + viaverdeDesconto + aluguel;
  
  // 7. Repasse
  const repasse = ganhosMenosIVA - despesasAdm - totalDespesas;
  
  const now = new Date().toISOString();
  
  return {
    id: data.id || '',
    driverId: data.driverId || '',
    driverName: data.driverName || '',
    driverEmail: data.driverEmail || '',
    weekId: data.weekId || '',
    weekStart: data.weekStart || '',
    weekEnd: data.weekEnd || '',
    
    isLocatario: data.isLocatario || false,
    
    uberTotal: data.uberTotal || 0,
    boltTotal: data.boltTotal || 0,
    prio: data.prio || 0,
    
    combustivel: data.combustivel || 0,
    viaverde: data.viaverde || 0,
    aluguel,

    financingDetails: data.financingDetails,
    
    ganhosTotal,
    ivaValor,
    ganhosMenosIVA,
    despesasAdm,
    totalDespesas,
    repasse,
    
    iban: data.iban || '',
    paymentStatus: data.paymentStatus || 'pending',
    paymentDate: data.paymentDate || '',
    paymentInfo: data.paymentInfo,
    
    dataSource: data.dataSource || 'manual',
    
    createdAt: data.createdAt || now,
    updatedAt: now,
    notes: data.notes || '',
  };
}