/**
 * SERVIÇO CENTRALIZADO DE DADOS DE PAGAMENTO
 * 
 * Consolida a lógica de busca de pagamentos de MÚLTIPLAS FONTES:
 * - Admin Weekly Payments (UI)
 * - Admin Dashboard (Relatórios)
 * - Driver Dashboard (Contracheques)
 * - API endpoints
 * 
 * VANTAGENS:
 * - Single source of truth
 * - Sem duplicação de código
 * - Fácil manutenção quando estrutura muda
 */

import { adminDb } from '@/lib/firebaseAdmin';
import type { DriverPayment } from '@/schemas/driver-payment';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

// ============================================================================
// TIPOS
// ============================================================================

export interface PaymentData {
  // Dados do pagamento
  id: string;
  recordId: string;
  driverId: string;
  driverName: string;
  driverEmail?: string;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  
  // Valores monetários
  baseAmount: number;
  adminFeeValue: number;
  adminFeePercentage: number;
  bonusAmount: number;
  discountAmount: number;
  totalAmount: number; // repasse final (baseAmount - taxa - despesas + bonus - desconto)
  
  // ✅ ADICIONADO: Plataformas de ganho
  uberTotal?: number;
  boltTotal?: number;
  
  // ✅ ADICIONADO: Despesas
  combustivel?: number;
  portagens?: number;
  aluguel?: number;
  
  // ✅ ADICIONADO: Totalizadores
  ganhosTotal?: number;
  ivaValor?: number;
  ganhosMenosIVA?: number;
  
  // ✅ ADICIONADO: Bônus
  bonusMetaAmount?: number;
  bonusReferralAmount?: number;
  commissionAmount?: number;
  
  // Status
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  paymentDate?: string;
  iban?: string;
  
  // Comprovante
  proofUrl?: string;
  proofStoragePath?: string;
  
  // Metadados
  createdAt: string;
  updatedAt: string;
  createdBy?: any;
  notes?: string;
  
  // Dados adicionais (para compatibilidade com UI)
  currency?: string;
  dataSource?: string;
}

// ============================================================================
// BUSCAR UM PAGAMENTO
// ============================================================================

/**
 * Busca um pagamento pelo driverId + weekId
 * Se não encontrar pagamento pago, retorna null
 */
export async function getPaymentForDriverWeek(
  driverId: string,
  weekId: string
): Promise<PaymentData | null> {
  try {
    // Buscar em driverPayments (nova estrutura)
    const paymentSnapshot = await adminDb
      .collection('driverPayments')
      .where('driverId', '==', driverId)
      .where('weekId', '==', weekId)
      .limit(1)
      .get();

    if (!paymentSnapshot.empty) {
      const doc = paymentSnapshot.docs[0];
      return transformPaymentDoc(doc.data() as DriverPayment, doc.id);
    }

    return null;
  } catch (error) {
    console.error('[getPaymentForDriverWeek] Erro ao buscar pagamento:', error);
    return null;
  }
}

/**
 * Busca pagamentos de um motorista (últimos N)
 */
export async function getDriverPayments(
  driverId: string,
  limit: number = 12
): Promise<PaymentData[]> {
  try {
    const snapshot = await adminDb
      .collection('driverPayments')
      .where('driverId', '==', driverId)
      .orderBy('weekStart', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) =>
      transformPaymentDoc(doc.data() as DriverPayment, doc.id)
    );
  } catch (error) {
    console.error('[getDriverPayments] Erro ao buscar pagamentos do motorista:', error);
    return [];
  }
}

/**
 * Busca pagamentos de uma semana (todos os motoristas)
 */
export async function getWeekPayments(weekId: string): Promise<PaymentData[]> {
  try {
    const snapshot = await adminDb
      .collection('driverPayments')
      .where('weekId', '==', weekId)
      .orderBy('driverName', 'asc')
      .get();

    return snapshot.docs.map((doc) =>
      transformPaymentDoc(doc.data() as DriverPayment, doc.id)
    );
  } catch (error) {
    console.error('[getWeekPayments] Erro ao buscar pagamentos da semana:', error);
    return [];
  }
}

/**
 * Busca pagamentos de uma semana com status = 'paid'
 * Útil para: relatórios, resumos, exportação
 */
export async function getWeekPaidPayments(weekId: string): Promise<PaymentData[]> {
  try {
    const snapshot = await adminDb
      .collection('driverPayments')
      .where('weekId', '==', weekId)
      .where('paymentStatus', '==', 'paid')
      .orderBy('driverName', 'asc')
      .get();

    return snapshot.docs.map((doc) =>
      transformPaymentDoc(doc.data() as DriverPayment, doc.id)
    );
  } catch (error) {
    console.error('[getWeekPaidPayments] Erro ao buscar pagamentos pagos da semana:', error);
    return [];
  }
}

/**
 * Busca pagamentos de múltiplas semanas (para dashboard)
 */
