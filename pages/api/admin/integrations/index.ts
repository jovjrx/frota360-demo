
import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute, SessionRequest } from '@/lib/session/ironSession';
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
  req: SessionRequest,
  res: NextApiResponse<{
    integrations?: IntegrationConfig[];
    integration?: IntegrationConfig;
    success?: boolean;
    error?: string;
  }>,
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const db = getFirestore(firebaseAdmin);
  const integrationsRef = db.collection('integrations');

  if (req.method === 'GET') {
    try {
      const snapshot = await integrationsRef.get();
      const integrations: IntegrationConfig[] = [];

      if (snapshot.empty) {
        // Se não houver integrações salvas, criar as padrão
        const defaultIntegrations = [
          { id: 'uber', name: 'Uber', description: 'Integração com a plataforma Uber', status: 'disconnected' as 'disconnected', isActive: false },
          { id: 'bolt', name: 'Bolt', description: 'Integração com a plataforma Bolt', status: 'disconnected' as 'disconnected', isActive: false },
          { id: 'myprio', name: 'MyPrio', description: 'Integração com o sistema MyPrio', status: 'disconnected' as 'disconnected', isActive: false },
          { id: 'viaverde', name: 'Via Verde', description: 'Integração com o sistema Via Verde', status: 'disconnected' as 'disconnected', isActive: false },
          { id: 'cartrack', name: 'Cartrack', description: 'Integração com o sistema de rastreamento Cartrack', status: 'disconnected' as 'disconnected', isActive: false },
        ];
        for (const int of defaultIntegrations) {
          await integrationsRef.doc(int.id).set(int);
          integrations.push(int);
        }
      } else {
        snapshot.forEach(doc => {
          const data = doc.data() as IntegrationConfig;
          integrations.push({ ...data, id: doc.id });
        });
      }

      return res.status(200).json({ integrations });
    } catch (e) {
      console.error('Error fetching integrations:', e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}, sessionOptions);


