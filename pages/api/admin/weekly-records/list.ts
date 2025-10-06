import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getFirestore } from 'firebase-admin/firestore';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação admin
    const session = await getSession(req, res);
    if (!session?.isLoggedIn) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { weekId, driverId, status } = req.query;

    const db = getFirestore();
    let query = db.collection('driverWeeklyRecords') as any;

    // Aplicar filtros
    if (weekId && weekId !== 'all') {
      query = query.where('weekId', '==', weekId);
    }

    if (driverId && driverId !== 'all') {
      query = query.where('driverId', '==', driverId);
    }

    if (status && status !== 'all') {
      query = query.where('paymentStatus', '==', status);
    }

    // Ordenar por data mais recente
    query = query.orderBy('weekStart', 'desc');

    const snapshot = await query.get();

    const records: DriverWeeklyRecord[] = [];
    snapshot.forEach((doc: any) => {
      records.push({ id: doc.id, ...doc.data() } as DriverWeeklyRecord);
    });

    return res.status(200).json({
      success: true,
      records,
      count: records.length,
    });
  } catch (error) {
    console.error('Error listing weekly records:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
