import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Buscar todas as integrações do Firestore
      const integrationsSnapshot = await adminDb.collection('integrations').get();
      
      const integrations = integrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ integrations });
    } catch (error) {
      console.error('Error fetching integrations:', error);
      return res.status(500).json({ error: 'Erro ao buscar integrações' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
