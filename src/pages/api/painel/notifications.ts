import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId é obrigatório' });
  }

  try {
    if (req.method === 'GET') {
      // Buscar notificações
      const notificationsSnap = await adminDb
        .collection('drivers')
        .doc(userId)
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      const notifications = notificationsSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return res.status(200).json({ notifications });

    } else if (req.method === 'POST') {
      // Marcar notificação como lida
      const { notificationId } = req.body;
      
      if (!notificationId) {
        return res.status(400).json({ error: 'notificationId é obrigatório' });
      }

      await adminDb
        .collection('drivers')
        .doc(userId)
        .collection('notifications')
        .doc(notificationId)
        .update({ 
          read: true, 
          readAt: Date.now() 
        });
      
      return res.status(200).json({ success: true });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Erro com notificações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

