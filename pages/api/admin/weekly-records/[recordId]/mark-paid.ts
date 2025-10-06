import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação admin
    const session = await getSession(req, res);
    if (!session?.isLoggedIn) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { recordId } = req.query;
    
    if (!recordId || typeof recordId !== 'string') {
      return res.status(400).json({ error: 'Invalid record ID' });
    }

    const db = getFirestore();
    const recordRef = db.collection('driverWeeklyRecords').doc(recordId);
    
    await recordRef.update({
      paymentStatus: 'paid',
      paymentDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Registro marcado como pago',
    });
  } catch (error) {
    console.error('Error marking record as paid:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
