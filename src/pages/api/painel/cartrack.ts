import { NextApiRequest, NextApiResponse } from 'next';
import { createCartrackClient } from '@/lib/integrations';
import { getDriverById } from '@/lib/admin/adminQueries';

const normalizePlate = (value?: string | null) => (value || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();

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

    const cartrackClient = await createCartrackClient();

    const vehiclePlate = driver.vehicle?.plate;
    if (!vehiclePlate) {
      return res.status(400).json({ message: 'Driver vehicle plate not configured' });
    }

    const normalizedPlate = normalizePlate(vehiclePlate);
    const vehicles = await cartrackClient.getVehicles();
    const cartrackVehicle = vehicles.find((vehicle) => normalizePlate(vehicle.plate) === normalizedPlate);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const startDate = yesterday.toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const trips = await cartrackClient.getTrips(startDate, endDate, {
      registration: normalizedPlate,
      vehicleId: cartrackVehicle?.id,
    });

    const latestPosition = await cartrackClient.getLatestVehiclePosition(normalizedPlate);

    res.status(200).json({
      latestPosition,
      trips,
      vehicle: {
        plate: vehiclePlate,
        model: driver.vehicle?.model ?? null,
        cartrackId: cartrackVehicle?.id ?? null,
        status: cartrackVehicle?.status ?? null,
      },
    });

  } catch (error: any) {
    console.error('Error fetching Cartrack data for driver:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

