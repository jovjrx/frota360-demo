import type { NextApiResponse } from 'next';
import { SessionRequest } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';

interface User {
  id: string;
  role: 'admin' | 'driver' | 'user'; // Adicione outros roles conforme necessário
  [key: string]: any; // Para permitir outras propriedades dinâmicas
}

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse<{
    success?: boolean;
    message?: string;
    error?: string;
    user?: any;
    users?: any[];
    stats?: { total: number; admins: number; drivers: number };
  }>,
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getFirestore(firebaseAdmin);
  const auth = getAuth(firebaseAdmin);

  // GET: Listar usuários
  if (req.method === 'GET') {
    try {
      const usersSnapshot = await db.collection('users').get();
      const users: User[] = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as User,
      }));

      // Calcular stats
      const total = users.length;
      const admins = users.filter(u => u.role === 'admin').length;
      const drivers = users.filter(u => u.role === 'driver').length;

      return res.status(200).json({ success: true, users, stats: { total, admins, drivers } });
    } catch (e: any) {
      console.error('Error fetching users:', e);
      return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
  }

  // POST: Gerenciar (update, delete, change role)
  if (req.method === 'POST') {
    const { userId, action, userData } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ error: 'Missing userId or action' });
    }

    try {
      switch (action) {
        case 'update_user':
          if (!userData) {
            return res.status(400).json({ error: 'Missing user data for update' });
          }
          await db.collection('users').doc(userId).update(userData);
          // Atualizar no Firebase Auth também se email ou nome mudar
          if (userData.email || userData.name) {
            await auth.updateUser(userId, {
              email: userData.email,
              displayName: userData.name,
            });
          }
          return res.status(200).json({ success: true, message: 'User updated successfully' });

        case 'delete_user':
          await db.collection('users').doc(userId).delete();
          await auth.deleteUser(userId);
          return res.status(200).json({ success: true, message: 'User deleted successfully' });

        case 'change_role':
          if (!userData?.role) {
            return res.status(400).json({ error: 'Missing role for change_role action' });
          }
          await db.collection('users').doc(userId).update({ role: userData.role });
          // Atualizar custom claims no Firebase Auth
          await auth.setCustomUserClaims(userId, { role: userData.role });
          return res.status(200).json({ success: true, message: 'User role updated successfully' });

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    } catch (e: any) {
      console.error(`Error performing action ${action} on user ${userId}:`, e);
      return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}, sessionOptions);


