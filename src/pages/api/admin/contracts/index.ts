import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { SessionRequest, withIronSessionApiRoute } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';
import type { DriverContract } from '@/schemas/driver-contract';

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
    const { search, status, type, limit = 50, offset = 0 } = req.query;

    const limitNum = Math.min(Number(limit) || 50, 500);
    const offsetNum = Number(offset) || 0;

    let query = db.collection('driverContracts') as any;

    if (status && status !== 'all') {
      query = query.where('status', '==', status as string);
    }

    if (type && type !== 'all') {
      query = query.where('contractType', '==', type as string);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offsetNum)
      .limit(limitNum)
      .get();

    let contracts = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...(doc.data() as Omit<DriverContract, 'id'>),
    }));

    if (search) {
      const searchLower = (search as string).toLowerCase();
      contracts = contracts.filter(
        (c) =>
          c.driverName?.toLowerCase().includes(searchLower) ||
          c.driverEmail?.toLowerCase().includes(searchLower) ||
          c.category?.toLowerCase().includes(searchLower)
      );
    }

    const serialized = serializeDatasets({ contracts });

    return res.json({
      data: serialized.contracts,
      total: contracts.length,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/contracts]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
