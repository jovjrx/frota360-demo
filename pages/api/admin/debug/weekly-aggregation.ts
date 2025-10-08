import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const session = await getSession(req, res);

    if (!session?.isLoggedIn || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const weekId = '2025-W40'; // Semana atual das imagens

    // Buscar dados MyPrio da semana
    const myprioSnapshot = await adminDb
      .collection('dataWeekly')
      .where('weekId', '==', weekId)
      .where('platform', '==', 'myprio')
      .get();

    const myprioData = myprioSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Buscar motoristas
    const driversSnapshot = await adminDb.collection('drivers').get();
    const drivers = driversSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().fullName || doc.data().name,
      myprioKey: doc.data().integrations?.myprio?.key,
    }));

    // Buscar registros semanais processados
    const recordsSnapshot = await adminDb
      .collection('driverWeeklyRecords')
      .where('weekId', '==', weekId)
      .get();

    const records = recordsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        driverId: data.driverId,
        driverName: data.driverName,
        combustivel: data.combustivel,
        platformData: data.platformData || [],
      };
    });

    // Fazer o mapeamento manual para debug
    const yuriDriver = drivers.find(d => d.myprioKey === '7824736068450001');
    const wedsonDriver = drivers.find(d => d.myprioKey === '7824736068450002');

    const yuriData = myprioData.filter(d => d.referenceId === '7824736068450001');
    const wedsonData = myprioData.filter(d => d.referenceId === '7824736068450002');

    const yuriRecord = records.find(r => r.driverId === yuriDriver?.id);
    const wedsonRecord = records.find(r => r.driverId === wedsonDriver?.id);

    return res.status(200).json({
      weekId,
      drivers: {
        yuri: yuriDriver,
        wedson: wedsonDriver,
      },
      rawMyprioData: {
        yuri: yuriData,
        wedson: wedsonData,
      },
      processedRecords: {
        yuri: yuriRecord,
        wedson: wedsonRecord,
      },
      yuriPlatformDataReferences: yuriRecord?.platformData?.filter((p: any) => p.platform === 'myprio'),
      wedsonPlatformDataReferences: wedsonRecord?.platformData?.filter((p: any) => p.platform === 'myprio'),
    });
  } catch (error: any) {
    console.error('Error in weekly aggregation debug:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
