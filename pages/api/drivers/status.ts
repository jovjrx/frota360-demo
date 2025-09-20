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

    const docRef = adminDb.collection('drivers').doc(userId);
    const snap = await docRef.get();
    
    if (!snap.exists) {
      return res.status(404).json({ 
        success: false, 
        active: false, 
        error: 'Motorista não encontrado' 
      });
    }
    
    const data = snap.data();
    const isActive = data?.active !== false; // Default para true se não especificado
    
    return res.status(200).json({ 
      success: true, 
      active: isActive,
      statusUpdatedAt: data?.statusUpdatedAt,
      statusUpdatedBy: data?.statusUpdatedBy
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return res.status(500).json({ 
      success: false, 
      active: false, 
      error: 'Erro interno do servidor' 
    });
  }
}
