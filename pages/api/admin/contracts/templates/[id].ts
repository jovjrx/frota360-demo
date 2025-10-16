import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { ContractTemplateSchema } from '@/schemas/contract-template';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session.userId || session.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid id' });
  }

  try {
    const docRef = adminDb.collection('contractTemplates').doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    const template = ContractTemplateSchema.parse({ id, ...(snapshot.data() as Record<string, unknown>) });

    if (template.storagePath) {
      try {
        await adminStorage.file(template.storagePath).delete({ ignoreNotFound: true });
      } catch (error) {
        console.warn(`[Contracts] Failed to delete template file ${template.storagePath}:`, error);
      }
    }

    await docRef.delete();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Contracts] Failed to delete template:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
}
