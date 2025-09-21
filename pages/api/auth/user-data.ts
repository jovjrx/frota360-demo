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

    // Verificar se é admin (coleção users) ou motorista (coleção drivers)
    const userDoc = await adminDb.collection('users').doc(uid).get();
    const driverSnap = await adminDb.collection('drivers').where('uid', '==', uid).limit(1).get();
    
    let userData: any = { uid, email, name: email.split('@')[0] };
    let role: 'admin' | 'driver' | 'unknown' = 'unknown';
    
    if (userDoc.exists) {
      // É admin
      const userFirestoreData = userDoc.data();
      role = 'admin';
      userData = { 
        ...userData, 
        ...userFirestoreData, 
        role: role,
        name: userFirestoreData?.name || userData.name
      };
    } else if (!driverSnap.empty) {
      // É motorista
      const driverData = driverSnap.docs[0].data();
      role = 'driver';
      userData = { 
        ...userData, 
        ...driverData, 
        role: role,
        driverId: driverSnap.docs[0].id,
        name: driverData?.name || userData.name
      };
    } else {
      return res.status(404).json({ error: 'User data not found for this UID' });
    }

    return res.status(200).json({ success: true, user: userData, role });

  } catch (error: any) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch user data' });
  }
}