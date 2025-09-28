import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse form data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ mimetype }) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        return allowedTypes.includes(mimetype || '');
      },
    });

    const [fields, files] = await form.parse(req);
    
    const documentType = Array.isArray(fields.documentType) ? fields.documentType[0] : fields.documentType;
    const driverId = Array.isArray(fields.driverId) ? fields.driverId[0] : fields.driverId;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!documentType || !driverId || !file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify driver ownership
    const driverSnap = await adminDb.collection('drivers').where('uid', '==', session.userId).limit(1).get();
    if (driverSnap.empty || driverSnap.docs[0].id !== driverId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Read file
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileName = `${driverId}_${documentType}_${Date.now()}.${file.originalFilename?.split('.').pop()}`;
    
    // In a real implementation, you would upload to Firebase Storage or AWS S3
    // For now, we'll just save the document record to Firestore
    const documentData = {
      driverId,
      type: documentType,
      fileName: file.originalFilename,
      mimeType: file.mimetype,
      size: file.size,
      status: 'pending',
      uploadedAt: new Date(),
      uploadedBy: session.userId,
    };

    const docRef = await adminDb.collection('driver_documents').add(documentData);

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      documentId: docRef.id,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
