import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { SessionRequest, withIronSessionApiRoute } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const db = getFirestore(firebaseAdmin);

    if (req.method === 'DELETE') {
      await db.collection('documentRequests').doc(id).delete();
      return res.json({ success: true, message: 'Document request deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('[DELETE /api/admin/documents/[id]]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
