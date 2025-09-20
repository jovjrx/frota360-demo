import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Buscar logs de auditoria
      const { limit = 50, offset = 0, type, userId } = req.query;
      
      let query = adminDb.collection('audit_logs').orderBy('timestamp', 'desc');
      
      if (type) {
        query = query.where('type', '==', type);
      }
      
      if (userId) {
        query = query.where('userId', '==', userId);
      }

      const logsSnap = await query
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string))
        .get();

      const logs = logsSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      return res.status(200).json({ logs });

    } else if (req.method === 'POST') {
      // Criar log de auditoria
      const { type, action, userId, adminId, details, metadata } = req.body;
      
      if (!type || !action || !userId) {
        return res.status(400).json({ error: 'type, action e userId são obrigatórios' });
      }

      const logRef = adminDb.collection('audit_logs').doc();
      
      await logRef.set({
        id: logRef.id,
        type,
        action,
        userId,
        adminId: adminId || null,
        details,
        metadata: metadata || {},
        timestamp: Date.now(),
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      return res.status(200).json({ 
        success: true, 
        logId: logRef.id 
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Erro com auditoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função auxiliar para criar logs
export async function createAuditLog(
  type: string,
  action: string,
  userId: string,
  adminId?: string,
  details?: string,
  metadata?: any
) {
  try {
    const logRef = adminDb.collection('audit_logs').doc();
    
    await logRef.set({
      id: logRef.id,
      type,
      action,
      userId,
      adminId: adminId || null,
      details,
      metadata: metadata || {},
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error);
  }
}
