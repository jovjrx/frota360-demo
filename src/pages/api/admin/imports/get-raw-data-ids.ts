import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { RawFileArchiveEntry } from '@/schemas/raw-file-archive';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { weekId } = req.query;

  if (!weekId || typeof weekId !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid weekId' });
  }

  try {
    const rawDataSnapshot = await adminDb.collection('rawFileArchive')
      .where('weekId', '==', weekId)
      .get();

    const rawDataDocIds: string[] = [];
    rawDataSnapshot.forEach(doc => {
      const entry = doc.data() as RawFileArchiveEntry;
      if (!entry.processed) { // Apenas arquivos não processados
        rawDataDocIds.push(doc.id);
      }
    });

    return res.status(200).json({ rawDataDocIds });
  } catch (error: any) {
    console.error('Error fetching raw data doc IDs:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}


