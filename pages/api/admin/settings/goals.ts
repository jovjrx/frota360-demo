import type { NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

// Simple config storage for goals
// GET returns { activeYear, targets: {Q1,Q2,Q3,Q4} }
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
        return res.status(200).json({ success: true, config: { activeYear: 2026, targets: { Q1: 15, Q2: 25, Q3: 40, Q4: 60 } } });
      }
      return res.status(200).json({ success: true, config: snap.data() });
    } catch (e: any) {
      console.error('[admin/settings/goals] GET error', e);
      return res.status(500).json({ success: false, error: 'Failed to load goals settings' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { activeYear, targets } = req.body || {};
      if (!activeYear || !targets) {
        return res.status(400).json({ success: false, error: 'Invalid payload' });
      }
      await adminDb.doc(DOC_PATH).set({ activeYear, targets }, { merge: true });
      return res.status(200).json({ success: true });
    } catch (e: any) {
      console.error('[admin/settings/goals] POST error', e);
      return res.status(500).json({ success: false, error: 'Failed to save goals settings' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}

export default withIronSessionApiRoute(handler, sessionOptions);
