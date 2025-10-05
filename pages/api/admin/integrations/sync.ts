import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Buscar todas as integrações conectadas
      const integrationsSnapshot = await adminDb
        .collection('integrations')
        .where('status', '==', 'connected')
        .get();

      const syncResults = [];

      // Atualizar lastSync para cada integração conectada
      for (const doc of integrationsSnapshot.docs) {
        await adminDb.collection('integrations').doc(doc.id).update({
          lastSync: new Date().toISOString(),
          status: 'connected',
        });

        syncResults.push({
          id: doc.id,
          name: doc.data().name,
          synced: true,
        });
      }

      return res.status(200).json({ 
        success: true,
        synced: syncResults.length,
        results: syncResults,
      });
    } catch (error) {
      console.error('Error syncing integrations:', error);
      return res.status(500).json({ error: 'Erro ao sincronizar integrações' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
