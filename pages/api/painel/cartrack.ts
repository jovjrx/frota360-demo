import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getCartrackClient } from '@/lib/cartrack';
import { getDriverById } from '@/lib/admin/adminQueries';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { driverId } = req.query;

  if (!driverId || typeof driverId !== 'string') {
    return res.status(400).json({ message: 'Driver ID is required' });
  }

  try {
    const driver = await getDriverById(driverId);

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (driver.type !== 'renter' || !driver.vehicle?.plate) {
      return res.status(403).json({ message: 'Access denied: Only renter drivers with assigned vehicles can access tracking' });
    }

    const cartrackIntegration = await adminDb.collection('integrations').doc('cartrack').get();
    const cartrackData = cartrackIntegration.data();

    if (!cartrackData || !cartrackData.username || !cartrackData.apiKey || !cartrackData.baseUrl) {
      return res.status(500).json({ message: 'Cartrack integration not configured' });
    }

    const cartrackClient = await getCartrackClient();

    const vehicleId = driver.vehicle.plate; // Usar a placa como ID do veículo para o mock

    // Fetch latest position
    const latestPosition = await cartrackClient.getLatestPosition(vehicleId);

    // Fetch trips for the last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const trips = await cartrackClient.getTrips(vehicleId, yesterday.toISOString(), now.toISOString());

    res.status(200).json({
      latestPosition,
      trips,
      vehicle: {
        plate: driver.vehicle.plate,
        model: driver.vehicle.model,
      },
    });

  } catch (error: any) {
    console.error('Error fetching Cartrack data for driver:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
