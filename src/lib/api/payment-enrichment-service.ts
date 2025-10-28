/**
 * FUNÇÃO ESPECIALIZADA PARA ENRIQUECER DADOS COM INFORMAÇÕES DE PAGAMENTO
 * 
 * Quando um pagamento é marcado como 'paid' em driverPayments:
 * - Retorna os valores FINAIS do pagamento (não recalcula)
 * - Inclui comprovante, data, IBAN
 * - Marca como "congelado"
 * 
 * Quando ainda está 'pending':
 * - Calcula em tempo real do dataWeekly
 * - Mostra taxa administrativa corrente
 */

import { adminDb } from '@/lib/firebaseAdmin';
import type { DriverPayment } from '@/schemas/driver-payment';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

export interface EnrichedDriverRecord extends DriverWeeklyRecord {
  // Flags
  paymentFrozen: boolean; // Se está 'paid', congelado
  paymentFinal: boolean;  // Se tem dados finais de pagamento
  lastPaidAmount?: number; // Último valor pago
  lastPaidDate?: string;
  lastProofUrl?: string;
}

/**
 * Enriquece um registro com dados de pagamento quando está PAID
 * Se não está paid, retorna o record original
 */
export async function enrichRecordWithPaymentData(
  record: DriverWeeklyRecord
): Promise<EnrichedDriverRecord> {
  const enriched: EnrichedDriverRecord = {
    ...record,
    paymentFrozen: false,
    paymentFinal: false,
  };

  // Se não está paid, retorna logo
  if (record.paymentStatus !== 'paid') {
    return enriched;
  }

  try {
    // Buscar dados finais do pagamento
    let payment: DriverPayment | null = null;

    // Estratégia 1: Buscar pelo paymentInfo.paymentId
    if (record.paymentInfo?.paymentId) {
      const doc = await adminDb
        .collection('driverPayments')
        .doc(record.paymentInfo.paymentId)
        .get();

      if (doc.exists) {
        payment = doc.data() as DriverPayment;
      }
    }

    // Estratégia 2: Buscar pelo recordId
    if (!payment) {
      const snap = await adminDb
        .collection('driverPayments')
        .where('recordId', '==', record.id)
        .limit(1)
        .get();

      if (!snap.empty) {
        payment = snap.docs[0].data() as DriverPayment;
      }
    }

    // Se encontrou, enriquecer
    if (payment) {
      enriched.paymentFrozen = true;
      enriched.paymentFinal = true;
      enriched.lastPaidAmount = payment.totalAmount;
      enriched.lastPaidDate = payment.paymentDate;
      enriched.lastProofUrl = payment.proofUrl;

      // ✅ CORREÇÃO: Copiar campos do payment (recordSnapshot é minimalista agora)
      const paymentData = payment as any;
      
      // Esses campos estão no top-level do payment
      if (paymentData.type !== undefined) enriched.type = paymentData.type;
      if (paymentData.financingDetails !== undefined) enriched.financingDetails = paymentData.financingDetails;
      if (paymentData.commissionAmount !== undefined) enriched.commissionAmount = paymentData.commissionAmount;
      if (paymentData.totalBonusAmount !== undefined) enriched.totalBonusAmount = paymentData.totalBonusAmount;
      if (paymentData.ganhosTotal !== undefined) enriched.ganhosTotal = paymentData.ganhosTotal;
      if (paymentData.despesasAdm !== undefined) enriched.despesasAdm = paymentData.despesasAdm;
      if (paymentData.aluguel !== undefined) enriched.aluguel = paymentData.aluguel;
      if (paymentData.combustivel !== undefined) enriched.combustivel = paymentData.combustivel;
      if (paymentData.viaverde !== undefined) enriched.viaverde = paymentData.viaverde;
      if (paymentData.ivaValor !== undefined) enriched.ivaValor = paymentData.ivaValor;
      if (paymentData.ganhosMenosIVA !== undefined) enriched.ganhosMenosIVA = paymentData.ganhosMenosIVA;
      
      // Fallback para snapshot (se existir em dados antigos)
      const snapshotData = paymentData.recordSnapshot || {};
      if (!enriched.aluguel && snapshotData.aluguel !== undefined) enriched.aluguel = snapshotData.aluguel;
      if (!enriched.combustivel && snapshotData.combustivel !== undefined) enriched.combustivel = snapshotData.combustivel;
      if (!enriched.viaverde && snapshotData.viaverde !== undefined) enriched.viaverde = snapshotData.viaverde;
      // ✅ NOVO: Fallback para financiamento e ganhos quando só existem no snapshot
      if (!enriched.financingDetails && snapshotData.financingDetails !== undefined) {
        enriched.financingDetails = snapshotData.financingDetails;
      }
      if ((enriched.ganhosTotal === undefined || enriched.ganhosTotal === 0) && snapshotData.ganhosTotal !== undefined) {
        enriched.ganhosTotal = snapshotData.ganhosTotal;
      }
      if ((enriched.ivaValor === undefined || enriched.ivaValor === 0) && snapshotData.ivaValor !== undefined) {
        enriched.ivaValor = snapshotData.ivaValor;
      }
      if ((enriched.ganhosMenosIVA === undefined || enriched.ganhosMenosIVA === 0)) {
        const gt = enriched.ganhosTotal ?? snapshotData.ganhosTotal;
        const iv = enriched.ivaValor ?? snapshotData.ivaValor;
        if (typeof gt === 'number' && typeof iv === 'number') {
          enriched.ganhosMenosIVA = gt - iv;
        }
      }
      if ((enriched.despesasAdm === undefined || enriched.despesasAdm === 0) && snapshotData.despesasAdm !== undefined) {
        enriched.despesasAdm = snapshotData.despesasAdm;
      }
      
      // Sobrescrever alguns campos com valores FINAIS do pagamento
      enriched.repasse = payment.totalAmount;
      enriched.paymentInfo = {
        paymentId: payment.id,
        paymentDate: payment.paymentDate,
        totalAmount: payment.totalAmount,
        adminFeeValue: payment.adminFeeValue,
        adminFeePercentage: payment.adminFeePercentage,
        bonusAmount: payment.bonusAmount,
        discountAmount: payment.discountAmount,
        iban: payment.iban,
        proofUrl: payment.proofUrl,
        proofStoragePath: payment.proofStoragePath,
      };
    }
  } catch (error) {
    console.error('[enrichRecordWithPaymentData] Erro:', error);
    // Não falha, retorna record como está
  }

  return enriched;
}

