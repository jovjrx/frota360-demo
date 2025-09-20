import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    const driverDoc = adminDb.collection('drivers').doc(userId);
    const snap = await driverDoc.get();
    
    if (!snap.exists) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }
    
    const driverData = snap.data();
    const docsSnap = await driverDoc.collection('documents').get();
    const documents = docsSnap.docs.map((doc: any) => ({ 
      id: doc.id, 
      ...doc.data() 
    }));
    
    const response = {
      ...driverData,
      documents,
      weeklyEarnings: driverData?.weeklyEarnings || 0,
      monthlyEarnings: driverData?.monthlyEarnings || 0,
      active: driverData?.active !== false,
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
