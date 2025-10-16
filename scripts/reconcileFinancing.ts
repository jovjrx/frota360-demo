import { adminDb } from '@/lib/firebaseAdmin';

interface FinancingDoc {
  id: string;
  driverId?: string;
  weeks?: number | null;
  remainingWeeks?: number | null;
  status?: string;
  processedRecords?: string[];
  endDate?: string | null;
}

interface PaymentDoc {
  financingProcessed?: Array<{
    financingId?: string;
    recordId?: string;
  }>;
}

function uniqueStrings(values: Iterable<string>): string[] {
  const cleaned = Array.from(values).filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  );
  return Array.from(new Set(cleaned)).sort();
}

async function collectProcessedRecords(financing: FinancingDoc): Promise<string[]> {
  if (!financing.driverId) {
    return [];
  }

  const paymentsSnapshot = await adminDb
    .collection('driverPayments')
    .where('driverId', '==', financing.driverId)
    .get();

  const recordIds: string[] = [];

  paymentsSnapshot.docs.forEach((doc) => {
    const payment = doc.data() as PaymentDoc;
    const processed = Array.isArray(payment.financingProcessed) ? payment.financingProcessed : [];

    processed.forEach((entry) => {
      if (entry?.financingId === financing.id && typeof entry?.recordId === 'string') {
        recordIds.push(entry.recordId);
      }
    });
  });

  return uniqueStrings(recordIds);
}

function computeRemainingWeeks(financing: FinancingDoc, processedCount: number): number | null {
  const totalWeeks = typeof financing.weeks === 'number' && financing.weeks > 0 ? financing.weeks : null;
  if (totalWeeks === null) {
    return null;
  }
  return Math.max(0, totalWeeks - processedCount);
}

async function reconcileSingle(financing: FinancingDoc): Promise<boolean> {
  const processedRecords = await collectProcessedRecords(financing);
  const processedCount = processedRecords.length;
  const recalculatedRemaining = computeRemainingWeeks(financing, processedCount);

  const currentProcessed = Array.isArray(financing.processedRecords) ? financing.processedRecords : [];
  const payload: Record<string, unknown> = {};
  let hasChanges = false;

  if (processedRecords.length > 0 || currentProcessed.length > 0) {
    const nextProcessed = uniqueStrings(processedRecords);
    const currentSet = uniqueStrings(currentProcessed);
    const same =
      nextProcessed.length === currentSet.length &&
      nextProcessed.every((value, index) => value === currentSet[index]);
    if (!same) {
      payload.processedRecords = nextProcessed;
      hasChanges = true;
    }
  }

  if (recalculatedRemaining !== null) {
    if (financing.remainingWeeks !== recalculatedRemaining) {
      payload.remainingWeeks = recalculatedRemaining;
      hasChanges = true;
    }

    const targetStatus = recalculatedRemaining === 0 ? 'completed' : 'active';
    if (financing.status !== targetStatus) {
      payload.status = targetStatus;
      hasChanges = true;
    }

    if (recalculatedRemaining === 0 && !financing.endDate) {
      payload.endDate = new Date().toISOString();
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    return false;
  }

  payload.updatedAt = new Date().toISOString();

  await adminDb.collection('financing').doc(financing.id).update(payload);
  return true;
}

async function main() {
  console.log('🔄 Reconciliando financiamentos...');
  const snapshot = await adminDb.collection('financing').get();
  let updated = 0;

  for (const doc of snapshot.docs) {
    const financing = { id: doc.id, ...(doc.data() as FinancingDoc) };
    const changed = await reconcileSingle(financing);
    if (changed) {
      updated += 1;
      console.log(`✅ Financiamento ${doc.id} atualizado.`);
    }
  }

  console.log(`🎯 Reconciliação concluída. Documentos atualizados: ${updated}`);
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro ao reconciliar financiamentos:', error);
  process.exit(1);
});
