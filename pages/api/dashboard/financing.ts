import type { NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';

/**
 * API para o motorista visualizar seus financiamentos ativos.
 */
export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;
  if (!user || user.role !== 'driver') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  try {
    const db = getFirestore(firebaseAdmin);
    
    console.log('🔍 [API Dashboard Financing] user.id:', user.id);
    
    // Buscar o driver pelo user.id para pegar o driver.id correto
    const driverSnapshot = await db.collection('drivers').where('email', '==', user.id).limit(1).get();
    
    if (driverSnapshot.empty) {
      console.log('❌ [API Dashboard Financing] Driver não encontrado para user.id:', user.id);
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    
    const driverId = driverSnapshot.docs[0].id;
    console.log('✅ [API Dashboard Financing] driverId encontrado:', driverId);
    
    // Buscar financiamentos pelo driver.id
    const snapshot = await db
      .collection('financing')
      .where('driverId', '==', driverId)
      .orderBy('createdAt', 'desc')
      .get();
    const financings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log('📊 [API Dashboard Financing] Financiamentos encontrados:', financings.length);
    console.log('📦 [API Dashboard Financing] Retornando:', { success: true, financings: financings.length });
    
    return res.status(200).json({ success: true, financings });
  } catch (error: any) {
    console.error('❌ [API Dashboard Financing] Erro ao listar financiamentos:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro interno' });
  }
}, sessionOptions);