export async function getMultiWeekPayments(
  weekIds: string[],
  driverId?: string
): Promise<PaymentData[]> {
  if (weekIds.length === 0) return [];

  try {
    let query = adminDb.collection('driverPayments') as any;

    // Filtro por motorista se fornecido
    if (driverId) {
      query = query.where('driverId', '==', driverId);
    }

    // Firestore não suporta IN para múltiplos valores diretamente em índices
    // Então buscamos para cada semana em paralelo
    const results = await Promise.all(
      weekIds.map((weekId) => {
        let query = adminDb
          .collection('driverPayments')
          .where('weekId', '==', weekId);
        
        if (driverId) {
          query = query.where('driverId', '==', driverId);
        }
        
        return query.get();
      })
    );

    const payments: PaymentData[] = [];
    results.forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        payments.push(transformPaymentDoc(doc.data() as DriverPayment, doc.id));
      });
    });

    return payments;
  } catch (error) {
    console.error('[getMultiWeekPayments] Erro ao buscar pagamentos de múltiplas semanas:', error);
    return [];
  }
}

/**
 * Busca pagamentos pagos entre duas datas (para relatórios)
 */
export async function getPaidPaymentsBetweenDates(
  startDate: string,
  endDate: string
): Promise<PaymentData[]> {
  try {
    const snapshot = await adminDb
      .collection('driverPayments')
      .where('paymentStatus', '==', 'paid')
      .where('paymentDate', '>=', startDate)
      .where('paymentDate', '<=', endDate)
      .orderBy('paymentDate', 'desc')
      .get();

    return snapshot.docs.map((doc) =>
      transformPaymentDoc(doc.data() as DriverPayment, doc.id)
    );
  } catch (error) {
    console.error('[getPaidPaymentsBetweenDates] Erro ao buscar pagamentos por data:', error);
    return [];
  }
}

/**
 * Conta pagamentos pagos por semana
 * Útil para: verificar se todos foram pagos
 */
export async function getPaymentCountByStatus(
  weekId: string
): Promise<{ total: number; paid: number; pending: number; cancelled: number }> {
  try {
    const snapshot = await adminDb
      .collection('driverPayments')
      .where('weekId', '==', weekId)
      .get();

    const counts = {
      total: snapshot.docs.length,
      paid: 0,
      pending: 0,
      cancelled: 0,
    };

    snapshot.docs.forEach((doc) => {
      const status = (doc.data() as DriverPayment).recordSnapshot?.paymentStatus || 'pending';
      if (status === 'paid') counts.paid++;
      else if (status === 'pending') counts.pending++;
      else if (status === 'cancelled') counts.cancelled++;
    });

    return counts;
  } catch (error) {
    console.error('[getPaymentCountByStatus] Erro ao contar pagamentos:', error);
    return { total: 0, paid: 0, pending: 0, cancelled: 0 };
  }
}

/**
 * Busca total de pagamentos pagos em uma semana (para validação financeira)
 */
export async function getTotalPaidAmountForWeek(weekId: string): Promise<number> {
  try {
    const payments = await getWeekPaidPayments(weekId);
    return payments.reduce((sum, p) => sum + p.totalAmount, 0);
  } catch (error) {
    console.error('[getTotalPaidAmountForWeek] Erro ao calcular total:', error);
    return 0;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Transforma documento do Firestore em formato PaymentData
 */
function transformPaymentDoc(doc: DriverPayment, docId: string): PaymentData {
  return {
    id: docId,
    recordId: doc.recordId || docId,
    driverId: doc.driverId,
    driverName: doc.driverName,
    driverEmail: doc.recordSnapshot?.driverEmail || '',
    weekId: doc.weekId,
    weekStart: doc.weekStart,
    weekEnd: doc.weekEnd,
    
    baseAmount: doc.baseAmount || 0,
    adminFeeValue: doc.adminFeeValue || 0,
    adminFeePercentage: doc.adminFeePercentage || 7,
    bonusAmount: doc.bonusAmount || 0,
    discountAmount: doc.discountAmount || 0,
    totalAmount: doc.totalAmount || 0,
    
    // ✅ ADICIONADO: Plataformas e despesas
    uberTotal: doc.uberTotal || 0,
    boltTotal: doc.boltTotal || 0,
    combustivel: doc.combustivel || 0,
    portagens: doc.portagens || 0,
    aluguel: doc.aluguel || 0,
    
    // ✅ ADICIONADO: Totalizadores
    ganhosTotal: doc.ganhosTotal || 0,
    ivaValor: doc.ivaValor || 0,
    ganhosMenosIVA: doc.ganhosMenosIVA || 0,
    
    // ✅ ADICIONADO: Bônus
    bonusMetaAmount: doc.bonusMetaAmount || 0,
    bonusReferralAmount: doc.bonusReferralAmount || 0,
    commissionAmount: doc.commissionAmount || 0,
    
    paymentStatus: doc.recordSnapshot?.paymentStatus || 'pending',
    paymentDate: doc.paymentDate,
    iban: doc.iban,
    
    proofUrl: doc.proofUrl,
    proofStoragePath: doc.proofStoragePath,
    
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    createdBy: doc.createdBy,
    notes: doc.notes,
    
    currency: doc.currency || 'EUR',
    dataSource: doc.recordSnapshot?.dataSource || 'auto',
  };
}

// ============================================================================
// CACHE (opcional, para performance)
// ============================================================================

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const paymentCache = new Map<string, { data: PaymentData[]; timestamp: number }>();

export function clearPaymentCache(): void {
  paymentCache.clear();
}

function getCacheKey(type: string, params: Record<string, any>): string {
  return `${type}:${JSON.stringify(params)}`;
}

function getFromCache(key: string): PaymentData[] | null {
  const cached = paymentCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  paymentCache.delete(key);
  return null;
}

function setInCache(key: string, data: PaymentData[]): void {
  paymentCache.set(key, { data, timestamp: Date.now() });
}
