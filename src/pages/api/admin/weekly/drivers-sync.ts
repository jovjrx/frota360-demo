import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { weekId } = req.query;

    if (!weekId || typeof weekId !== 'string') {
      return res.status(400).json({ error: 'weekId is required' });
    }

    // Fetch all drivers
    const driversSnapshot = await adminDb.collection('drivers').where('isActive', '==', true).get();
    const drivers: any[] = [];

    for (const doc of driversSnapshot.docs) {
      const driver = doc.data();

      // Check if payment was generated for this week
      const paymentSnapshot = await adminDb
        .collection('driverPayments')
        .where('weekId', '==', weekId)
        .where('driverId', '==', driver.id)
        .limit(1)
        .get();

      const hasPaymentGenerated = !paymentSnapshot.empty;

      // Get dataWeekly records for this driver
      const weeklySnapshot = await adminDb
        .collection('dataWeekly')
        .where('weekId', '==', weekId)
        .where('driverId', '==', driver.id)
        .get();

      const integrations = [
        { platform: 'uber', label: 'Uber', statusKey: 'uberStatus' },
        { platform: 'bolt', label: 'Bolt', statusKey: 'boltStatus' },
        { platform: 'myprio', label: 'MyPrio', statusKey: 'myprioStatus' },
        { platform: 'viaverde', label: 'ViaVerde', statusKey: 'viaverdeStatus' },
      ].map((int) => {
        const weeklyData = weeklySnapshot.docs.find(doc => {
          const data = doc.data();
          return data.platform === int.platform;
        });

        let status: 'synced' | 'pending' | 'error' = 'pending';
        let source: 'api' | 'upload' | 'pending' = 'pending';

        if (weeklyData) {
          const data = weeklyData.data();
          status = 'synced';
          source = data.source || 'api'; // api, upload, ou manual
        }

        return {
          platform: int.platform as 'uber' | 'bolt' | 'myprio' | 'viaverde',
          name: int.platform,
          label: int.label,
          status,
          source,
          recordCount: weeklyData ? weeklyData.data().recordCount || 0 : 0,
          lastSync: weeklyData ? weeklyData.data().lastSync : undefined,
        };
      });

      drivers.push({
        driverId: driver.id,
        driverName: driver.name || driver.fullName,
        type: driver.type || 'affiliate',
        integrations,
        hasPaymentGenerated,
      });
    }

    res.status(200).json({ drivers });
  } catch (error: any) {
    console.error('[API] Erro ao buscar drivers sync:', error);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
