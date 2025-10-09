import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const db = getFirestore(firebaseAdmin);

    // Get total number of drivers
    const driversSnapshot = await db.collection('drivers').get();
    const totalDrivers = driversSnapshot.size;
    const activeDrivers = driversSnapshot.docs.filter(doc => doc.data().status === 'active').length;

    // Get total number of requests by status
    const requestsSnapshot = await db.collection('driver_requests').get();
    const totalRequests = requestsSnapshot.size;
    const pendingRequests = requestsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const evaluationRequests = requestsSnapshot.docs.filter(doc => doc.data().status === 'evaluation').length;

    // Calculate current week's earnings
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (today.getDay() || 7) + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const year = weekStart.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((weekStart.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const currentWeekId = `${year}-W${weekNumber.toString().padStart(2, '0')}`;

    // Get weekly records for current week
    const weeklyRecordsSnapshot = await db.collection('driverWeeklyRecords')
      .where('weekId', '==', currentWeekId)
      .get();

    let totalEarningsThisWeek = 0;
    let totalPaymentsPending = 0;
    let totalPaymentsPaid = 0;

    weeklyRecordsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalEarningsThisWeek += data.repasse || 0;
      
      if (data.paymentStatus === 'pending') {
        totalPaymentsPending += data.repasse || 0;
      } else if (data.paymentStatus === 'paid') {
        totalPaymentsPaid += data.repasse || 0;
      }
    });

    const averageEarningsPerDriver = weeklyRecordsSnapshot.size > 0 
      ? totalEarningsThisWeek / weeklyRecordsSnapshot.size 
      : 0;

    // Get recent drivers (e.g., last 5 added)
    const recentDriversSnapshot = await db.collection('drivers').orderBy('createdAt', 'desc').limit(5).get();
    const recentDrivers = recentDriversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get recent requests (e.g., last 5 added)
    const recentRequestsSnapshot = await db.collection('driver_requests').orderBy('createdAt', 'desc').limit(5).get();
    const recentRequests = recentRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalDrivers,
          activeDrivers,
          totalRequests,
          pendingRequests,
          evaluationRequests,
          totalEarningsThisWeek,
          totalPaymentsPending,
          totalPaymentsPaid,
          averageEarningsPerDriver,
        },
        recentDrivers,
        recentRequests,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}

