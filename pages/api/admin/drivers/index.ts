import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    if (!session?.isLoggedIn) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = getFirestore();

    if (req.method === 'GET') {
      // Listar motoristas com filtros
      const { status, type, search } = req.query;

      let query = db.collection('drivers').orderBy('createdAt', 'desc');

      // Filtro por status
      if (status && status !== 'all') {
        query = query.where('status', '==', status) as any;
      }

      // Filtro por tipo
      if (type && type !== 'all') {
        query = query.where('type', '==', type) as any;
      }

      const snapshot = await query.get();

      let drivers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{ id: string; name?: string; fullName?: string; email?: string; [key: string]: any }>;

      // Filtro por busca (nome/email) - aplicado após a query
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        drivers = drivers.filter(driver => 
          (driver.name?.toLowerCase().includes(searchLower)) ||
          (driver.fullName?.toLowerCase().includes(searchLower)) ||
          (driver.email?.toLowerCase().includes(searchLower))
        );
      }

      return res.status(200).json({ drivers });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in drivers API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
