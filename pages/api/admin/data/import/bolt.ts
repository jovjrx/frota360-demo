
import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';
import { parse } from 'csv-parse/sync';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Set desired value here
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    success?: boolean;
    message?: string;
    error?: string;
  }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = await getSession(req, res);

  if (!session?.isLoggedIn || session.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { weekId, fileContent } = req.body;

  if (!weekId || !fileContent) {
    return res.status(400).json({ error: 'Missing weekId or fileContent' });
  }

  try {
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const db = getFirestore();
    const batch = db.batch();
    const rawBoltRef = db.collection('raw_bolt');

    for (const record of records) {
      const recordWithWeek = { ...record, weekId, importedAt: new Date().toISOString() };
      const docRef = rawBoltRef.doc();
      batch.set(docRef, recordWithWeek);
    }

    await batch.commit();

    const weekRef = db.collection('weeks').doc(weekId);
    await weekRef.set({
      weekId,
      updatedAt: new Date().toISOString(),
      sources: {
        bolt: { status: 'complete', lastImport: new Date().toISOString() },
      },
    }, { merge: true });

    return res.status(200).json({ success: true, message: 'Bolt data imported successfully' });
  } catch (e: any) {
    console.error('Error importing Bolt data:', e);
    return res.status(500).json({ error: e.message || 'Internal Server Error' });
  }
}

