
import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';

interface WeeklyDataSourceStatus {
  status: 'complete' | 'partial' | 'pending' | 'error';
  lastImport?: string;
  lastError?: string;
}

export interface WeeklyDataSources {
  weekId: string;
  weekStart: string;
  weekEnd: string;
  isComplete: boolean;
  updatedAt: string;
  sources: {
    uber: WeeklyDataSourceStatus;
    bolt: WeeklyDataSourceStatus;
    myprio: WeeklyDataSourceStatus;
    viaverde: WeeklyDataSourceStatus;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    weeks?: WeeklyDataSources[];
    error?: string;
  }>,
) {
  const session = await getSession(req, res);

  if (!session?.isLoggedIn || session.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const db = getFirestore();
      const weeksRef = db.collection('weeks'); // Esta collection armazenará o resumo das semanas

      const snapshot = await weeksRef.orderBy('weekStart', 'desc').get();

      const weeks: WeeklyDataSources[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          weekId: doc.id,
          weekStart: data.weekStart,
          weekEnd: data.weekEnd,
          isComplete: data.isComplete || false,
          updatedAt: data.updatedAt || new Date().toISOString(),
          sources: data.sources || {
            uber: { status: 'pending' },
            bolt: { status: 'pending' },
            myprio: { status: 'pending' },
            viaverde: { status: 'pending' },
          },
        };
      });

      return res.status(200).json({ weeks });
    } catch (e) {
      console.error('Error fetching weekly data sources:', e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}

