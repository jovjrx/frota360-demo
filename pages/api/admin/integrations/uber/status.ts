import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth/helpers';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Verifica se a integração Uber está conectada
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  try {
    // Verificar se existem tokens salvos no banco
    const userId = session.user.id;
    const tokenDoc = await adminDb.collection('integrations').doc(`uber_${userId}`).get();
    
    const connected = tokenDoc.exists && tokenDoc.data()?.accessToken;

    return res.status(200).json({
      connected,
      lastSync: tokenDoc.data()?.lastSync || null,
    });
  } catch (error) {
    console.error('Error checking Uber status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
