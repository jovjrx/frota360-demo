
import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';

// TODO: Implementar funções de sincronização reais para cada plataforma
async function syncUberData(credentials: any) {
  console.log('Sincronizando Uber com credenciais:', credentials);
  // Simulação de sincronização
  return { success: true, message: 'Uber data synced (simulated)' };
}

async function syncBoltData(credentials: any) {
  console.log('Sincronizando Bolt com credenciais:', credentials);
  // Simulação de sincronização
  return { success: true, message: 'Bolt data synced (simulated)' };
}

async function syncMyPrioData(credentials: any) {
  console.log('Sincronizando MyPrio com credenciais:', credentials);
  // Simulação de sincronização
  return { success: true, message: 'MyPrio data synced (simulated)' };
}

async function syncViaVerdeData(credentials: any) {
  console.log('Sincronizando Via Verde com credenciais:', credentials);
  // Simulação de sincronização
  return { success: true, message: 'Via Verde data synced (simulated)' };
}

async function syncCartrackData(credentials: any) {
  console.log('Sincronizando Cartrack com credenciais:', credentials);
  // Simulação de sincronização
  return { success: true, message: 'Cartrack data synced (simulated)' };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    success?: boolean;
    message?: string;
    error?: string;
  }>,
) {
  const session = await getSession(req, res);

  if (!session?.isLoggedIn || session.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const db = getFirestore();
    const integrationsRef = db.collection('integrations');

    try {
      const snapshot = await integrationsRef.where('isActive', '==', true).get();
      const syncPromises: Promise<any>[] = [];

      if (snapshot.empty) {
        return res.status(200).json({ success: true, message: 'No active integrations to sync' });
      }

      snapshot.forEach(doc => {
        const integration = doc.data();
        const platformId = doc.id;

        let syncFunction;
        switch (platformId) {
          case 'uber':
            syncFunction = syncUberData;
            break;
          case 'bolt':
            syncFunction = syncBoltData;
            break;
          case 'myprio':
            syncFunction = syncMyPrioData;
            break;
          case 'viaverde':
            syncFunction = syncViaVerdeData;
            break;
          case 'cartrack':
            syncFunction = syncCartrackData;
            break;
          default:
            console.warn(`No sync function for platform: ${platformId}`);
            return; // Pular esta integração
        }

        if (syncFunction) {
          syncPromises.push(
            syncFunction(integration.credentials)
              .then(result => {
                if (result.success) {
                  return integrationsRef.doc(platformId).update({
                    status: 'connected',
                    lastSync: new Date().toISOString(),
                    errorMessage: null,
                  });
                } else {
                  return integrationsRef.doc(platformId).update({
                    status: 'error',
                    errorMessage: result.message || 'Sync failed',
                  });
                }
              })
              .catch(e => {
                console.error(`Error during sync for ${platformId}:`, e);
                return integrationsRef.doc(platformId).update({
                  status: 'error',
                  errorMessage: e.message || 'Internal sync error',
                });
              })
          );
        }
      });

      await Promise.all(syncPromises);

      return res.status(200).json({ success: true, message: 'All active integrations sync initiated' });
    } catch (e: any) {
      console.error('Error syncing all integrations:', e);
      return res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

