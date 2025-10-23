import type { NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

// Config storage for goals (rewards)
// GET returns { rewards: [ ... ] }
// POST updates the same doc

const DOC_PATH = 'settings/goals';

async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const snap = await adminDb.doc(DOC_PATH).get();
      if (!snap.exists) {
        return res.status(200).json({ success: true, config: { rewards: [] } });
      }
      const data = snap.data() as any;
      return res.status(200).json({ success: true, config: { rewards: data.rewards || [] } });
    } catch (e: any) {
      console.error('[admin/settings/goals] GET error', e);
      return res.status(500).json({ success: false, error: 'Failed to load goals settings' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { rewards } = req.body || {};
      if (!Array.isArray(rewards)) {
        return res.status(400).json({ success: false, error: 'Invalid payload' });
      }
      // Add dataInicio if missing
      const now = Date.now();
      const rewardsWithStart = rewards.map((r: any) => ({ ...r, dataInicio: r.dataInicio || now }));
      await adminDb.doc(DOC_PATH).set({ rewards: rewardsWithStart }, { merge: true });
      return res.status(200).json({ success: true });
    } catch (e: any) {
      console.error('[admin/settings/goals] POST error', e);
      return res.status(500).json({ success: false, error: 'Failed to save goals settings' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}

export default withIronSessionApiRoute(handler, sessionOptions);
