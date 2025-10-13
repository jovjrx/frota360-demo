import type { NextApiResponse } from 'next';
import { withIronSessionApiRoute, SessionRequest } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';
import { getWeekDates } from '@/lib/utils/date-helpers';
import {
  WeeklyDataSources,
  createWeeklyDataSources,
  DataSourceStatus,
} from '@/schemas/weekly-data-sources';
import { WEEKLY_PLATFORMS, WeeklyPlatform } from '@/lib/admin/weeklyDataShared';

const ISO_WEEK_REGEX = /^\d{4}-W\d{2}$/;

const allowedStrategies = ['api', 'upload', 'mixed'] as const;
type StrategyOption = (typeof allowedStrategies)[number];

type SnapshotRequestBody = {
  weekId?: string;
  strategies?: Partial<Record<WeeklyPlatform, StrategyOption>>;
  allowOverride?: boolean;
};

type SnapshotResponseBody = {
  success: boolean;
  week?: WeeklyDataSources;
  error?: string;
  code?: 'WEEK_EXISTS' | 'INVALID_WEEK_ID' | 'FORBIDDEN';
};

function resolveOrigin(strategy: StrategyOption): 'auto' | 'manual' {
  switch (strategy) {
    case 'api':
      return 'auto';
    case 'mixed':
      return 'auto';
    case 'upload':
    default:
      return 'manual';
  }
}

function sanitizeStrategy(value: unknown): StrategyOption | null {
  if (typeof value !== 'string') return null;
  return allowedStrategies.includes(value as StrategyOption) ? (value as StrategyOption) : null;
}

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse<SnapshotResponseBody>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const user = req.session.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Unauthorized', code: 'FORBIDDEN' });
  }

  const body: SnapshotRequestBody = req.body ?? {};
  const { weekId, strategies = {}, allowOverride = false } = body;

  if (!weekId || !ISO_WEEK_REGEX.test(weekId)) {
    return res.status(400).json({ success: false, error: 'Invalid weekId', code: 'INVALID_WEEK_ID' });
  }

  try {
    const { start: weekStart, end: weekEnd } = getWeekDates(weekId);

    const docRef = adminDb.collection('weeklyDataSources').doc(weekId);
    const docSnap = await docRef.get();

    if (docSnap.exists && !allowOverride) {
      return res.status(409).json({
        success: false,
        error: 'Semana já existe. Confirme a substituição.',
        code: 'WEEK_EXISTS',
      });
    }

    let current: WeeklyDataSources;
    if (docSnap.exists) {
      current = docSnap.data() as WeeklyDataSources;
    } else {
      current = createWeeklyDataSources(weekId, weekStart, weekEnd);
    }

    const now = new Date().toISOString();

    const nextSources = { ...current.sources } as WeeklyDataSources['sources'];

    WEEKLY_PLATFORMS.forEach((platform) => {
      const strategy = sanitizeStrategy(strategies[platform]) ?? 'upload';
      const base: DataSourceStatus = {
        ...nextSources[platform],
        status: 'pending',
        origin: resolveOrigin(strategy),
        strategy,
        // Não incluir campos undefined - Firestore não aceita
        driversCount: 0,
        recordsCount: 0,
      };
      
      // Remove campos undefined antes de salvar
      delete (base as any).importedAt;
      delete (base as any).lastError;
      delete (base as any).archiveRef;
      
      nextSources[platform] = base;
    });

    const nextWeek: WeeklyDataSources = {
      ...current,
      id: weekId,
      weekId,
      weekStart,
      weekEnd,
      sources: nextSources,
      isComplete: false,
      createdAt: current.createdAt ?? now,
      updatedAt: now,
    };

    await docRef.set(nextWeek, { merge: true });

    return res.status(200).json({ success: true, week: nextWeek });
  } catch (error) {
    console.error('Failed to create weekly snapshot:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}, sessionOptions);
