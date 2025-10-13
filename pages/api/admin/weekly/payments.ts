import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import {
  DriverWeeklyRecord,
  DriverWeeklyRecordSchema,
} from '@/schemas/driver-weekly-record';
import { DriverPayment, DriverPaymentRecordSnapshot, DriverPaymentSchema } from '@/schemas/driver-payment';
import { WeeklyNormalizedDataSchema } from '@/schemas/data-weekly';

interface PaymentRequestBody {
  record?: Partial<DriverWeeklyRecord> & { id: string };
  payment?: {
    paymentDate?: string;
    notes?: string;
    iban?: string | null;
    bonusAmount?: number;
    discountAmount?: number;
    proof?: {
      url?: string;
      storagePath?: string;
      fileName?: string;
      size?: number;
      contentType?: string;
      uploadedAt?: string;
    };
  };
  actor?: {
    uid?: string;
    email?: string;
    name?: string | null;
  };
}

function sanitizeFirestoreData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeFirestoreData(item)) as unknown as T;
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce((acc, [key, entryValue]) => {
      if (entryValue === undefined) {
        return acc;
      }

      (acc as Record<string, unknown>)[key] = sanitizeFirestoreData(entryValue);
      return acc;
    }, Array.isArray(value) ? [] : {}) as T;
  }

  return value;
}

function toIsoString(value: string | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid payment date');
  }

  return parsed.toISOString();
}

function normalizeAmount(amount?: number): { amount: number; amountCents: number } {
  const numeric = Number.isFinite(amount) ? Number(amount) : 0;
  const precision = Math.round(numeric * 100);
  return {
    amount: Math.round(precision) / 100,
    amountCents: precision,
  };
}

