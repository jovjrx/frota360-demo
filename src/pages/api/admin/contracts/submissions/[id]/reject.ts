import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';
import { z } from 'zod';

const rejectionSchema = z.object({
  reason: z.string().min(1),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session.userId || session.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  const parsed = rejectionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

  try {
    const nowIso = new Date().toISOString();
    await adminDb.collection('driverContracts').doc(id).update({
      status: 'rejected',
      rejectionReason: parsed.data.reason,
      reviewedBy: session.email ?? session.userId,
      reviewedAt: nowIso,
      updatedAt: nowIso,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Contracts] Failed to reject submission:', error);
    return res.status(500).json({ success: false, error: 'Failed to reject submission' });
  }
}
