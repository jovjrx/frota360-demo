import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'email e password são obrigatórios' });
    }

    // Criar usuário no Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
    });
    
    // Adicionar o usuário na coleção users
    await adminDb.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name: email.split('@')[0], // Usar parte do email como nome padrão
      role: 'admin',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system'
    });
    
    return res.status(200).json({ 
      success: true, 
      uid: userRecord.uid 
    });

  } catch (error: any) {
    console.error('Erro ao criar usuário admin:', error);
    
    let errorMessage = 'Erro ao criar usuário';
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email já existe';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Senha muito fraca';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Email inválido';
    }
    
    return res.status(400).json({ 
      success: false, 
      error: errorMessage 
    });
  }
}
