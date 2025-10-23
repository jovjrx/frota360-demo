import type { NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { getActiveRewards } from '@/lib/goals/service';
import { adminDb } from '@/lib/firebaseAdmin';

async function handler(req: SessionRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const user = req.session.user;
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const rewards = await getActiveRewards();
    return res.status(200).json({ success: true, rewards });
  } catch (e: any) {
    console.error('[api/admin/goals] error', e);
    return res.status(500).json({ success: false, error: 'Failed to load goals' });
  }
}

export default withIronSessionApiRoute(handler, sessionOptions);
