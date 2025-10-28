import { NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { getPortugalTimestamp } from '@/lib/timezone';

export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { requestId, status } = req.body;

    if (!requestId || !status) {
      return res.status(400).json({ success: false, error: 'Request ID and status are required' });
    }

    const db = getFirestore(firebaseAdmin);
    const now = getPortugalTimestamp();

    await db.collection('driver_requests').doc(requestId).update({
      status,
      updatedAt: now,
    });

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error updating request status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}, sessionOptions);


