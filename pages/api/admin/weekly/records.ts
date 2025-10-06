import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb as db } from '@/lib/firebaseAdmin';

/**
 * GET /api/admin/weekly/records?week=2024-W40
 * Retorna registros semanais de motoristas
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { week } = req.query;

    if (!week || typeof week !== 'string') {
      return res.status(400).json({ error: 'week é obrigatório' });
    }

    // Buscar registros da semana
    const recordsSnapshot = await db
      .collection('driverWeeklyRecords')
      .where('weekId', '==', week)
      .get();

    const records = recordsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    });

    // Buscar informações dos motoristas
    const driverIds = [...new Set(records.map((r: any) => r.driverId))];
    const driversMap = new Map();

    for (const driverId of driverIds) {
      const driverDoc = await db.collection('drivers').doc(driverId).get();
      if (driverDoc.exists) {
        driversMap.set(driverId, driverDoc.data());
      }
    }

    // Enriquecer registros com dados dos motoristas
    const enrichedRecords = records.map((record: any) => ({
      ...record,
      driver: driversMap.get(record.driverId) || null,
    }));

    return res.status(200).json({ records: enrichedRecords });
  } catch (error) {
    console.error('Erro ao buscar registros:', error);
    return res.status(500).json({ error: 'Erro ao buscar registros' });
  }
}
