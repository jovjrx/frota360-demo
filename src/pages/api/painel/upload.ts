import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { fileStorage } from '@/lib/files/storage';
import { store } from '@/lib/store';
import { auditLogger } from '@/lib/audit/logger';
import { requireDriver } from '@/lib/auth/rbac';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = requireDriver(async (req: NextApiRequest, res: NextApiResponse, context) => {
  try {
    const { driverId } = req.query;
    
    if (!driverId || typeof driverId !== 'string') {
      return res.status(400).json({ error: 'Driver ID is required' });
    }

    // Verify the driver is updating their own data
    const driver = await store.drivers.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (driver.userId !== context.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this driver' });
    }

    const form = formidable({ 
      multiples: false,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });

    const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    const file = files.file?.[0];
    const docType = fields.docType?.[0];

    if (!file || !docType) {
      return res.status(400).json({ error: 'File and document type are required' });
    }

    // Validate document type
    const validDocTypes = ['CNH', 'Certificado TVDE', 'Seguro', 'Outro'];
    if (!validDocTypes.includes(docType)) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    // Validate file type
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ error: 'Invalid file type. Only PDF, JPEG, and PNG are allowed.' });
    }

    // Upload file
    const uploadedFile = await fileStorage.uploadFile(
      {
        buffer: require('fs').readFileSync(file.filepath),
        originalName: file.originalFilename || 'document',
        mimeType: file.mimetype || 'application/octet-stream',
        size: file.size,
      },
      `documents/${driverId}`
    );

    // Update driver KYC data
    const currentKyc = driver.kyc || { docType, docNumber: '', files: [] };
    const updatedKyc = {
      ...currentKyc,
      docType,
      files: [...currentKyc.files, uploadedFile.url],
    };

    await store.drivers.update(driverId, {
      kyc: updatedKyc,
      updatedAt: Date.now(),
    });

    // Log audit trail
    await auditLogger.logDriverUpdate(
      context.user.userId!,
      context.role,
      driverId,
      { kyc: updatedKyc }
    );

    res.status(200).json({ 
      success: true,
      fileUrl: uploadedFile.url,
      message: 'Document uploaded successfully' 
    });
  } catch (error: any) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload document' });
  }
});

export default handler;

