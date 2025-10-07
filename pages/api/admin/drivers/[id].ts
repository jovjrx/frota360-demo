import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    success?: boolean;
    error?: string;
    driver?: any;
  }>,
) {
  const session = await getSession(req, res);

  if (!session?.isLoggedIn || session.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getFirestore();
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Driver ID is required' });
  }

  const driverRef = db.collection('drivers').doc(id);

  // GET: Obter detalhes de um motorista
  if (req.method === 'GET') {
    try {
      const doc = await driverRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      return res.status(200).json({ success: true, driver: { id: doc.id, ...doc.data() } });
    } catch (e: any) {
      console.error(`Error fetching driver ${id}:`, e);
      return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
  }

  // PUT: Atualizar um motorista
  if (req.method === 'PUT') {
    try {
      const updates = req.body;
      await driverRef.update(updates);
      return res.status(200).json({ success: true, message: 'Driver updated successfully' });
    } catch (e: any) {
      console.error(`Error updating driver ${id}:`, e);
      return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

