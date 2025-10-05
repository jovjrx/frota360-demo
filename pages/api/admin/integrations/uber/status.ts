import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Verifica se a integração Uber está conectada
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user || session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

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