async function createDriverPayment(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const body = (req.body as PaymentRequestBody) ?? {};
  const { record, payment, actor } = body;

  if (!record?.id) {
    res.status(400).json({ message: 'Weekly record is required to register a payment.' });
    return;
  }

  if (!record?.driverId || !record.weekId) {
    res.status(400).json({ message: 'Record payload missing driver or week data.' });
    return;
  }

  try {
    const baseAmountResult = normalizeAmount(record.repasse);
    const bonusResult = normalizeAmount(Math.max(0, payment?.bonusAmount ?? 0));
    const discountResult = normalizeAmount(Math.max(0, payment?.discountAmount ?? 0));

    const totalAmountCents = baseAmountResult.amountCents + bonusResult.amountCents - discountResult.amountCents;

    if (totalAmountCents <= 0) {
      return res.status(400).json({ message: 'Payment total must be greater than zero.' });
    }

    const paymentDateIso = toIsoString(payment?.paymentDate);

    const nowIso = new Date().toISOString();
    const paymentRef = adminDb.collection('driverPayments').doc();

    const proofData = payment?.proof;
    const proofPayload = proofData
      ? {
          proofUrl: proofData.url,
          proofStoragePath: proofData.storagePath,
          proofFileName: proofData.fileName,
          proofFileSize: typeof proofData.size === 'number' ? Math.max(0, Math.trunc(proofData.size)) : undefined,
          proofContentType: proofData.contentType,
          proofUploadedAt: proofData.uploadedAt ?? nowIso,
        }
      : {};

    const safePlatformData = Array.isArray((record as any)?.platformData)
      ? ((record as any).platformData as unknown[])
          .map((entry) => {
            const platform = (entry as any)?.platform;
            if (!['uber', 'bolt', 'myprio', 'viaverde'].includes(platform)) {
              console.warn('Skipping platform data entry with invalid platform:', platform);
              return null;
            }

            const normalized = {
              id: typeof (entry as any)?.id === 'string' ? (entry as any).id : String((entry as any)?.id ?? ''),
              weekId: (entry as any)?.weekId ?? record.weekId,
              weekStart: (entry as any)?.weekStart ?? record.weekStart,
              weekEnd: (entry as any)?.weekEnd ?? record.weekEnd,
              platform,
              referenceId: (entry as any)?.referenceId ?? '',
              referenceLabel:
                typeof (entry as any)?.referenceLabel === 'string'
                  ? (entry as any).referenceLabel
                  : undefined,
              driverId: (entry as any)?.driverId ?? record.driverId ?? null,
              driverName: (entry as any)?.driverName ?? record.driverName ?? null,
              vehiclePlate: (entry as any)?.vehiclePlate ?? null,
              totalValue: Number((entry as any)?.totalValue ?? 0),
              totalTrips: Number((entry as any)?.totalTrips ?? 0),
              rawDataRef:
                typeof (entry as any)?.rawDataRef === 'string'
                  ? (entry as any).rawDataRef
                  : undefined,
              createdAt: (entry as any)?.createdAt ?? nowIso,
              updatedAt: (entry as any)?.updatedAt ?? nowIso,
            };

            try {
              const parsed = WeeklyNormalizedDataSchema.parse(normalized);
              return sanitizeFirestoreData(parsed);
            } catch (error) {
              console.warn('Skipping invalid platform data entry in payment snapshot:', error);
              return null;
            }
          })
          .filter((value): value is ReturnType<typeof WeeklyNormalizedDataSchema.parse> => Boolean(value))
      : undefined;

    const recordSnapshot: DriverPaymentRecordSnapshot = {
      id: record.id,
      driverId: record.driverId,
      driverName: record.driverName,
      driverEmail: record.driverEmail ?? undefined,
      weekId: record.weekId,
      weekStart: record.weekStart,
      weekEnd: record.weekEnd,
      isLocatario: Boolean((record as any)?.isLocatario),
      combustivel: Number(record.combustivel ?? 0),
      viaverde: Number(record.viaverde ?? 0),
      aluguel: Number(record.aluguel ?? 0),
      ganhosTotal: Number(record.ganhosTotal ?? 0),
      ivaValor: Number(record.ivaValor ?? 0),
      ganhosMenosIVA: Number((record as any)?.ganhosMenosIVA ?? 0),
      despesasAdm: Number(record.despesasAdm ?? 0),
      totalDespesas: Number((record as any)?.totalDespesas ?? 0),
      repasse: Number(record.repasse ?? 0),
      iban: record.iban ?? undefined,
      paymentStatus: 'paid',
      paymentDate: paymentDateIso,
      dataSource: (record as any)?.dataSource ?? 'manual',
      createdAt: record.createdAt ?? nowIso,
      updatedAt: nowIso,
      notes: record.notes ?? undefined,
      ...(safePlatformData ? { platformData: safePlatformData } : {}),
    };

    const basePayment: Omit<DriverPayment, 'id'> = {
      recordId: record.id,
      driverId: record.driverId,
      driverName: record.driverName,
      weekId: record.weekId,
      weekStart: record.weekStart,
      weekEnd: record.weekEnd,
      currency: 'EUR',
      baseAmount: baseAmountResult.amount,
      baseAmountCents: baseAmountResult.amountCents,
      bonusAmount: bonusResult.amount,
      bonusCents: bonusResult.amountCents,
      discountAmount: discountResult.amount,
      discountCents: discountResult.amountCents,
      totalAmount: totalAmountCents / 100,
      totalAmountCents,
      iban: payment?.iban ?? record.iban ?? undefined,
      paymentDate: paymentDateIso,
      notes: payment?.notes ? payment.notes.trim() : '',
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: actor
        ? {
            uid: actor.uid,
            email: actor.email,
            name: actor.name ?? undefined,
          }
        : undefined,
      recordSnapshot,
      ...proofPayload,
    };

    const validatedPayment = DriverPaymentSchema.parse({
      id: paymentRef.id,
      ...basePayment,
    });

  let updatedRecord: DriverWeeklyRecord | null = null;
  let persistedPayment: DriverPayment | null = null;

    await adminDb.runTransaction(async (transaction) => {
      const recordRef = adminDb.collection('driverWeeklyRecords').doc(record.id);
      const snapshot = await transaction.get(recordRef);
      const persisted = snapshot.exists ? (snapshot.data() as Partial<DriverWeeklyRecord>) : {};

      if (persisted.paymentStatus === 'paid') {
        throw Object.assign(new Error('Record already paid'), { statusCode: 409 });
      }

      const mergedRecord = {
        ...persisted,
        ...record,
        paymentStatus: 'paid' as const,
        paymentDate: paymentDateIso,
        createdAt: persisted?.createdAt || record.createdAt || nowIso,
        updatedAt: nowIso,
      } satisfies Partial<DriverWeeklyRecord>;

  const validRecord = DriverWeeklyRecordSchema.parse(mergedRecord);
  const sanitizedRecord = sanitizeFirestoreData(validRecord);
  const sanitizedPayment = sanitizeFirestoreData(validatedPayment);
  updatedRecord = sanitizedRecord as DriverWeeklyRecord;

      transaction.set(recordRef, sanitizedRecord, { merge: true });
      transaction.set(paymentRef, sanitizedPayment);
      persistedPayment = sanitizedPayment as DriverPayment;
      
      // Decrementar remainingWeeks dos financiamentos ativos do motorista (apenas empréstimos)
      const financingSnapshot = await adminDb
        .collection('financing')
        .where('driverId', '==', record.driverId)
        .where('status', '==', 'active')
        .where('type', '==', 'loan')
        .get();
      
      const financingUpdates: Array<{
        id: string;
        type: string;
        amount: number;
        previousRemaining: number;
        newRemaining: number;
        completed: boolean;
      }> = [];
      
      financingSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const currentRemaining = typeof data.remainingWeeks === 'number' ? data.remainingWeeks : 0;
        
        if (currentRemaining > 0) {
          const newRemaining = currentRemaining - 1;
          
          // Se chegou a 0, marcar como completed
          if (newRemaining <= 0) {
            transaction.update(doc.ref, {
              remainingWeeks: 0,
              status: 'completed',
              updatedAt: nowIso,
            });
            financingUpdates.push({
              id: doc.id,
              type: data.type || 'loan',
              amount: data.amount || 0,
              previousRemaining: currentRemaining,
              newRemaining: 0,
              completed: true,
            });
            console.log(`✅ Financiamento ${doc.id} do motorista ${record.driverId} completado`);
          } else {
            transaction.update(doc.ref, {
              remainingWeeks: newRemaining,
              updatedAt: nowIso,
            });
            financingUpdates.push({
              id: doc.id,
              type: data.type || 'loan',
              amount: data.amount || 0,
              previousRemaining: currentRemaining,
              newRemaining: newRemaining,
              completed: false,
            });
            console.log(`📉 Financiamento ${doc.id} do motorista ${record.driverId}: ${newRemaining} semanas restantes`);
          }
        }
      });
      
      // Armazenar informações de financiamento processado no documento de pagamento
      if (financingUpdates.length > 0) {
        const financingLog = financingUpdates.map(f => ({
          financingId: f.id,
          type: f.type,
          amount: f.amount,
          installmentPaid: f.previousRemaining - f.newRemaining,
          remainingInstallments: f.newRemaining,
          completed: f.completed,
        }));
        
        transaction.update(paymentRef, {
          financingProcessed: financingLog,
          updatedAt: nowIso,
        });
      }
    });

    if (!updatedRecord) {
      throw new Error('Failed to persist weekly record update');
    }

    if (!persistedPayment) {
      throw new Error('Failed to persist payment record');
    }

    res.status(200).json({
      record: updatedRecord,
      payment: persistedPayment,
    });
  } catch (error: any) {
    const statusCode = error?.statusCode === 409 ? 409 : 500;
    const message =
      error?.message === 'Invalid payment date'
        ? 'Invalid payment date provided.'
        : error?.statusCode === 409
        ? 'Record already marked as paid.'
        : 'Failed to register payment.';

    console.error('Failed to create driver payment:', error);
    res.status(statusCode).json({ message, error: error?.message });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    return createDriverPayment(req, res);
  }

  res.setHeader('Allow', ['POST']);
  return res.status(405).json({ message: 'Method Not Allowed' });
}
