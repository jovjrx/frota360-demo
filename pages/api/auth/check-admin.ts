import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uid } = req.body;
    
    if (!uid) {
      return res.status(400).json({ error: 'UID é obrigatório' });
    }

    // Verificar se está na coleção admins
    const adminDoc = await getFirestore()
      .collection('admins')
      .doc(uid)
      .get();

    const isAdmin = adminDoc.exists && adminDoc.data()?.role === 'admin';
    
    return res.status(200).json({ isAdmin });

  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return res.status(500).json({ 
      isAdmin: false,
      error: 'Erro interno do servidor' 
    });
  }
}
