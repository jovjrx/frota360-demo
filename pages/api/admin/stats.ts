import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const driversSnap = await adminDb.collection('drivers').get();
    
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    let totalDrivers = 0;
    let activeDrivers = 0;

    driversSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      totalDrivers++;
      
      if (data?.active !== false) {
        activeDrivers++;
      }
      
      weeklyTotal += data?.weeklyEarnings || 0;
      monthlyTotal += data?.monthlyEarnings || 0;
    });

    const stats = {
      weeklyTotal,
      monthlyTotal,
      totalDrivers,
      activeDrivers,
    };

    return res.status(200).json(stats);

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
