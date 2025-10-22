import type { NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { buildGoalsForYear } from '@/lib/goals/service';
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
    let yearParam = Number(req.query.year);
    let resolvedYear: number | undefined = Number.isFinite(yearParam) ? yearParam : undefined;

    if (!resolvedYear) {
      try {
        const snap = await adminDb.doc('settings/goals').get();
        const data = snap.exists ? (snap.data() as any) : null;
        const ay = Number(data?.activeYear);
        resolvedYear = Number.isFinite(ay) ? ay : undefined;
      } catch {
        resolvedYear = undefined;
      }
    }

    if (!resolvedYear) {
      // No year configured, return empty set (no mocked data)
      return res.status(200).json({ success: true, goals: [], summary: { totalGoals: 0, completedGoals: 0, overallProgress: 0, averageProgress: 0 } });
    }

    const { goals, summary } = await buildGoalsForYear(resolvedYear);
    return res.status(200).json({ success: true, year: resolvedYear, goals, summary });
  } catch (e: any) {
    console.error('[api/admin/goals] error', e);
    return res.status(500).json({ success: false, error: 'Failed to load goals' });
  }
}

export default withIronSessionApiRoute(handler, sessionOptions);
