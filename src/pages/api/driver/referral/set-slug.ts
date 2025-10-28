import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(slug); // 2-30 chars, lowercase, digits, hyphen, no edge hyphens
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    const session = await getSession(req, res);
    if (!session || !session.userId) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    const slug = String((req.body?.slug || '').toString()).trim().toLowerCase();
    if (!slug || !isValidSlug(slug)) {
      return res.status(400).json({ success: false, error: 'Slug inválido' });
    }

    // Find current driver by email
    const driverSnap = await adminDb.collection('drivers').where('email', '==', session.userId).limit(1).get();
    if (driverSnap.empty) {
      return res.status(404).json({ success: false, error: 'Motorista não encontrado' });
    }
    const driverDoc = driverSnap.docs[0];

    // Check availability (ignore if it's already mine)
    const existsSnap = await adminDb.collection('drivers').where('refSlug', '==', slug).limit(1).get();
    if (!existsSnap.empty && existsSnap.docs[0].id !== driverDoc.id) {
      return res.status(409).json({ success: false, error: 'Slug indisponível' });
    }

    await driverDoc.ref.update({ refSlug: slug, updatedAt: new Date().toISOString() });
    return res.status(200).json({ success: true, slug });
  } catch (error: any) {
    console.error('[/api/driver/referral/set-slug]', error);
    return res.status(500).json({ success: false, error: 'Erro ao definir slug' });
  }
}

