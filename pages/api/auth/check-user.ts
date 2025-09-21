import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se o usuário existe no Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return res.status(200).json({ 
          exists: false, 
          message: 'Usuário não encontrado' 
        });
      }
      throw error;
    }

    // Verificar se existe documento na coleção users
    const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
    const userExists = userDoc.exists;

    // Verificar se existe documento na coleção drivers
    const driverSnap = await adminDb
      .collection('drivers')
      .where('uid', '==', userRecord.uid)
      .limit(1)
      .get();
    const driverExists = !driverSnap.empty;

    return res.status(200).json({
      exists: true,
      uid: userRecord.uid,
      email: userRecord.email,
      userDocExists: userExists,
      driverDocExists: driverExists,
      needsDriverDoc: userExists && !driverExists,
      message: driverExists ? 'Usuário completo' : 'Usuário sem documento de motorista'
    });

  } catch (error: any) {
    console.error('Erro ao verificar usuário:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro interno do servidor' 
    });
  }
}
