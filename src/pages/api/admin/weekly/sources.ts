import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

type Platform = 'uber' | 'bolt' | 'myprio' | 'viaverde';
const PLATFORMS: Platform[] = ['uber', 'bolt', 'myprio', 'viaverde'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const weeksSnapshot = await adminDb.collection('weekly').limit(50).get();
    const weeksBase = weeksSnapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
      .sort((a, b) => (b.weekId || '').localeCompare(a.weekId || ''))
      .slice(0, 12);

    const dataSourcesDocs = await Promise.all(
      weeksBase.map((w) => adminDb.collection('weeklyDataSources').doc(w.weekId).get())
    );
    const dataSourcesByWeek = new Map<string, any>();
    dataSourcesDocs.forEach((doc) => { if (doc.exists) dataSourcesByWeek.set(doc.id, doc.data()); });

    const weeks = [] as any[];
    for (const w of weeksBase) {
      const weekId = w.weekId;
      const weekStart = w.weekStart || '';
      const weekEnd = w.weekEnd || '';

      const ds = dataSourcesByWeek.get(weekId);
      const sources = {
        uber: ds?.sources?.uber || { status: 'pending', origin: 'manual', driversCount: 0, recordsCount: 0 },
        bolt: ds?.sources?.bolt || { status: 'pending', origin: 'manual', driversCount: 0, recordsCount: 0 },
        myprio: ds?.sources?.myprio || { status: 'pending', origin: 'manual', driversCount: 0, recordsCount: 0 },
        viaverde: ds?.sources?.viaverde || { status: 'pending', origin: 'manual', driversCount: 0, recordsCount: 0 },
      };

      const rawFiles: Record<Platform, { total: number; processed: number; entries: Array<{ id: string; processed?: boolean }> }> = {
        uber: { total: 0, processed: 0, entries: [] },
        bolt: { total: 0, processed: 0, entries: [] },
        myprio: { total: 0, processed: 0, entries: [] },
        viaverde: { total: 0, processed: 0, entries: [] },
      };

      const rawSnap = await adminDb.collection('rawFileArchive').where('weekId', '==', weekId).get();
      rawSnap.docs.forEach((doc) => {
        const d = doc.data() as any;
        const p = (d.platform || '').toLowerCase();
        if (!PLATFORMS.includes(p)) return;
        rawFiles[p as Platform].total += 1;
        if (d.processed) rawFiles[p as Platform].processed += 1;
        rawFiles[p as Platform].entries.push({ id: doc.id, processed: !!d.processed });
      });

      weeks.push({ weekId, weekStart, weekEnd, status: w.status || 'open', sources, rawFiles });
    }

    return res.status(200).json({ weeks });
  } catch (error: any) {
    console.error('[GET /api/admin/weekly/sources] Error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
