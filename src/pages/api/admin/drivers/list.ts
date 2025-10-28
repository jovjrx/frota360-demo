import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { SessionRequest, withIronSessionApiRoute } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';

interface Driver {
  id: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getFirestore(firebaseAdmin);
    const { search, limit = 50 } = req.query;

    const limitNum = Math.min(Number(limit) || 50, 500);

    let query = db.collection('drivers').orderBy('fullName', 'asc') as any;
    const snapshot = await query.limit(limitNum).get();

    let drivers = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      name: doc.data().fullName || doc.data().name,
      fullName: doc.data().fullName,
      email: doc.data().email,
      phone: doc.data().phone,
    } as Driver));

    if (search) {
      const searchLower = (search as string).toLowerCase();
      drivers = drivers.filter(
        (d) =>
          d.fullName?.toLowerCase().includes(searchLower) ||
          d.email?.toLowerCase().includes(searchLower) ||
          d.phone?.includes(search as string)
      );
    }

    const serialized = serializeDatasets({ drivers });

    return res.json({
      data: serialized.drivers,
      total: drivers.length,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/drivers]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
