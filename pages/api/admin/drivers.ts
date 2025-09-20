import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { driverId } = req.query;

    // Se um ID específico foi fornecido, buscar apenas esse motorista
    if (driverId && typeof driverId === 'string') {
      const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
      
      if (!driverDoc.exists) {
        return res.status(404).json({ error: 'Motorista não encontrado' });
      }

      const driverData = driverDoc.data();
      const driver = {
        id: driverDoc.id,
        name: driverData?.name || 'Nome não informado',
        email: driverData?.email || '—',
        active: driverData?.active !== false, // Default true
        weeklyEarnings: driverData?.weeklyEarnings || 0,
        monthlyEarnings: driverData?.monthlyEarnings || 0,
        statusUpdatedAt: driverData?.statusUpdatedAt,
        statusUpdatedBy: driverData?.statusUpdatedBy,
        ...driverData, // Incluir todos os outros campos
      };

      return res.status(200).json(driver);
    }

    // Caso contrário, buscar todos os motoristas
    const driversSnap = await adminDb.collection('drivers').get();
    
    const drivers = driversSnap.docs.map((doc: any) => ({
      id: doc.id,
      name: doc.data()?.name || 'Nome não informado',
      email: doc.data()?.email || '—',
      active: doc.data()?.active !== false, // Default true
      weeklyEarnings: doc.data()?.weeklyEarnings || 0,
      monthlyEarnings: doc.data()?.monthlyEarnings || 0,
      statusUpdatedAt: doc.data()?.statusUpdatedAt,
      statusUpdatedBy: doc.data()?.statusUpdatedBy,
    }));

    return res.status(200).json(drivers);

  } catch (error) {
    console.error('Erro ao buscar motoristas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
