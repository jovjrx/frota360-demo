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

    const userDoc = await adminDb
      .collection('users')
      .doc(uid)
      .get();

    const isAdmin = userDoc.exists && userDoc.data()?.role === 'admin';

    return res.status(200).json({ isAdmin });

  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}