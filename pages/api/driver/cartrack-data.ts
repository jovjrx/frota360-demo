import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { createCartrackClient } from '@/lib/integrations';

export default withIronSessionApiRoute(async function driverCartrackDataRoute(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const user = req.session.user;

  if (!user || user.role !== 'driver') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { driverId } = req.query;

  if (user.id !== driverId) {
    return res.status(403).json({ success: false, error: 'Forbidden: You can only view your own data' });
  }

  try {
    const db = getFirestore(firebaseAdmin);

    // 1. Get driver details to check Cartrack integration
    const driverDoc = await db.collection('drivers').doc(user.id).get();
    if (!driverDoc.exists) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    const driverData = driverDoc.data() as any;

    // 2. Check if Cartrack integration is enabled
    if (!driverData.integrations?.cartrack?.enabled) {
      return res.status(200).json({ 
        success: true, 
        data: null,
        message: 'Cartrack integration not enabled' 
      });
    }

    // 3. Get Cartrack credentials from integrations collection
    const cartrackIntegrationDoc = await db.collection('integrations').doc('cartrack').get();
    if (!cartrackIntegrationDoc.exists) {
      return res.status(404).json({ success: false, error: 'Cartrack integration not configured' });
    }
    const cartrackIntegration = cartrackIntegrationDoc.data() as any;

    if (!cartrackIntegration.credentials?.username || !cartrackIntegration.credentials?.apiKey) {
      return res.status(400).json({ success: false, error: 'Cartrack credentials not configured' });
    }

    // 4. Create Cartrack client
    const cartrackClient = createCartrackClient({
      username: cartrackIntegration.credentials.username,
      apiKey: cartrackIntegration.credentials.apiKey,
    });

    // 5. Get vehicle data for the driver
    // Assuming driver has a vehicle plate associated in their Cartrack integration
    const vehiclePlate = driverData.integrations.cartrack.key; // Vehicle plate or identifier
    
    if (!vehiclePlate) {
      return res.status(400).json({ success: false, error: 'Vehicle plate not configured for driver' });
    }

    // 6. Fetch vehicle information
    const vehicles = await cartrackClient.getVehicles();
    const driverVehicle = vehicles.find(v => v.plate === vehiclePlate);

    if (!driverVehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found in Cartrack' });
    }

    // 7. Calculate weekly stats (last 7 days)
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const startDate = weekAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const trips = await cartrackClient.getTrips(startDate, endDate);

    // Filter trips for this specific vehicle
    const vehicleTrips = trips.filter((trip: any) => trip.vehicle_id === driverVehicle.id);

    const weeklyStats = {
      totalKilometers: vehicleTrips.reduce((sum: number, trip: any) => sum + (trip.distance_km || 0), 0),
      totalTrips: vehicleTrips.length,
      averageSpeed: vehicleTrips.length > 0 
        ? vehicleTrips.reduce((sum: number, trip: any) => sum + (trip.average_speed || 0), 0) / vehicleTrips.length 
        : 0,
      totalDuration: vehicleTrips.reduce((sum: number, trip: any) => sum + (trip.duration_minutes || 0), 0),
    };

    const responseData = {
      vehicle: {
        plate: driverVehicle.plate,
        make: driverVehicle.make,
        model: driverVehicle.model,
        year: driverVehicle.year,
        kilometers: driverVehicle.kilometers,
        status: driverVehicle.status,
      },
      weeklyStats,
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (error: any) {
    console.error('Error fetching Cartrack data:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}, sessionOptions);

