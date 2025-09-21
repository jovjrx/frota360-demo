import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID Token é obrigatório' });
    }

    // Verificar o token do Firebase
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return res.status(400).json({ error: 'Email não encontrado no token' });
    }

    let userData = null;
    let role: 'admin' | 'driver' | null = null;

    // Verificar se é admin na coleção admins
    const adminDoc = await adminDb
      .collection('admins')
      .doc(uid)
      .get();

    if (adminDoc.exists) {
      const adminData = adminDoc.data();
      if (adminData?.role === 'admin') {
        role = 'admin';
        userData = {
          uid,
          email,
          role: 'admin',
          name: adminData.name || email.split('@')[0],
          ...adminData,
        };
      }
    }

    // Se não é admin, verificar se é motorista
    if (!userData) {
      const driverDoc = await adminDb
        .collection('drivers')
        .where('uid', '==', uid)
        .limit(1)
        .get();
      
      if (!driverDoc.empty) {
        const driverData = driverDoc.docs[0].data();
        const driverId = driverDoc.docs[0].id;
        role = 'driver';
        userData = {
          uid,
          email,
          role: 'driver',
          driverId,
          name: driverData.name || driverData.fullName || email.split('@')[0],
          ...driverData,
        };
      }
    }

    if (!userData || !role) {
      return res.status(404).json({ error: 'Usuário não encontrado no sistema' });
    }

    return res.status(200).json({ 
      success: true, 
      user: userData,
      role: role,
    });

  } catch (error: any) {
    console.error('Erro ao buscar dados do usuário:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}
