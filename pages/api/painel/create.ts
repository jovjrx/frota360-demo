import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { idToken, driverData } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID Token é obrigatório' });
    }

    if (!driverData) {
      return res.status(400).json({ error: 'Dados do motorista são obrigatórios' });
    }

    // Verificar o token do Firebase
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return res.status(400).json({ error: 'Email não encontrado no token' });
    }

    // Verificar se já existe um motorista com este UID
    const existingDriverSnap = await adminDb
      .collection('drivers')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (!existingDriverSnap.empty) {
      return res.status(400).json({ error: 'Motorista já existe com este UID' });
    }

    // Criar documento do motorista usando adminDb (server-side)
    // Garantir taxa administrativa padrão: €25 fixo
    const driverDocRef = await adminDb.collection('drivers').add({
      ...driverData,
      uid: uid,
      userId: uid,
      adminFee: driverData.adminFee || {
        mode: 'fixed',
        fixedValue: 25,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Documento do motorista criado com ID:', driverDocRef.id);

    return res.status(200).json({ 
      success: true, 
      driverId: driverDocRef.id,
      message: 'Motorista criado com sucesso' 
    });

  } catch (error: any) {
    console.error('Erro ao criar motorista:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro interno do servidor' 
    });
  }
}