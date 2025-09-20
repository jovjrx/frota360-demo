import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      userIds = [], 
      type, 
      title, 
      message, 
      priority = 'normal',
      adminId,
      metadata = {} 
    } = req.body;

    if (!userIds.length || !type || !title || !message) {
      return res.status(400).json({ error: 'userIds, type, title e message são obrigatórios' });
    }

    const batch = adminDb.batch();
    const notificationIds = [];

    // Criar notificação para cada usuário
    for (const userId of userIds) {
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

      batch.set(notificationRef, notification);
      notificationIds.push(notificationRef.id);

      // Atualizar contador de notificações
      const driverRef = adminDb.collection('drivers').doc(userId);
      batch.update(driverRef, {
        unreadNotifications: FieldValue.increment(1),
        lastNotificationAt: Date.now(),
      });
    }

    await batch.commit();

    // Log de auditoria
    await adminDb.collection('audit_logs').add({
      type: 'notification',
      action: 'bulk_sent',
      userId: adminId || 'system',
      details: `Notificação em massa enviada: ${title} para ${userIds.length} usuários`,
      metadata: { 
        notificationIds, 
        type, 
        priority, 
        recipientsCount: userIds.length 
      },
      timestamp: Date.now(),
    });

    return res.status(200).json({ 
      success: true, 
      notificationIds,
      recipientsCount: userIds.length 
    });

  } catch (error) {
    console.error('Erro ao enviar notificações em massa:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
