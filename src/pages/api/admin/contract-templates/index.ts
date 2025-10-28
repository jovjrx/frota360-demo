import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { SessionRequest, withIronSessionApiRoute } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const parseForm = async (req: NextApiRequest) => {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fields, files } = await parseForm(req) as any;
    const file = files.file?.[0];
    const name = fields.name?.[0] || file?.originalFilename;
    const type = fields.type?.[0] || 'affiliate';

    if (!file || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getFirestore(firebaseAdmin);
    const storage = getStorage(firebaseAdmin);

    // Upload file to Firebase Storage
    const fileName = `contracts/${Date.now()}_${file.originalFilename}`;
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);

    const fileData = fs.readFileSync(file.filepath);
    await fileRef.save(fileData, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    const [downloadUrl] = await fileRef.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    });

    // Save metadata to Firestore
    const docRef = await db.collection('contractTemplates').add({
      type,
      category: '',
      version: '1.0',
      fileName: name,
      fileUrl: downloadUrl,
      storagePath: fileName,
      uploadedBy: user.id,
      uploadedAt: Timestamp.now().toDate().toISOString(),
      isActive: true,
    });

    fs.unlinkSync(file.filepath);

    return res.json({
      id: docRef.id,
      message: 'Template added successfully',
    });
  } catch (error: any) {
    console.error('[POST /api/admin/contract-templates]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
