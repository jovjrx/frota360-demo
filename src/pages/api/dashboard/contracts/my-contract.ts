import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';
import { DriverContractSchema } from '@/schemas/driver-contract';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session.userId || session.role !== 'driver') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const snapshot = await adminDb
      .collection('driverContracts')
      .where('driverId', '==', session.userId)
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ success: true, contract: null });
    }

    const doc = snapshot.docs[0];
    const contract = DriverContractSchema.parse({ id: doc.id, ...(doc.data() as Record<string, unknown>) });
    return res.status(200).json({ success: true, contract });
  } catch (error) {
    console.error('[Contracts] Failed to load driver contract:', error);
    return res.status(500).json({ success: false, error: 'Failed to load driver contract' });
  }
}

