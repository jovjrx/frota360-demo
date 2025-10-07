import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    success?: boolean;
    error?: string;
    drivers?: any[];
  }>,
) {
  const session = await getSession(req, res);

  if (!session?.isLoggedIn || session.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getFirestore();

  if (req.method === 'GET') {
    try {
      let driversRef: any = db.collection('drivers');

      const { status, type, search } = req.query;

      if (status && status !== 'all') {
        driversRef = driversRef.where('status', '==', status);
      }
      if (type && type !== 'all') {
        driversRef = driversRef.where('type', '==', type);
      }

      const snapshot = await driversRef.get();
      let drivers = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (search) {
        const searchTerm = (search as string).toLowerCase();
        drivers = drivers.filter((driver: any) => {
          const nameMatch = driver.fullName?.toLowerCase().includes(searchTerm) || driver.name?.toLowerCase().includes(searchTerm);
          const emailMatch = driver.email?.toLowerCase().includes(searchTerm);
          return nameMatch || emailMatch;
        });
      }

      return res.status(200).json({ success: true, drivers });
    } catch (e: any) {
      console.error('Error fetching drivers:', e);
      return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

