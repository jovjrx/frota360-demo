import { z } from 'zod';

export const DriverWeeklyRecordSchema = z.object({
  id: z.string(),
  driverId: z.string(),
  driverName: z.string(),
  weekId: z.string(), // 2024-W40
  weekStart: z.string(), // YYYY-MM-DD
  weekEnd: z.string(),   // YYYY-MM-DD
  
  // Valores totais repassados pelas plataformas
  uberTotal: z.number().default(0),  // "Pago a si" do Uber
  boltTotal: z.number().default(0),  // "Ganhos brutos (total)" do Bolt
  
  // Despesas
  combustivel: z.number().default(0),  // myprio
  viaverde: z.number().default(0),     // ViaVerde (portagens)
  aluguel: z.number().default(0),      // Aluguel semanal (se locatário)
  
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
export function calculateDriverWeeklyRecord(
  data: Partial<DriverWeeklyRecord>,
  driver?: { type: 'affiliate' | 'renter'; rentalFee?: number }
): DriverWeeklyRecord {
  // 1. Ganhos Total
  const ganhosTotal = (data.uberTotal || 0) + (data.boltTotal || 0);
  
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
    weekId: data.weekId || '',
    weekStart: data.weekStart || '',
    weekEnd: data.weekEnd || '',
    
    uberTotal: data.uberTotal || 0,
    boltTotal: data.boltTotal || 0,
    
    combustivel: data.combustivel || 0,
    viaverde: data.viaverde || 0,
    aluguel,
    
    ganhosTotal,
    ivaValor,
    ganhosMenosIVA,
    despesasAdm,
    totalDespesas,
    repasse,
    
    iban: data.iban,
    paymentStatus: data.paymentStatus || 'pending',
    paymentDate: data.paymentDate || null,
    
    dataSource: data.dataSource || 'manual',
    
    createdAt: data.createdAt || now,
    updatedAt: now,
    notes: data.notes || null,
  };
}

/**
 * Gera ID único para registro semanal
 */
export function generateWeeklyRecordId(driverId: string, weekId: string): string {
  return `${driverId}_${weekId}`;
}

/**
 * Gera weekId a partir de uma data
 */
export function getWeekId(date: Date): string {
  const year = date.getFullYear();
  const onejan = new Date(year, 0, 1);
  const week = Math.ceil((((date.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Obtém datas de início e fim de uma semana
 */
export function getWeekDates(weekId: string): { start: string; end: string } {
  const [year, week] = weekId.split('-W').map(Number);
  
  // Primeiro dia do ano
  const jan1 = new Date(year, 0, 1);
  
  // Primeiro dia da semana (segunda-feira)
  const daysToMonday = (jan1.getDay() === 0 ? 6 : jan1.getDay() - 1);
  const firstMonday = new Date(year, 0, 1 + (7 - daysToMonday) % 7);
  
  // Calcular início da semana desejada
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  // Fim da semana (domingo)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
  };
}
