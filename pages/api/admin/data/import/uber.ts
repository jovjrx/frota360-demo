
import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';
import { parse } from 'csv-parse/sync';
import { adminDb } from '@/lib/firebaseAdmin';

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
    const rawUberRef = db.collection('raw_uber');

    for (const record of records) {
      // Adicionar weekId ao registro antes de salvar
      const recordWithWeek = { ...record, weekId, importedAt: new Date().toISOString() };
      const docRef = rawUberRef.doc(); // Firestore gera um ID único
      batch.set(docRef, recordWithWeek);
    }

    await batch.commit();

    // Atualizar status da semana na collection 'weeks'
    const weekRef = db.collection('weeks').doc(weekId);
    await weekRef.set({
      weekId,
      updatedAt: new Date().toISOString(),
      sources: {
        uber: { status: 'complete', lastImport: new Date().toISOString() },
      },
    }, { merge: true });

    return res.status(200).json({ success: true, message: 'Uber data imported successfully' });
  } catch (e: any) {
    console.error('Error importing Uber data:', e);
    return res.status(500).json({ error: e.message || 'Internal Server Error' });
  }
}

