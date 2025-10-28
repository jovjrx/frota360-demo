import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { ContractTemplateSchema } from '@/schemas/contract-template';
import { z } from 'zod';

const querySchema = z.object({
  type: z.enum(['affiliate', 'renter']).optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session.userId || session.role !== 'driver') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const parsedQuery = querySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({ success: false, error: 'Invalid query' });
  }

  const { type } = parsedQuery.data;

  try {
    let targetType = type;
    if (!targetType) {
      const driverDoc = await adminDb.collection('drivers').doc(session.userId).get();
      const driverData = driverDoc.data() as Record<string, any> | undefined;
      targetType = driverData?.type === 'renter' ? 'renter' : 'affiliate';
    }

    const templateSnapshot = await adminDb
      .collection('contractTemplates')
      .where('type', '==', targetType)
      .where('isActive', '==', true)
      .orderBy('uploadedAt', 'desc')
      .limit(1)
      .get();

    if (templateSnapshot.empty) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const doc = templateSnapshot.docs[0];
    const template = ContractTemplateSchema.parse({ id: doc.id, ...(doc.data() as Record<string, unknown>) });

    if (!template.storagePath) {
      return res.status(400).json({ success: false, error: 'Template missing storage path' });
    }

    const file = adminStorage.file(template.storagePath);
    const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: Date.now() + 1000 * 60 * 30 });

    return res.status(200).json({ success: true, url: signedUrl, fileName: template.fileName, version: template.version });
  } catch (error) {
    console.error('[Contracts] Failed to generate template download:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate download link' });
  }
}

