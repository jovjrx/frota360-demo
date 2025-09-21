import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { createSession } from '@/lib/session/ironSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { idToken, userType } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token é obrigatório' });
    }

    // Verificar o token do Firebase
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return res.status(400).json({ error: 'Email não encontrado no token' });
    }

    // Determinar o tipo de usuário e buscar dados
    let role: 'admin' | 'ops' | 'driver' = 'driver';
    let userId = uid;
    let driverId = null;

    // Verificar se é admin
    const adminEmails = [
      'conduzcontacto@gmail.com',
      'admin@conduz.pt'
    ];
    
    const isConduzPt = email.endsWith('@conduz.pt');
    const isInAdminList = adminEmails.includes(email.toLowerCase());
    const isAdmin = isConduzPt || isInAdminList;

    if (isAdmin) {
      role = 'admin';
      
      // Buscar dados do admin no Firestore
      const adminDoc = await getFirestore()
        .collection('admins')
        .doc(uid)
        .get();
      
      if (adminDoc.exists) {
        const adminData = adminDoc.data();
        // Admin encontrado no Firestore
      } else {
        // Criar admin no Firestore se não existir
        await getFirestore()
          .collection('admins')
          .doc(uid)
          .set({
            email: email,
            role: 'admin',
            createdAt: Date.now(),
            createdBy: 'system'
          });
      }
    } else {
      // Verificar se é motorista
      const driverDoc = await getFirestore()
        .collection('drivers')
        .where('uid', '==', uid)
        .limit(1)
        .get();
      
      if (!driverDoc.empty) {
        const driverData = driverDoc.docs[0].data();
        driverId = driverDoc.docs[0].id;
        role = 'driver';
      } else {
        return res.status(403).json({ error: 'Usuário não encontrado no sistema' });
      }
    }

    // Criar sessão
    await createSession(req, res, {
      userId: uid,
      role: role,
      email: email,
      name: decodedToken.name || email.split('@')[0],
      driverId: driverId,
    });

    return res.status(200).json({ 
      success: true,
      role: role,
      userId: uid,
      email: email
    });

  } catch (error: any) {
    console.error('Erro ao criar sessão:', error);
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: 'Token inválido' });
    } else if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
