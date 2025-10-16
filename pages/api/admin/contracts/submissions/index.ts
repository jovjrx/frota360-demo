import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { DriverContractSchema } from '@/schemas/driver-contract';
import type { Query } from 'firebase-admin/firestore';

const SIGNED_URL_TTL_MS = 1000 * 60 * 15;

function getStoragePathFromGsUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('gs://')) {
    return null;
  }

  const withoutScheme = url.replace('gs://', '');
  const firstSlash = withoutScheme.indexOf('/');
  if (firstSlash === -1) {
    return null;
  }

  return withoutScheme.slice(firstSlash + 1);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session.userId || session.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { driverId, status, contractType } = req.query as {
      driverId?: string;
      status?: string;
      contractType?: 'affiliate' | 'renter';
    };

  let query: Query = adminDb.collection('driverContracts');

    if (driverId) {
      query = query.where('driverId', '==', driverId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (contractType) {
      query = query.where('contractType', '==', contractType);
    }

    const snapshot = await query.orderBy('updatedAt', 'desc').get();
    const contracts = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const parsed = DriverContractSchema.parse({
          id: doc.id,
          ...(doc.data() as Record<string, unknown>),
        });

        let signedDocumentDownloadUrl: string | null = null;
        const storagePath = getStoragePathFromGsUrl(parsed.signedDocumentUrl);
        if (storagePath) {
          try {
            const file = adminStorage.file(storagePath);
            const [url] = await file.getSignedUrl({
              action: 'read',
              expires: Date.now() + SIGNED_URL_TTL_MS,
            });
            signedDocumentDownloadUrl = url;
          } catch (error) {
            console.warn('[Contracts] Failed to generate signed contract URL', error);
          }
        }

        return {
          ...parsed,
          signedDocumentDownloadUrl,
        };
      })
    );

    return res.status(200).json({ success: true, contracts });
  } catch (error) {
    console.error('[Contracts] Failed to list submissions:', error);
    return res.status(500).json({ success: false, error: 'Failed to list submissions' });
  }
}
