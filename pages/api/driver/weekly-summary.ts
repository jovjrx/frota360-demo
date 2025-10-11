import type { NextApiResponse } from 'next';
import { SessionRequest } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { getWeekDates } from '@/lib/utils/date-helpers';
import { DriverWeeklyRecord, createDriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { WeeklyDriverPlatformData } from '@/schemas/weekly-driver-platform-data';
import { Driver } from '@/schemas/driver';

export default withIronSessionApiRoute(async function driverWeeklySummaryRoute(req: SessionRequest, res: NextApiResponse) {
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
    const driverData = driverDoc.data() as Driver;

    // 2. Find the latest week with data for this driver
    // For now, let's assume we fetch data for a specific week based on query parameter or a default.
    const { weekId: queryWeekId } = req.query;
    const currentWeekId = queryWeekId ? String(queryWeekId) : '2025-W40'; // Example default weekId

    // 3. Fetch WeeklyDriverPlatformData for the driver for the current week
    const platformDataSnapshot = await db.collection('weeklyDriverPlatformData')
      .where('driverId', '==', user.id)
      .where('weekId', '==', currentWeekId)
      .get();

    const platformData: { [platform: string]: number } = {};
    platformDataSnapshot.forEach(doc => {
      const data = doc.data() as WeeklyDriverPlatformData;
      platformData[data.platform] = data.totalValue;
    });

    // 4. Fetch DriverWeeklyRecord if it exists, otherwise create a new one
    const driverWeeklyRecordDoc = await db.collection('weeklyReports').doc(`${user.id}_${currentWeekId}`).get();
    let driverWeeklyRecord: DriverWeeklyRecord;

    if (driverWeeklyRecordDoc.exists) {
      driverWeeklyRecord = driverWeeklyRecordDoc.data() as DriverWeeklyRecord;
    } else {
      // If no record exists, create a new one with default values and calculated fields
      const { start: weekStart, end: weekEnd } = getWeekDates(currentWeekId);
      driverWeeklyRecord = createDriverWeeklyRecord({
        id: `${user.id}_${currentWeekId}`,
        driverId: user.id,
        driverName: driverData.fullName,
        driverEmail: driverData.email,
        weekId: currentWeekId,
        weekStart,
        weekEnd,
        isLocatario: driverData.type === 'renter',
        aluguel: driverData.type === 'renter' ? (driverData.rentalFee || 0) : 0,
      }, platformData, { type: driverData.type, rentalFee: driverData.rentalFee });
    }

    try {
      // Adicionar juros de financiamentos ativos do motorista
      const finSnap = await db
        .collection('financing')
        .where('driverId', '==', user.id)
        .where('status', '==', 'active')
        .get();
      let totalInterest = 0;
      finSnap.docs.forEach((doc) => {
        const fin = doc.data() as any;
        if (typeof fin.remainingWeeks === 'number' && fin.remainingWeeks <= 0) return;
        const interest = fin.weeklyInterest || 0;
        if (interest > 0) totalInterest += interest;
      });
      if (totalInterest > 0) {
        driverWeeklyRecord.despesasAdm += totalInterest;
        driverWeeklyRecord.repasse -= totalInterest;
      }
    } catch (e) {
      console.error('Erro ao ajustar resumo semanal com juros de financiamento:', e);
    }
    return res.status(200).json({ success: true, data: driverWeeklyRecord });
  } catch (error: any) {
    console.error('Error fetching driver weekly summary:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}, sessionOptions);

