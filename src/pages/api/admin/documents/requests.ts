import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { SessionRequest, withIronSessionApiRoute } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';
import type { DocumentRequest, DocumentRequestStats } from '@/schemas/document-request';

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res, user);
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

async function handleGet(
  req: SessionRequest,
  res: NextApiResponse
) {
  try {
    const db = getFirestore(firebaseAdmin);
    const { search, status, limit = 50, offset = 0 } = req.query;

    const limitNum = Math.min(Number(limit) || 50, 500);
    const offsetNum = Number(offset) || 0;

    let query = db.collection('documentRequests') as any;

    if (status && status !== 'all') {
      query = query.where('status', '==', status as string);
    }

    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .offset(offsetNum)
      .limit(limitNum)
      .get();

    let documents = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...(doc.data() as Omit<DocumentRequest, 'id'>),
    }));

    if (search) {
      const searchLower = (search as string).toLowerCase();
      documents = documents.filter(
        (d) =>
          d.driverName?.toLowerCase().includes(searchLower) ||
          d.documentName?.toLowerCase().includes(searchLower) ||
          d.driverEmail?.toLowerCase().includes(searchLower)
      );
    }

    const allDocsSnapshot = await db.collection('documentRequests').get();
    const allDocs = allDocsSnapshot.docs.map((doc) => doc.data() as DocumentRequest);

    const stats: DocumentRequestStats = {
      total: allDocs.length,
      pending: allDocs.filter((d) => d.status === 'pending').length,
      submitted: allDocs.filter((d) => d.status === 'submitted').length,
      approved: allDocs.filter((d) => d.status === 'approved').length,
      rejected: allDocs.filter((d) => d.status === 'rejected').length,
      overdue: allDocs.filter(
        (d) =>
          d.status === 'pending' &&
          d.dueDate &&
          d.dueDate < Date.now()
      ).length,
      resubmissionNeeded: allDocs.filter((d) => d.status === 'rejected').length,
    };

    const serialized = serializeDatasets({ documents });

    return res.json({
      data: serialized.documents,
      stats,
      total: documents.length,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/documents/requests]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  user: any
) {
  try {
    const db = getFirestore(firebaseAdmin);
    const storage = getStorage(firebaseAdmin);

    // Parse FormData
    const formidable = require('formidable');
    const form = new formidable.IncomingForm();

    return new Promise<void>((resolve) => {
      form.parse(req, async (err: any, fields: any, files: any) => {
        try {
          if (err) {
            res.status(400).json({ error: 'Failed to parse form' });
            return resolve();
          }

          const categoryId = fields.categoryId?.[0] || '';
          const documentName = fields.documentName?.[0] || '';
          const driverId = fields.driverId?.[0] || '';
          const status = fields.status?.[0] || 'approved';
          const file = files.file?.[0];

          if (!categoryId || !documentName || !file) {
            res.status(400).json({ error: 'Missing required fields' });
            return resolve();
          }

          // Get category
          const categoryDoc = await db.collection('documentCategories').doc(categoryId).get();
          if (!categoryDoc.exists) {
            res.status(404).json({ error: 'Category not found' });
            return resolve();
          }
          const category = categoryDoc.data() as any;

          // Get driver if provided
          let driverData: any = null;
          if (driverId) {
            const driverDoc = await db.collection('drivers').doc(driverId).get();
            if (driverDoc.exists) {
              driverData = driverDoc.data();
            }
          }

          // Upload file to Firebase Storage
          const timestamp = Date.now();
          const bucket = storage.bucket();
          const filePath = `documents/${timestamp}_${file.originalFilename}`;
          const fileStream = require('fs').createReadStream(file.filepath);

          await bucket.upload(file.filepath, {
            destination: filePath,
            metadata: {
              contentType: file.mimetype,
            },
          });

          // Get signed URL
          const signedUrl = await bucket.file(filePath).getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
          });

          // Create document request
          const docRef = await db.collection('documentRequests').add({
            categoryId,
            categoryName: category.name,
            driverId: driverId || null,
            driverName: driverData?.name || null,
            driverEmail: driverData?.email || null,
            documentName,
            fileUrl: signedUrl[0],
            storagePath: filePath,
            status,
            createdBy: user.id,
            createdByName: user.name,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          res.json({
            id: docRef.id,
            message: 'Document created successfully',
            status,
          });
          resolve();
        } catch (error: any) {
          console.error('[POST /api/admin/documents/requests]', error);
          res.status(500).json({ error: error.message || 'Internal server error' });
          resolve();
        }
      });
    });
  } catch (error: any) {
    console.error('[POST /api/admin/documents/requests]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
