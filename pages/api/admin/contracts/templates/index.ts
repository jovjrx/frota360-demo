import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { ContractTemplateSchema } from '@/schemas/contract-template';
import { z } from 'zod';

const uploadBodySchema = z.object({
  type: z.enum(['affiliate', 'renter']),
  version: z.string().min(1),
  fileName: z.string().min(1),
  fileContent: z.string().min(1),
});

type ContractTemplateWithUrl = z.infer<typeof ContractTemplateSchema> & { downloadUrl: string };

type DataResponse =
  | { success: true; templates: ContractTemplateWithUrl[] }
  | { success: true; id: string }
  | { success: false; error: string };

async function handleGet(res: NextApiResponse<DataResponse>) {
  const snapshot = await adminDb
    .collection('contractTemplates')
    .orderBy('uploadedAt', 'desc')
    .get();

  const templates: ContractTemplateWithUrl[] = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const raw = doc.data() as Record<string, unknown>;
      const parsed = ContractTemplateSchema.parse({
        id: doc.id,
        ...raw,
      });

      let downloadUrl = parsed.fileUrl;
      if (parsed.storagePath) {
        try {
          const file = adminStorage.file(parsed.storagePath);
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
          });
          downloadUrl = signedUrl;
        } catch (error) {
          console.warn('[Contracts] Failed to generate signed URL', error);
        }
      }

      return {
        ...parsed,
        downloadUrl,
      };
    })
  );

  return res.status(200).json({ success: true, templates });
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<DataResponse>,
  uploaderEmail: string | null,
) {
  const parsed = uploadBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

  const { type, version, fileName, fileContent } = parsed.data;

  const buffer = Buffer.from(fileContent, 'base64');
  const nowIso = new Date().toISOString();
  const storagePath = `contracts/templates/${type}/${Date.now()}-${fileName}`;

  try {
    const file = adminStorage.file(storagePath);
    await file.save(buffer, {
      contentType: 'application/pdf',
      resumable: false,
      metadata: {
        cacheControl: 'private, max-age=0, no-transform',
      },
    });

    await file.makePrivate({ strict: false }).catch(() => undefined);

    const payload = {
      type,
      version,
      fileName,
      fileUrl: `gs://${file.bucket.name}/${storagePath}`,
      storagePath,
  uploadedBy: uploaderEmail || 'admin',
      uploadedAt: nowIso,
      isActive: true,
    } satisfies Record<string, unknown>;

    const docRef = await adminDb.collection('contractTemplates').add(payload);

    // Opcional: inativar versões anteriores do mesmo tipo
    const previousActive = await adminDb
      .collection('contractTemplates')
      .where('type', '==', type)
      .where('isActive', '==', true)
      .get();

    await Promise.all(
      previousActive.docs
        .filter((doc) => doc.id !== docRef.id)
        .map((doc) => doc.ref.update({ isActive: false }))
    );

    return res.status(201).json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('[Contracts] Failed to upload template:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload template' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<DataResponse>) {
  const session = await getSession(req, res);
  if (!session.userId || session.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return handleGet(res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res, session.email ?? null);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
