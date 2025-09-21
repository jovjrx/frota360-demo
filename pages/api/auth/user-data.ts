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

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    // Buscar dados do usuário na coleção users
    const userDoc = await adminDb.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User data not found for this UID' });
    }

    const userData = userDoc.data();
    const role = userData?.role || 'driver';
    const name = userData?.name || email.split('@')[0];

    let completeUserData: any = {
      uid,
      email,
      name,
      role,
      ...userData
    };

    // Se for driver, buscar dados adicionais da coleção drivers
    if (role === 'driver') {
      const driverSnap = await adminDb.collection('drivers').where('uid', '==', uid).limit(1).get();
      if (!driverSnap.empty) {
        const driverData = driverSnap.docs[0].data();
        completeUserData = {
          ...completeUserData,
          ...driverData,
          driverId: driverSnap.docs[0].id
        };
      }
    }

    return res.status(200).json({ success: true, user: completeUserData, role });

  } catch (error: any) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch user data' });
  }
}