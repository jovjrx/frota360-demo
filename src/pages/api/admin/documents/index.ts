import type { NextApiRequest, NextApiResponse } from 'next';
import { createDocument, getDocument, updateDocument, deleteDocument, listDocuments } from '@/lib/documents/service';
import { CreateDocumentDTO, UpdateDocumentDTO } from '@/schemas/document';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: validar sessão admin
  try {
    if (req.method === 'GET') {
      const docs = await listDocuments();
      return res.status(200).json({ success: true, data: docs });
    }

    if (req.method === 'POST') {
      const { dto, fileUrl, fileName, fileSize, fileMimeType, adminId } = req.body;

      if (!dto || !fileUrl) {
        return res.status(400).json({ success: false, error: 'Dados inválidos' });
      }

      const doc = await createDocument(
        dto as CreateDocumentDTO,
        fileUrl,
        fileName,
        fileSize,
        fileMimeType,
        adminId
      );
      return res.status(201).json({ success: true, data: doc });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (e: any) {
    console.error('[api/admin/documents] error', e);
    return res.status(500).json({ success: false, error: e?.message || 'Internal Server Error' });
  }
}

