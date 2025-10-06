import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getFirestore } from 'firebase-admin/firestore';
import { UpdateDriverSchema } from '@/schemas/driver';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getSession(req, res);
    if (!session?.isLoggedIn) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { driverId } = req.query;

    if (!driverId || typeof driverId !== 'string') {
      return res.status(400).json({ error: 'driverId é obrigatório' });
    }

    const db = getFirestore();
    const driverRef = db.collection('drivers').doc(driverId);

    if (req.method === 'GET') {
      // Buscar motorista
      const doc = await driverRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Motorista não encontrado' });
      }

      return res.status(200).json({
        id: doc.id,
        ...doc.data(),
      });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      // Atualizar motorista
      const doc = await driverRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Motorista não encontrado' });
      }

      // Validar dados
      const validationResult = UpdateDriverSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: validationResult.error.issues,
        });
      }

      const updates = {
        ...validationResult.data,
        updatedAt: new Date().toISOString(),
      };

      await driverRef.update(updates);

      const updatedDoc = await driverRef.get();

      return res.status(200).json({
        id: updatedDoc.id,
        ...updatedDoc.data(),
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in driver API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
