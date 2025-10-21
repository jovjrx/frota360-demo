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

    console.log(`🔍 Buscando usuário: UID=${uid}, Email=${email}`);

    // 1️⃣ PRIMEIRO: Verificar se é admin (coleção users + role/isAdmin) ou custom claims
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const customRole = (decodedToken as any)?.role;
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const isAdminDoc = userData?.role === 'admin' || userData?.isAdmin === true;
      const isAdminByClaim = customRole === 'admin';

      if (isAdminDoc || isAdminByClaim) {
        // ✅ É ADMIN
        const name = userData?.name || email.split('@')[0];
        console.log(`✅ Admin confirmado: ${name} (via ${isAdminDoc ? 'users.role' : 'customClaim'})`);
        
        await createSession(req, res, {
          userId: uid,
          role: 'admin',
          email: email,
          name: name,
          driverId: null,
          user: {
            id: uid,
            role: 'admin',
            email: email,
            name: name,
          },
        });

        return res.status(200).json({ success: true, role: 'admin' });
      } else {
        console.warn(`ℹ️ Documento em 'users' encontrado para UID=${uid}, mas sem role admin (role='${userData?.role}', isAdmin=${userData?.isAdmin}, claim=${customRole}).`);
      }
    }

    // 2️⃣ SEGUNDO: Verificar se é motorista (coleção drivers)
    // Buscar por UID primeiro
    let driverSnap = await adminDb.collection('drivers').where('uid', '==', uid).limit(1).get();
    
    // Se não encontrou por UID, buscar por EMAIL
    if (driverSnap.empty) {
      console.log(`⚠️ Motorista não encontrado por UID, buscando por email: ${email}`);
      driverSnap = await adminDb.collection('drivers').where('email', '==', email).limit(1).get();
    }
    
    if (!driverSnap.empty) {
      // ✅ É MOTORISTA
      const driverDoc = driverSnap.docs[0];
      const driverData = driverDoc.data();
      const driverId = driverDoc.id;
      const name = driverData?.fullName || driverData?.name || `${driverData?.firstName || ''} ${driverData?.lastName || ''}`.trim() || email.split('@')[0];
      
      // Verificar status do motorista
      const status = driverData?.status || (driverData?.isActive ? 'active' : 'inactive');
      if (status !== 'active') {
        console.warn(`🚫 Login bloqueado para motorista ${driverId} (${email}) com status='${status}'.`);
        return res.status(403).json({ error: 'Sua conta de motorista não está ativa. Entre em contato com o suporte.' });
      }
      
      console.log(`✅ Motorista encontrado: ${name} (ID: ${driverId})`);
      
      // ✅ IMPORTANTE: driverId deve ser o EMAIL para funcionar com as buscas
      await createSession(req, res, {
        userId: email,        // Usar EMAIL como userId
        role: 'driver',
        email: email,
        name: name,
        driverId: email,      // Usar EMAIL como driverId (buscas usam email)
        user: {
          id: email,          // Usar EMAIL como id
          role: 'driver',
          email: email,
          name: name,
        },
      });

      return res.status(200).json({ success: true, role: 'driver' });
    }

    // ❌ Não encontrado em nenhuma coleção
    console.error(`❌ Usuário não encontrado: UID=${uid}, Email=${email}`);
    return res.status(403).json({ error: 'Usuário não encontrado no sistema. Por favor, entre em contato com o suporte.' });

  } catch (error: any) {
    console.error('Erro ao criar sessão:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}