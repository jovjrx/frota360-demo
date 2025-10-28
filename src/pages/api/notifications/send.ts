import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userId, 
      type, 
      title, 
      message, 
      priority = 'normal',
      adminId,
      metadata = {} 
    } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'userId, type, title e message são obrigatórios' });
    }

    const notificationRef = adminDb
      .collection('drivers')
      .doc(userId)
      .collection('notifications')
      .doc();

    const notification = {
      id: notificationRef.id,
      type,
      title,
      message,
      priority,
      read: false,
      createdAt: Date.now(),
      createdBy: adminId || 'system',
      metadata,
      readAt: null,
    };

    await notificationRef.set(notification);

    // Atualizar contador de notificações não lidas
    const driverRef = adminDb.collection('drivers').doc(userId);
    await driverRef.update({
      unreadNotifications: FieldValue.increment(1),
      lastNotificationAt: Date.now(),
    });

    // Log de auditoria
    await adminDb.collection('audit_logs').add({
      type: 'notification',
      action: 'sent',
      userId,
      adminId: adminId || 'system',
      details: `Notificação enviada: ${title}`,
      metadata: { notificationId: notificationRef.id, type, priority },
      timestamp: Date.now(),
    });

    return res.status(200).json({ 
      success: true, 
      notificationId: notificationRef.id 
    });

  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

