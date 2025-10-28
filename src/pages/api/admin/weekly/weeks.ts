import type { NextApiRequest, NextApiResponse } from 'next';
import { getWeeklyWeeks } from '@/lib/admin/adminQueries';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const weeks = await getWeeklyWeeks();
    return res.status(200).json({ weeks });
  } catch (error) {
    console.error('[GET /api/admin/weekly/weeks] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
