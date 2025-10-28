import type { NextApiRequest, NextApiResponse } from 'next';
import { listDocumentsForDriver, acknowledgeDocument } from '@/lib/documents/service';
import { isDocumentExpired, getDaysUntilExpiration } from '@/lib/documents/service';
import { Document, DocumentDriverView } from '@/schemas/document';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const driverId = req.query.driverId as string;

  if (!driverId) {
    return res.status(400).json({ success: false, error: 'driverId não fornecido' });
  }

  try {
    if (req.method === 'GET') {
      const docs = await listDocumentsForDriver(driverId);
      
      const mapped: DocumentDriverView[] = docs.map((doc: Document) => ({
        id: doc.id,
        name: doc.name,
        description: doc.description,
        category: doc.category,
        fileUrl: doc.fileUrl,
        validFrom: doc.validFrom,
        validUntil: doc.validUntil,
        expiresInDays: getDaysUntilExpiration(doc),
        isRequired: doc.isRequired,
        isExpired: isDocumentExpired(doc),
        acknowledgedAt: doc.acknowledgedBy?.[driverId]?.acknowledgedAt,
      }));

      return res.status(200).json({ success: true, data: mapped });
    }

    if (req.method === 'POST') {
      const { documentId } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;

      if (!documentId) {
        return res.status(400).json({ success: false, error: 'documentId não fornecido' });
      }

      await acknowledgeDocument(documentId, driverId, ipAddress);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (e: any) {
    console.error('[api/driver/documents] error', e);
    return res.status(500).json({ success: false, error: e?.message || 'Internal Server Error' });
  }
}

