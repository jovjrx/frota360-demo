import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { parse } from 'csv-parse/sync';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Set desired value here
    },
  },
};

export default withIronSessionApiRoute(async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    success?: boolean;
    message?: string;
    error?: string;
  }>,
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { weekId, fileContent } = req.body;

  if (!weekId || !fileContent) {
    return res.status(400).json({ success: false, error: 'Missing weekId or fileContent' });
  }

  try {
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const db = getFirestore(firebaseAdmin);
    const batch = db.batch();
    const rawUberRef = db.collection('raw_uber');

    for (const record of records) {
      const recordWithWeek = { ...record, weekId, importedAt: new Date().toISOString(), importedBy: user.id };
      const docRef = rawUberRef.doc();
      batch.set(docRef, recordWithWeek);
    }

    await batch.commit();

    const weekRef = db.collection('weeks').doc(weekId);
    await weekRef.set({
      weekId,
      updatedAt: new Date().toISOString(),
      sources: {
        uber: { status: 'complete', lastImport: new Date().toISOString(), importedBy: user.id },
      },
    }, { merge: true });

    return res.status(200).json({ success: true, message: 'Uber data imported successfully' });
  } catch (e: any) {
    console.error('Error importing Uber data:', e);
    return res.status(500).json({ success: false, error: e.message || 'Internal Server Error' });
  }
}, sessionOptions);

