import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { DriverContractSchema } from '@/schemas/driver-contract';
import { z } from 'zod';

const bodySchema = z.object({
  fileName: z.string().min(1),
  fileContent: z.string().min(1),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session.userId || session.role !== 'driver') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

  try {
    const buffer = Buffer.from(parsed.data.fileContent, 'base64');
    const nowIso = new Date().toISOString();
    const storagePath = `contracts/signed/${session.userId}/${Date.now()}-${parsed.data.fileName}`;

    const fileRef = adminStorage.file(storagePath);
    await fileRef.save(buffer, {
      contentType: 'application/pdf',
      resumable: false,
      metadata: {
        cacheControl: 'private, max-age=0, no-transform',
      },
    });

    await fileRef.makePrivate({ strict: false }).catch(() => undefined);

    const driverContractsSnapshot = await adminDb
      .collection('driverContracts')
      .where('driverId', '==', session.userId)
      .limit(1)
      .get();

    if (driverContractsSnapshot.empty) {
      return res.status(400).json({ success: false, error: 'Contract not initialized' });
    }

    const doc = driverContractsSnapshot.docs[0];
    const contract = DriverContractSchema.parse({ id: doc.id, ...(doc.data() as Record<string, unknown>) });

    await doc.ref.update({
      signedDocumentUrl: `gs://${fileRef.bucket.name}/${storagePath}`,
      signedDocumentFileName: parsed.data.fileName,
      submittedAt: nowIso,
      status: 'submitted',
      updatedAt: nowIso,
      rejectionReason: null,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Contracts] Failed to upload signed contract:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload signed contract' });
  }
}
