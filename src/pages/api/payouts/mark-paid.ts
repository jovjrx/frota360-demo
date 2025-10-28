import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const userSnap = await adminDb.collection('users').where('uid', '==', session.userId).limit(1).get();
    if (userSnap.empty || userSnap.docs[0].data().role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { payoutIds } = req.body;

    if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
      return res.status(400).json({ error: 'Invalid payout IDs' });
    }

    // Update payouts in batch
    const batch = adminDb.batch();
    const now = new Date();

    for (const payoutId of payoutIds) {
      const payoutRef = adminDb.collection('payouts').doc(payoutId);
      batch.update(payoutRef, {
        status: 'paid',
        paidAt: now,
        paidBy: session.userId,
        updatedAt: now,
      });
    }

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: `${payoutIds.length} payouts marked as paid`,
      payoutIds,
    });

  } catch (error) {
    console.error('Error marking payouts as paid:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

