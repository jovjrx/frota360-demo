
import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: string;
  errorMessage?: string;
  isActive: boolean;
  credentials?: any;
}

export default withIronSessionApiRoute(async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    integration?: IntegrationConfig;
    success?: boolean;
    error?: string;
  }>,
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Integration ID is required' });
  }

  const db = getFirestore(firebaseAdmin);
  const integrationRef = db.collection('integrations').doc(id);

  if (req.method === 'GET') {
    try {
      const doc = await integrationRef.get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Integration not found' });
      }
      const integration = doc.data() as IntegrationConfig;
      return res.status(200).json({ integration: { ...integration, id: doc.id } });
    } catch (e) {
      console.error(`Error fetching integration ${id}:`, e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { credentials, isActive } = req.body;

      // Atualizar apenas os campos permitidos
      await integrationRef.update({
        credentials: credentials || {},
        isActive: typeof isActive === 'boolean' ? isActive : false,
        // Resetar status e erro ao salvar novas credenciais
        status: 'disconnected',
        errorMessage: null,
      });

      return res.status(200).json({ success: true });
    } catch (e) {
      console.error(`Error updating integration ${id}:`, e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}, sessionOptions);
