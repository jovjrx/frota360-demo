import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { driverId, isActive, adminId } = req.body;
    
    if (!driverId || typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'driverId e isActive são obrigatórios' });
    }

    const batch = adminDb.batch();
    
    // Atualiza o status do motorista
    const driverRef = adminDb.collection('drivers').doc(driverId);
    batch.update(driverRef, {
      active: isActive,
      statusUpdatedAt: Date.now(),
      statusUpdatedBy: adminId || 'admin'
    });
    
    // Cria uma notificação para o motorista
    const notificationRef = adminDb.collection('drivers').doc(driverId).collection('notifications').doc();
    batch.set(notificationRef, {
      type: 'status_change',
      title: isActive ? 'Conta Habilitada' : 'Conta Desabilitada',
      message: isActive 
        ? 'Sua conta foi habilitada e você pode voltar a usar o painel normalmente.'
        : 'Sua conta foi temporariamente desabilitada. Entre em contacto com o suporte para mais informações.',
      read: false,
      createdAt: Date.now(),
      createdBy: adminId || 'admin'
    });
    
    await batch.commit();
    
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro ao alterar status:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
}
