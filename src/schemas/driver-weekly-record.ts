import { z } from 'zod';

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const pickNumber = (...values: Array<unknown>): number | undefined => {
  for (const value of values) {
    if (isFiniteNumber(value)) {
      return value;
    }
  }
  return undefined;
};

export const DriverWeeklyRecordSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  driverEmail: z.string().optional(),
  // ✅ ADICIONADO: type do driver (affiliate ou renter)
  type: z.enum(['affiliate', 'renter']).optional(),
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
    type: z.enum(['discount', 'loan']).default('discount'),  // Tipo de financiamento
    amount: z.number().default(0),           // Valor total do financiamento
    weeklyAmount: z.number().default(0),    // Parcela semanal (empréstimo) ou desconto fixo
    weeklyInterest: z.number().default(0),  // Juros semanais
    displayAmount: z.number().default(0),   // Valor a exibir
    totalCost: z.number().default(0),       // Custo total (parcela + juros + ônus)
    hasFinancing: z.boolean().default(false), // Indica se há financiamento ativo
    isParcelado: z.boolean().default(false), // Se é parcelado ou vitalício
    displayLabel: z.string().optional(),     // Label para exibição (ex: "Parcela: R$ 52.50")
    totalParcelas: z.number().optional(),    // Total de parcelas
    parcelasAteAgora: z.number().optional(), // Parcelas pagas até agora
    parcelasRestantes: z.number().optional(), // Parcelas restantes
    percentualPago: z.number().optional(),   // % de parcelas pagas
    dataUltimaParcela: z.string().optional(), // Data da última parcela paga
    onusBancario: z.number().optional(),     // Ônus bancário total
    onusParcelado: z.number().optional(),    // Ônus por semana
    weeklyWithFees: z.number().optional(),   // Parcela + ônus + juros
    // Campos antigos (para compatibilidade)
    interestPercent: z.number().default(0),  // % de juros (LEGADO)
    installment: z.number().default(0),      // Parcela (LEGADO)
    interestAmount: z.number().default(0),   // Valor dos juros (LEGADO)
  }).optional(),

  
  // Cálculos automáticos
  ganhosTotal: z.number().default(0),        // uberTotal + boltTotal
  ivaValor: z.number().default(0),           // ganhosTotal × 0.06
  ganhosMenosIVA: z.number().default(0),     // ganhosTotal × 0.94
  despesasAdm: z.number().default(0),        // ganhosMenosIVA × 0.07
  // Comissão extra (nova), separada da Taxa Adm
  commissionPercent: z.number().default(0).optional(),
  commissionAmount: z.number().default(0).optional(),
  totalDespesas: z.number().default(0),      // combustivel + viaverde + aluguel
  repasse: z.number().default(0),            // ganhosMenosIVA - despesasAdm - totalDespesas

  // Bonuses - FASE 2 (Pending state - calculated during processing)
  bonusMetaPending: z.array(z.object({
    id: z.string(),
    amount: z.number(),
    criteria: z.enum(['ganho', 'viagens']),
    criteriaValue: z.number(),
    description: z.string(),
  })).default([]),

  referralBonusPending: z.array(z.object({
    id: z.string(),
    referredDriverId: z.string(),
    referredDriverName: z.string(),
    amount: z.number(),
    weeksCompleted: z.number(),
    minimumWeeksRequired: z.number(),
    description: z.string(),
  })).default([]),

  commissionPending: z.object({
    id: z.string(),
    amount: z.number(),
    rate: z.number(),
    subordinatesCount: z.number(),
    description: z.string(),
  }).optional(),

  totalBonusAmount: z.number().default(0),  // Sum of all pending bonuses

  // Bonuses - FASE 3 (Paid state - marked during payment)
  bonusMetaPaid: z.array(z.object({
    id: z.string(),
    amount: z.number(),
    criteria: z.enum(['ganho', 'viagens']),
    criteriaValue: z.number(),
    description: z.string(),
  })).default([]),

  referralBonusPaid: z.array(z.object({
    id: z.string(),
    referredDriverId: z.string(),
    referredDriverName: z.string(),
    amount: z.number(),
    weeksCompleted: z.number(),
    minimumWeeksRequired: z.number(),
    description: z.string(),
  })).default([]),

  commissionPaid: z.object({
    id: z.string(),
    amount: z.number(),
    rate: z.number(),
    subordinatesCount: z.number(),
    description: z.string(),
  }).optional(),
  
  // Pagamento
  iban: z.string().optional(),
  paymentStatus: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  paymentDate: z.string().optional(),
  paymentInfo: z.any().optional(),
  
  // Origem dos dados
  dataSource: z.enum(['manual', 'auto']).default('manual'),
  
  // Metas/Recompensas semanais (calculadas dinamicamente)
  goals: z.array(z.object({
    id: z.string(),
    descricao: z.string(),
    criterio: z.enum(['ganho', 'viagens']),
    tipo: z.enum(['valor', 'percentual']),
    valor: z.number(),
    nivel: z.number(),
    dataInicio: z.union([z.string(), z.number()]).optional(),
    atingido: z.boolean(),
    valorGanho: z.number(),
    valorBase: z.number(),
  })).optional(),
  
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
  const resolvedUberTotal = pickNumber(data.uberTotal, platformData.uber) ?? 0;
  const resolvedBoltTotal = pickNumber(data.boltTotal, platformData.bolt) ?? 0;
  const resolvedPrioValue = pickNumber(data.combustivel, data.prio, platformData.myprio) ?? 0;
  const resolvedViaverdeValue = pickNumber(data.viaverde, platformData.viaverde) ?? 0;
  const resolvedCartrackValue = pickNumber(platformData.cartrack) ?? 0;

  const ganhosTotal = resolvedUberTotal + resolvedBoltTotal + resolvedPrioValue + resolvedViaverdeValue + resolvedCartrackValue;
  const ivaValor = ganhosTotal * 0.06;
  const ganhosMenosIVA = ganhosTotal - ivaValor;
  const despesasAdm = ganhosMenosIVA * 0.07;
  // Comissão extra é opcional e, por padrão, 0. O cálculo detalhado deve ser feito em camada de serviço
  const commissionPercent = isFiniteNumber((data as any).commissionPercent) ? (data as any).commissionPercent as number : 0;
  const commissionAmount = isFiniteNumber((data as any).commissionAmount) ? (data as any).commissionAmount as number : 0;

  let resolvedAluguel = pickNumber(data.aluguel);
  if (resolvedAluguel === undefined && driver?.type === 'renter' && isFiniteNumber(driver.rentalFee)) {
    resolvedAluguel = driver.rentalFee;
  }
  resolvedAluguel = resolvedAluguel ?? 0;

  const viaverdeDesconto = resolvedViaverdeValue;
  const totalDespesas = resolvedPrioValue + viaverdeDesconto + resolvedAluguel;
  // Comissão é um ganho adicional do motorista
  const repasse = ganhosMenosIVA - despesasAdm - totalDespesas + commissionAmount;

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
    
  uberTotal: resolvedUberTotal,
  boltTotal: resolvedBoltTotal,
  prio: resolvedPrioValue,
    
  combustivel: resolvedPrioValue,
  viaverde: resolvedViaverdeValue,
  aluguel: resolvedAluguel,

    financingDetails: data.financingDetails,
    
    ganhosTotal,
    ivaValor,
    ganhosMenosIVA,
    despesasAdm,
  commissionPercent,
  commissionAmount,
    totalDespesas,
    repasse,

    // Bonuses - FASE 2 (Pending)
    bonusMetaPending: data.bonusMetaPending || [],
    referralBonusPending: data.referralBonusPending || [],
    commissionPending: data.commissionPending,
    totalBonusAmount: data.totalBonusAmount || 0,

    // Bonuses - FASE 3 (Paid)
    bonusMetaPaid: data.bonusMetaPaid || [],
    referralBonusPaid: data.referralBonusPaid || [],
    commissionPaid: data.commissionPaid,
    
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

