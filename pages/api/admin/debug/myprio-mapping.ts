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

    // Buscar todos os motoristas
    const driversSnapshot = await adminDb.collection('drivers').get();
    const drivers = driversSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().fullName || doc.data().name || 'Sem nome',
      myprioKey: doc.data().integrations?.myprio?.key || null,
      vehiclePlate: doc.data().vehicle?.plate || doc.data().integrations?.viaverde?.key || null,
    }));

    // Buscar dados da última semana do dataWeekly (MyPrio)
    const dataWeeklySnapshot = await adminDb
      .collection('dataWeekly')
      .where('platform', '==', 'myprio')
      .orderBy('weekId', 'desc')
      .limit(50)
      .get();

    const myprioData = dataWeeklySnapshot.docs.map((doc) => ({
      id: doc.id,
      weekId: doc.data().weekId,
      referenceId: doc.data().referenceId,
      referenceLabel: doc.data().referenceLabel,
      totalValue: doc.data().totalValue,
      driverId: doc.data().driverId || null,
    }));

    // Criar mapeamento
    const myprioKeyMap = new Map<string, any>();
    const plateMap = new Map<string, any>();

    drivers.forEach((driver) => {
      if (driver.myprioKey) {
        const normalizedKey = String(driver.myprioKey).trim().toLowerCase();
        myprioKeyMap.set(normalizedKey, driver);
      }
      if (driver.vehiclePlate) {
        const normalizedPlate = String(driver.vehiclePlate).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        plateMap.set(normalizedPlate, driver);
      }
    });

    // Analisar cada registro MyPrio
    const analysis = myprioData.map((entry) => {
      const normalizedRefId = String(entry.referenceId || '').trim().toLowerCase();
      const normalizedRefLabel = String(entry.referenceLabel || entry.referenceId || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

      const matchByKey = myprioKeyMap.get(normalizedRefId);
      const matchByPlate = plateMap.get(normalizedRefLabel);

      return {
        weekId: entry.weekId,
        referenceId: entry.referenceId,
        referenceLabel: entry.referenceLabel,
        totalValue: entry.totalValue,
        driverId: entry.driverId,
        normalizedRefId,
        normalizedRefLabel,
        matchedByKey: matchByKey ? { id: matchByKey.id, name: matchByKey.name } : null,
        matchedByPlate: matchByPlate ? { id: matchByPlate.id, name: matchByPlate.name } : null,
        finalMatch: matchByKey || matchByPlate || null,
      };
    });

    return res.status(200).json({
      drivers,
      myprioKeyMap: Array.from(myprioKeyMap.entries()).map(([key, driver]) => ({
        key,
        driverId: driver.id,
        driverName: driver.name,
      })),
      plateMap: Array.from(plateMap.entries()).map(([key, driver]) => ({
        key,
        driverId: driver.id,
        driverName: driver.name,
      })),
      myprioData,
      analysis,
    });
  } catch (error: any) {
    console.error('Error in MyPrio mapping debug:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
