import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecordSchema, type DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

function resolveNextPaymentDate(status: DriverWeeklyRecord['paymentStatus'], previous?: string): string {
  if (status === 'paid') {
    return new Date().toISOString();
  }

  if (status === 'pending') {
    return '';
  }

  return previous || new Date().toISOString();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { record, updates } = req.body ?? {};

  if (!record?.id) {
    return res.status(400).json({ message: 'Record payload with valid id is required' });
  }

  try {
    const docRef = adminDb.collection('driverWeeklyRecords').doc(record.id);
    const snapshot = await docRef.get();
    const existing = snapshot.exists ? (snapshot.data() as Partial<DriverWeeklyRecord>) : {};

    const nextStatus: DriverWeeklyRecord['paymentStatus'] = updates?.paymentStatus || record.paymentStatus || existing?.paymentStatus || 'pending';
    const now = new Date().toISOString();

    const payload = {
      ...existing,
      ...record,
      paymentStatus: nextStatus,
      paymentDate: resolveNextPaymentDate(nextStatus, existing?.paymentDate),
      createdAt: existing?.createdAt || record.createdAt || now,
      updatedAt: now,
      dataSource: record.dataSource || existing?.dataSource || 'manual',
    } as Partial<DriverWeeklyRecord>;

    const validated = DriverWeeklyRecordSchema.parse(payload);

    await docRef.set(validated, { merge: true });

    return res.status(200).json({ record: validated });
  } catch (error: any) {
    console.error('Failed to update weekly record:', error);
    return res.status(500).json({ message: 'Failed to update weekly record', error: error.message });
  }
}
