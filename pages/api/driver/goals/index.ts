import type { NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { buildGoalsForYear } from '@/lib/goals/service';

async function handler(req: SessionRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const user = req.session.user;
  if (!user || user.role !== 'driver') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const year = Number(req.query.year) || 2026;
    const { goals, summary } = await buildGoalsForYear(year);

    return res.status(200).json({
      success: true,
      driver: {
        id: user.id,
        name: user.name || '',
        type: 'driver',
      },
      goals,
      summary,
    });
  } catch (e: any) {
    console.error('[api/driver/goals] error', e);
    return res.status(500).json({ success: false, error: 'Failed to load goals' });
  }
}

export default withIronSessionApiRoute(handler, sessionOptions);
