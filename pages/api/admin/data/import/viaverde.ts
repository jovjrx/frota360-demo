import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import ExcelJS from 'exceljs';

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

  const { weekId, fileContentBase64 } = req.body; // Expect base64 encoded XLSX

  if (!weekId || !fileContentBase64) {
    return res.status(400).json({ success: false, error: 'Missing weekId or fileContentBase64' });
  }

  try {
    const buffer = Buffer.from(fileContentBase64, 'base64');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('No worksheet found in the Excel file');
    }

    const records: any[] = [];
    const header: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell) => header.push(cell.value ? String(cell.value).trim() : ''));
      } else {
        const rowData: { [key: string]: any } = {};
        row.eachCell((cell, colNumber) => {
          if (header[colNumber - 1]) {
            rowData[header[colNumber - 1]] = cell.value;
          }
        });
        if (Object.keys(rowData).length > 0) {
          records.push(rowData);
        }
      }
    });

    const db = getFirestore(firebaseAdmin);
    const batch = db.batch();
    const rawViaVerdeRef = db.collection('raw_viaverde');

    for (const record of records) {
      const recordWithWeek = { ...record, weekId, importedAt: new Date().toISOString(), importedBy: user.id };
      const docRef = rawViaVerdeRef.doc();
      batch.set(docRef, recordWithWeek);
    }

    await batch.commit();

    const weekRef = db.collection('weeks').doc(weekId);
    await weekRef.set({
      weekId,
      updatedAt: new Date().toISOString(),
      sources: {
        viaverde: { status: 'complete', lastImport: new Date().toISOString(), importedBy: user.id },
      },
    }, { merge: true });

    return res.status(200).json({ success: true, message: 'Via Verde data imported successfully' });
  } catch (e: any) {
    console.error('Error importing Via Verde data:', e);
    return res.status(500).json({ success: false, error: e.message || 'Internal Server Error' });
  }
}, sessionOptions);

