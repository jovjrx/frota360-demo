import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { weekId, platform } = req.body;

    if (!weekId || !platform) {
      return res.status(400).json({ error: 'weekId and platform are required' });
    }

    // Check if payments were already generated
    const paymentsSnapshot = await adminDb
      .collection('driverPayments')
      .where('weekId', '==', weekId)
      .limit(1)
      .get();

    if (!paymentsSnapshot.empty) {
      return res.status(403).json({ 
        error: 'Pagamentos já foram gerados. Não é possível reprocessar.' 
      });
    }

    // Delete existing dataWeekly for this platform+week
    const existingSnapshot = await adminDb
      .collection('dataWeekly')
      .where('weekId', '==', weekId)
      .where('platform', '==', platform)
      .get();

    const batch = adminDb.batch();

    existingSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    // Call integration sync API for this specific platform
    const syncResponse = await fetch('http://localhost:3000/api/admin/integrations/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekId, platform }),
    }).catch(() => null);

    res.status(200).json({ 
      success: true,
      message: `${platform} reprocessado com sucesso para a semana ${weekId}`
    });
  } catch (error: any) {
    console.error('[API] Erro ao reprocessar integração:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
