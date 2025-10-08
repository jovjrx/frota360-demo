import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const session = await getSession(req, res);

    if (!session?.isLoggedIn || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = getFirestore();

    // Buscar configuração da integração Cartrack
    const integrationDoc = await db.collection('integrations').doc('cartrack').get();

    if (!integrationDoc.exists) {
      return res.status(200).json({
        platform: 'cartrack',
        enabled: false,
        status: 'not_configured',
        lastSync: null,
        errorMessage: 'Integração não configurada no Firestore',
      });
    }

    const integration = integrationDoc.data();

    // Buscar estatísticas recentes se a integração estiver ativa
    let stats = undefined;
    if (integration?.enabled && integration?.status === 'connected') {
      try {
        const response = await fetch(`${req.headers.host?.includes('localhost') ? 'http' : 'https'}://${req.headers.host}/api/admin/integrations/cartrack/data`);
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            stats = {
              totalTrips: data.data.count || 0,
              totalVehicles: data.data.summary?.totalVehicles || 0,
              totalDistance: data.data.summary?.totalDistance || 0,
            };
          }
        }
      } catch (error) {
        console.error('Error fetching Cartrack stats:', error);
      }
    }

    return res.status(200).json({
      platform: 'cartrack',
      enabled: integration?.enabled || false,
      status: integration?.status || 'not_configured',
      lastSync: integration?.lastSync || null,
      errorMessage: integration?.errorMessage || null,
      stats,
    });
  } catch (error) {
    console.error('Error in Cartrack status handler:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
