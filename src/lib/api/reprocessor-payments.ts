/**
 * Reprocessador de Pagamentos com Correção
 * 
 * Para as 3 últimas semanas processadas incorretamente:
 * - Juros/Ônus deve ser PERCENTUAL sobre o ganho, não valor absoluto
 * - Comprovante deve estar no retorno
 * - Taxa ADM fixa de 7% (como estava na época)
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { DriverPayment } from '@/types/driver-payment';

interface ReprocessWeekResult {
  weekId: string;
  success: boolean;
  message: string;
  driversProcessed?: number;
  errors?: string[];
}

export async function reprocessWeekPaymentsCorrectly(
  weekId: string,
  adminFeePercentage: number = 7
): Promise<ReprocessWeekResult> {
  try {
    console.log(`🔄 Iniciando reprocessamento de ${weekId} com ${adminFeePercentage}% de taxa`);

    // 1. Buscar todos os driverPayments da semana (os que vão ser substituídos)
    const paymentsSnap = await adminDb
      .collection('driverPayments')
      .where('weekId', '==', weekId)
      .get();

    if (paymentsSnap.empty) {
      return {
        weekId,
        success: false,
        message: `Nenhum pagamento encontrado para ${weekId}`,
      };
    }

    console.log(`📋 Encontrados ${paymentsSnap.size} pagamentos para reprocessar`);

    // 2. Para cada pagamento, buscar os dados originais e recalcular
    const updates: Array<{ docId: string; newData: Partial<DriverPayment> }> = [];
    const errors: string[] = [];

    for (const paymentDoc of paymentsSnap.docs) {
      const payment = paymentDoc.data() as DriverPayment;

      try {
        // Buscar o registro semanal original (recordSnapshot tem os dados)
        const recordSnapshot = payment.recordSnapshot;

        // CÁLCULO CORRETO:
        // 1. Ganhos - IVA
        const ganhosMenosIVA = recordSnapshot.ganhosTotal - recordSnapshot.ivaValor;

        // 2. Taxa ADM (7% fixo)
        const taxaAdm = ganhosMenosIVA * (adminFeePercentage / 100);

        // 3. Juros é PERCENTUAL sobre ganhosMenosIVA
        const jurosPercent = (recordSnapshot.financingDetails?.interestPercent || 0);
        const jurosBancario = ganhosMenosIVA * (jurosPercent / 100);

        // 4. Ônus é PERCENTUAL sobre ganhosMenosIVA
        const onusPercent = (recordSnapshot.financingDetails?.onusPercent || 0);
        const onusBancario = ganhosMenosIVA * (onusPercent / 100);

        // 5. Total de despesas (inclui juros + ônus)
        const combustivel = recordSnapshot.combustivel || 0;
        const portagens = recordSnapshot.viaverde || 0;
        const aluguel = recordSnapshot.aluguel || 0;
        const parcela = recordSnapshot.financingDetails?.installment || 0;

        const totalDespesas =
          taxaAdm + jurosBancario + onusBancario + combustivel + portagens + aluguel + parcela;

        // 6. Novo repasse
        const novoRepasse = ganhosMenosIVA - totalDespesas;

        // 7. Dados atualizados
        const newPaymentData: Partial<DriverPayment> = {
          baseAmount: novoRepasse,
          baseAmountCents: Math.round(novoRepasse * 100),
          totalAmount: novoRepasse, // sem bonus/desconto
          totalAmountCents: Math.round(novoRepasse * 100),
          adminFeePercentage,
          adminFeeValue: taxaAdm,
          adminFeeCents: Math.round(taxaAdm * 100),
          // Despesas
          combustivel,
          portagens,
          aluguel,
          // Manter comprovante se existir
          proofUrl: payment.proofUrl || undefined,
          proofStoragePath: payment.proofStoragePath || undefined,
          proofFileName: payment.proofFileName || undefined,
          proofFileSize: payment.proofFileSize || undefined,
          proofContentType: payment.proofContentType || undefined,
          proofUploadedAt: payment.proofUploadedAt || undefined,
          updatedAt: new Date().toISOString(),
        };

        updates.push({
          docId: paymentDoc.id,
          newData: newPaymentData,
        });

        console.log(`✅ ${recordSnapshot.driverName}: €${novoRepasse.toFixed(2)}`);
      } catch (error: any) {
        errors.push(
          `${payment.driverName}: ${error.message}`
        );
        console.error(`❌ Erro ao reprocessar ${payment.driverName}:`, error);
      }
    }

    // 3. Aplicar updates
    for (const { docId, newData } of updates) {
      await adminDb.collection('driverPayments').doc(docId).update(newData);
    }

    const message = `✅ Reprocessados ${updates.length} pagamentos${
      errors.length > 0 ? ` (${errors.length} erros)` : ''
    }`;

    console.log(message);

    return {
      weekId,
      success: true,
      message,
      driversProcessed: updates.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    console.error(`❌ Erro ao reprocessar semana ${weekId}:`, error);
    return {
      weekId,
      success: false,
      message: error.message,
    };
  }
}

export async function reprocessLastThreeWeeks(
  adminFeePercentage: number = 7
): Promise<ReprocessWeekResult[]> {
  console.log(`🔄 Reprocessando últimas 3 semanas com taxa de ${adminFeePercentage}%`);

  // Calcular últimas 3 semanas
  const today = new Date();
  const weeks: string[] = [];

  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - 7 * i);
    
    // Achar o domingo dessa semana
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust to sunday
    date.setDate(diff);

    const year = date.getFullYear();
    const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7);
    weeks.push(`${year}-W${week.toString().padStart(2, '0')}`);
  }

  const results: ReprocessWeekResult[] = [];
  for (const weekId of weeks) {
    const result = await reprocessWeekPaymentsCorrectly(weekId, adminFeePercentage);
    results.push(result);
  }

  return results;
}
