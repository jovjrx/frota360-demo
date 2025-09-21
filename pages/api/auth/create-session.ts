import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { createSession } from '@/lib/session/ironSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token é obrigatório' });
    }

    // Verificar o token do Firebase
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return res.status(400).json({ error: 'Email não encontrado no token' });
    }

    // Verificar se é admin (coleção users) ou motorista (coleção drivers)
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const driverSnap = await adminDb.collection('drivers').where('uid', '==', uid).limit(1).get();
    
    let role = 'driver'; // Default
    let name = email.split('@')[0];
    let driverId = null;
    
    if (userDoc.exists) {
      // É admin
      const userData = userDoc.data();
      role = 'admin';
      name = userData?.name || name;
    } else if (!driverSnap.empty) {
      // É motorista
      const driverData = driverSnap.docs[0].data();
      driverId = driverSnap.docs[0].id;
      name = driverData?.name || name;
    } else {
      return res.status(403).json({ error: 'Usuário não encontrado no sistema' });
    }

    // Criar sessão
    await createSession(req, res, {
      userId: uid,
      role: role,
      email: email,
      name: name,
      driverId: driverId,
    });

    return res.status(200).json({ success: true, role: role });

  } catch (error: any) {
    console.error('Erro ao criar sessão:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}