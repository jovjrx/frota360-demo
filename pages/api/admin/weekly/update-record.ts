import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { recordId, updates } = req.body;

    if (!recordId || !updates) {
      return res.status(400).json({ message: 'Record ID and updates are required' });
    }

    const recordRef = adminDb.collection('driverWeeklyRecords').doc(recordId);
    const recordDoc = await recordRef.get();

    if (!recordDoc.exists) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Prevent editing if already paid, unless the update is about payment status itself
    const currentRecord = recordDoc.data() as DriverWeeklyRecord;
    if (currentRecord.paymentStatus === 'paid' && updates.paymentStatus !== 'pending') {
      return res.status(403).json({ message: 'Cannot edit a paid record' });
    }

    // Update the record
    await recordRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    const updatedRecordDoc = await recordRef.get();
    const updatedRecord = { id: updatedRecordDoc.id, ...updatedRecordDoc.data() } as DriverWeeklyRecord;

    res.status(200).json({ message: 'Record updated successfully', record: updatedRecord });

  } catch (error: any) {
    console.error('Error updating driver weekly record:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
