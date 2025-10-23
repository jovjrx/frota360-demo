import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { CreateDriverSchema } from '@/schemas/driver';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, driverData } = req.body;

    if (!email || !driverData) {
      return res.status(400).json({ error: 'Email e dados do motorista são obrigatórios' });
    }

    // Verificar se o usuário existe no Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }
      throw error;
    }

    // Verificar se já existe documento na coleção drivers
    const driverSnap = await adminDb
      .collection('drivers')
      .where('uid', '==', userRecord.uid)
      .limit(1)
      .get();

    if (!driverSnap.empty) {
      return res.status(400).json({ error: 'Motorista já existe' });
    }

    // Validar dados do motorista
    const validatedData = CreateDriverSchema.parse({
      ...driverData,
      uid: userRecord.uid,
      userId: userRecord.uid,
    });

    // Criar documento do motorista
    // Garantir que novos motoristas tenham taxa administrativa padrão: €25 fixo
    const driverDocRef = await adminDb.collection('drivers').add({
      ...validatedData,
      adminFee: validatedData.adminFee || {
        mode: 'fixed',
        fixedValue: 25,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Atualizar documento do usuário se necessário
    const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
    if (!userDoc.exists) {
      await adminDb.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email: userRecord.email,
        name: validatedData.name,
        role: 'driver',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return res.status(200).json({
      success: true,
      driverId: driverDocRef.id,
      message: 'Motorista criado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao completar cadastro:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Dados inválidos',
        details: error.errors 
      });
    }
    
    return res.status(500).json({ 
      error: error.message || 'Erro interno do servidor' 
    });
  }
}