/**
 * Enriquece múltiplos records (batch)
 */
export async function enrichRecordsWithPaymentData(
  records: DriverWeeklyRecord[]
): Promise<EnrichedDriverRecord[]> {
  return Promise.all(
    records.map((record) => enrichRecordWithPaymentData(record))
  );
}

/**
 * Valida integridade de um pagamento paid
 * Retorna { isValid, errors }
 */
export async function validatePaidPaymentIntegrity(
  record: DriverWeeklyRecord
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (record.paymentStatus !== 'paid') {
    return { isValid: true, errors: [] };
  }

  try {
    // Deve ter pelo menos paymentInfo ou paymentId
    if (!record.paymentInfo?.paymentId) {
      errors.push('Pagamento marcado como paid mas sem paymentInfo.paymentId');
      return { isValid: false, errors };
    }

    // Verificar se existe em driverPayments
    const paymentDoc = await adminDb
      .collection('driverPayments')
      .doc(record.paymentInfo.paymentId)
      .get();

    if (!paymentDoc.exists) {
      errors.push(`Documento de pagamento ${record.paymentInfo.paymentId} não encontrado em driverPayments`);
      return { isValid: false, errors };
    }

    const payment = paymentDoc.data() as DriverPayment;

    // Validar que o recordId corresponde
    if (payment.recordId !== record.id) {
      errors.push(
        `Mismatch: payment.recordId=${payment.recordId} mas record.id=${record.id}`
      );
    }

    // Validar que driverId corresponde
    if (payment.driverId !== record.driverId) {
      errors.push(
        `Mismatch: payment.driverId=${payment.driverId} mas record.driverId=${record.driverId}`
      );
    }

    // Validar que weekId corresponde
    if (payment.weekId !== record.weekId) {
      errors.push(
        `Mismatch: payment.weekId=${payment.weekId} mas record.weekId=${record.weekId}`
      );
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    errors.push(`Erro ao validar: ${message}`);
    return { isValid: false, errors };
  }
}

/**
 * Sincroniza driverWeeklyRecords.paymentStatus com driverPayments
 * Se existe pagamento em driverPayments, marca record como 'paid'
 */
export async function syncPaymentStatusFromDriverPayments(
  driverId: string,
  weekId: string
): Promise<void> {
  const recordId = `${driverId}_${weekId}`;

  try {
    // Verificar se existe pagamento
    const paymentSnap = await adminDb
      .collection('driverPayments')
      .where('driverId', '==', driverId)
      .where('weekId', '==', weekId)
      .limit(1)
      .get();

    if (paymentSnap.empty) {
      return; // Sem pagamento, não fazer nada
    }

    const payment = paymentSnap.docs[0];
    const paymentData = payment.data() as DriverPayment;

    // Atualizar record com status 'paid'
    const recordRef = adminDb
      .collection('driverWeeklyRecords')
      .doc(recordId);

    await recordRef.update({
      paymentStatus: 'paid',
      paymentDate: paymentData.paymentDate || new Date().toISOString(),
      paymentInfo: {
        paymentId: payment.id,
        paymentDate: paymentData.paymentDate,
        totalAmount: paymentData.totalAmount,
      },
      updatedAt: new Date().toISOString(),
    });

    console.log(
      `[syncPaymentStatusFromDriverPayments] Sincronizado ${recordId}: agora está paid`
    );
  } catch (error) {
    console.error('[syncPaymentStatusFromDriverPayments] Erro:', error);
    throw error;
  }
}

/**
 * Lista todos os records que estão marcados como 'paid' mas sem paymentId válido
 * Útil para detectar inconsistências
 */
export async function findOrphanPaidRecords(
  weekId: string
): Promise<string[]> {
  const orphans: string[] = [];

  try {
    const snap = await adminDb
      .collection('driverWeeklyRecords')
      .where('weekId', '==', weekId)
      .where('paymentStatus', '==', 'paid')
      .get();

    for (const doc of snap.docs) {
      const record = doc.data() as DriverWeeklyRecord;
      if (!record.paymentInfo?.paymentId) {
        orphans.push(doc.id);
      }
    }
  } catch (error) {
    console.error('[findOrphanPaidRecords] Erro:', error);
  }

  return orphans;
}
