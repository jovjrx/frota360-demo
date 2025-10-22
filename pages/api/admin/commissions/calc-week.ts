import type { NextApiRequest, NextApiResponse } from 'next';
import { computeAllAffiliateBonuses } from '@/lib/commissions/compute';
import { getSession } from '@/lib/session/ironSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session?.userId || session.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { weekId } = req.body || {};
    if (!weekId || typeof weekId !== 'string') {
      return res.status(400).json({ success: false, error: 'weekId é obrigatório (ex: 2024-W40)' });
    }

    const result = await computeAllAffiliateBonuses(weekId);
    return res.status(200).json({ success: true, weekId, ...result });
  } catch (error: any) {
    console.error('[commissions/calc-week] error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Internal Server Error' });
  }
}
