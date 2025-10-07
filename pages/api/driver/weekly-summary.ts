import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { DriverWeeklySummary } from '@/types'; // Assuming this type is defined

export default withIronSessionApiRoute(async function driverWeeklySummaryRoute(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const user = req.session.user;

  if (!user || user.role !== 'driver') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { driverId } = req.query;

  if (user.id !== driverId) {
    return res.status(403).json({ success: false, error: 'Forbidden: You can only view your own summary' });
  }

  try {
    const db = getFirestore(firebaseAdmin);

    // 1. Get driver details to check integrations
    const driverDoc = await db.collection('drivers').doc(user.id).get();
    if (!driverDoc.exists) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    const driverData = driverDoc.data() as any; // Cast to any for now, refine with Driver type later

    // 2. Find the latest week with data for this driver
    // This is a simplified approach. In a real app, you'd have a 'processed_weeks' collection
    // or a more robust way to determine the 'latest week'.
    // For now, let's assume we fetch data for a recent fixed week or dynamically find it.
    // For this example, we'll simulate fetching data for a specific week.
    const latestWeekStart = '2025-09-29'; // Example: Last week's start date
    const latestWeekEnd = '2025-10-05';   // Example: Last week's end date

    // 3. Fetch raw data for the driver for the latest week
    let grossEarnings = 0;
    let totalExpenses = 0;
    let uberEarnings = 0;
    let boltEarnings = 0;
    let prioExpenses = 0;
    let viaverdeExpenses = 0;

    // Fetch Uber earnings
    if (driverData.integrations?.uber?.enabled && driverData.integrations?.uber?.key) {
      const uberSnapshot = await db.collection('raw_uber')
        .where('driverId', '==', driverData.integrations.uber.key)
        .where('weekStart', '==', latestWeekStart)
        .get();
      uberSnapshot.forEach(doc => {
        uberEarnings += doc.data().grossEarnings || 0;
      });
    }

    // Fetch Bolt earnings
    if (driverData.integrations?.bolt?.enabled && driverData.integrations?.bolt?.key) {
      const boltSnapshot = await db.collection('raw_bolt')
        .where('driverEmail', '==', driverData.integrations.bolt.key)
        .where('weekStart', '==', latestWeekStart)
        .get();
      boltSnapshot.forEach(doc => {
        boltEarnings += doc.data().grossEarnings || 0;
      });
    }

    // Fetch Prio expenses
    if (driverData.integrations?.myprio?.enabled && driverData.integrations?.myprio?.key) {
      const prioSnapshot = await db.collection('raw_prio')
        .where('cardNumber', '==', driverData.integrations.myprio.key)
        .where('transactionDate', '>=', latestWeekStart)
        .where('transactionDate', '<=', latestWeekEnd)
        .get();
      prioSnapshot.forEach(doc => {
        prioExpenses += doc.data().amount || 0;
      });
    }

    // Fetch Via Verde expenses
    if (driverData.integrations?.viaverde?.enabled && driverData.integrations?.viaverde?.key) {
      const viaverdeSnapshot = await db.collection('raw_viaverde')
        .where('licensePlate', '==', driverData.integrations.viaverde.key)
        .where('transactionDate', '>=', latestWeekStart)
        .where('transactionDate', '<=', latestWeekEnd)
        .get();
      viaverdeSnapshot.forEach(doc => {
        viaverdeExpenses += doc.data().amount || 0;
      });
    }

    grossEarnings = uberEarnings + boltEarnings;
    totalExpenses = prioExpenses + viaverdeExpenses; // Simplified, actual expenses include admin fees, IVA, etc.

    // Apply Conduz.pt specific calculations (IVA, Admin Fees, Rent)
    const ivaRate = 0.06; // 6% IVA
    const adminFeeRate = 0.07; // 7% Admin Fee
    const rent = driverData.type === 'renter' ? (driverData.rentAmount || 290) : 0; // Example rent

    const earningsAfterIVA = grossEarnings / (1 + ivaRate);
    const ivaAmount = grossEarnings - earningsAfterIVA;
    const adminFee = earningsAfterIVA * adminFeeRate;

    totalExpenses += ivaAmount + adminFee + rent;

    const netEarnings = grossEarnings - totalExpenses;

    const summary: DriverWeeklySummary = {
      weekStart: latestWeekStart,
      weekEnd: latestWeekEnd,
      grossEarnings: grossEarnings,
      netEarnings: netEarnings,
      totalExpenses: totalExpenses,
      uberEarnings: uberEarnings,
      boltEarnings: boltEarnings,
      prioExpenses: prioExpenses,
      viaverdeExpenses: viaverdeExpenses,
      ivaAmount: ivaAmount,
      adminFee: adminFee,
      rent: rent,
      // Add other relevant fields
    };

    return res.status(200).json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Error fetching driver weekly summary:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}, sessionOptions);

