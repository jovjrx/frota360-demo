import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    const userSnap = await adminDb.collection('users').where('uid', '==', session.userId).limit(1).get();
    if (userSnap.empty || userSnap.docs[0].data().role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { periodStart, periodEnd, defaultCommissionPercent = 10 } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'Period start and end dates are required' });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    // Get all drivers
    const driversSnap = await adminDb.collection('drivers').get();
    const drivers = driversSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    // Get trips for the period
    const tripsSnap = await adminDb.collection('trips')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();

    const trips = tripsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    // Group trips by driver
    const tripsByDriver = trips.reduce((acc, trip: any) => {
      if (!acc[trip.driverId]) {
        acc[trip.driverId] = [];
      }
      acc[trip.driverId].push(trip);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate payouts
    const payouts = [];
    const batch = adminDb.batch();

    for (const driver of drivers) {
      const driverTrips = tripsByDriver[driver.id] || [];
      
      if (driverTrips.length === 0) continue;

      // Calculate earnings
      const grossCents = driverTrips.reduce((sum, trip: any) => sum + (trip.earnings || 0), 0) * 100;
      const commissionPercent = (driver as any).commission?.percent || defaultCommissionPercent;
      const commissionCents = Math.round(grossCents * (commissionPercent / 100));
      const feesCents = Math.round(grossCents * 0.05); // 5% platform fee
      const netCents = grossCents - commissionCents - feesCents;

      // Create payout record
      const payoutData = {
        driverId: driver.id,
        driverName: (driver as any).name,
        driverEmail: (driver as any).email,
        periodStart: startDate,
        periodEnd: endDate,
        grossCents,
        commissionCents,
        feesCents,
        netCents,
        status: 'pending',
        createdAt: new Date(),
        createdBy: session.userId,
        tripsCount: driverTrips.length,
        commissionPercent,
      };

      const payoutRef = adminDb.collection('payouts').doc();
      batch.set(payoutRef, payoutData);
      
      payouts.push({
        id: payoutRef.id,
        ...payoutData,
      });
    }

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: `Generated ${payouts.length} payouts for period ${periodStart} to ${periodEnd}`,
      payouts,
    });

  } catch (error) {
    console.error('Error calculating payouts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}