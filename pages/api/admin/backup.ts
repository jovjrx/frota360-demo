import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      // Criar backup
      const { adminId } = req.body;
      
      const backupId = `backup-${Date.now()}`;
      
      // Backup de motoristas
      const driversSnap = await adminDb.collection('drivers').get();
      const drivers = driversSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Backup de users (inclui admins e drivers)
      const usersSnap = await adminDb.collection('users').get();
      const users = usersSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Backup de logs de auditoria
      const auditSnap = await adminDb.collection('audit_logs')
        .orderBy('timestamp', 'desc')
        .limit(1000)
        .get();
      const auditLogs = auditSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      const backup = {
        id: backupId,
        timestamp: Date.now(),
        createdBy: adminId || 'system',
        data: {
          drivers,
          users,
          auditLogs,
        },
        stats: {
          driversCount: drivers.length,
          usersCount: users.length,
          auditLogsCount: auditLogs.length,
        },
      };

      // Salvar backup
      await adminDb.collection('backups').doc(backupId).set(backup);

      // Criar log de auditoria
      await adminDb.collection('audit_logs').add({
        type: 'backup',
        action: 'created',
        userId: adminId || 'system',
        details: `Backup criado: ${backupId}`,
        timestamp: Date.now(),
      });

      return res.status(200).json({ 
        success: true, 
        backupId,
        stats: backup.stats 
      });

    } else if (req.method === 'GET') {
      // Listar backups
      const { limit = 10 } = req.query;
      
      const backupsSnap = await adminDb.collection('backups')
        .orderBy('timestamp', 'desc')
        .limit(parseInt(limit as string))
        .get();

      const backups = backupsSnap.docs.map((doc: any) => ({
        id: doc.id,
        timestamp: doc.data().timestamp,
        createdBy: doc.data().createdBy,
        stats: doc.data().stats,
      }));

      return res.status(200).json({ backups });

    } else if (req.method === 'DELETE') {
      // Deletar backup antigo
      const { backupId, adminId } = req.body;
      
      if (!backupId) {
        return res.status(400).json({ error: 'backupId é obrigatório' });
      }

      await adminDb.collection('backups').doc(backupId).delete();

      // Criar log de auditoria
      await adminDb.collection('audit_logs').add({
        type: 'backup',
        action: 'deleted',
        userId: adminId || 'system',
        details: `Backup deletado: ${backupId}`,
        timestamp: Date.now(),
      });

      return res.status(200).json({ success: true });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Erro com backup:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
