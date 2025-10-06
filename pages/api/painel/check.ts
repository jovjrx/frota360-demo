import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'UID é obrigatório' });
    }

    // Verificar se existe um motorista com este UID
    const driverSnap = await adminDb
      .collection('drivers')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    const exists = !driverSnap.empty;
    
    if (exists) {
      const driverData = driverSnap.docs[0].data();
      return res.status(200).json({ 
        exists: true,
        driverId: driverSnap.docs[0].id,
        driverData: driverData
      });
    } else {
      return res.status(200).json({ 
        exists: false 
      });
    }

  } catch (error: any) {
    console.error('Erro ao verificar motorista:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro interno do servidor' 
    });
  }
}
