import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(slug); // 2-30 chars, lowercase, digits, hyphen, no edge hyphens
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    // Optional auth, but we can allow public check
    const slug = String(req.query.slug || '').trim().toLowerCase();
    if (!slug || !isValidSlug(slug)) {
      return res.status(400).json({ success: false, error: 'Slug inválido' });
    }

    const snap = await adminDb.collection('drivers').where('refSlug', '==', slug).limit(1).get();
    const available = snap.empty;
    return res.status(200).json({ success: true, slug, available });
  } catch (error: any) {
    console.error('[/api/driver/referral/check-slug]', error);
    return res.status(500).json({ success: false, error: 'Erro ao verificar slug' });
  }
}

