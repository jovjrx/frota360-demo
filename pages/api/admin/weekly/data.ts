import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { WeeklyDriverPlatformData } from '@/schemas/weekly-driver-platform-data';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { weekId } = req.query;

  if (!weekId || typeof weekId !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid weekId' });
  }

  try {
    const db = adminDb;

    // Fetch all DriverWeeklyRecords for the given weekId
    const weeklyRecordsSnapshot = await db.collection('weeklyReports')
      .where('weekId', '==', weekId)
      .get();

    const weeklyRecords: DriverWeeklyRecord[] = [];
    weeklyRecordsSnapshot.forEach(doc => {
      weeklyRecords.push({ id: doc.id, ...doc.data() as DriverWeeklyRecord });
    });

    // Fetch all WeeklyDriverPlatformData for the given weekId
    const platformDataSnapshot = await db.collection('weeklyDriverPlatformData')
      .where('weekId', '==', weekId)
      .get();

    const platformData: WeeklyDriverPlatformData[] = [];
    platformDataSnapshot.forEach(doc => {
      platformData.push({ id: doc.id, ...doc.data() as WeeklyDriverPlatformData });
    });

    return res.status(200).json({ weeklyRecords, platformData });
  } catch (error: any) {
    console.error('Error fetching weekly data:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

