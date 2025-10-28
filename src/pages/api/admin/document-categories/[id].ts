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

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const db = getFirestore(firebaseAdmin);
    await db.collection('documentCategories').doc(id).delete();

    return res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE /api/admin/document-categories/[id]]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
