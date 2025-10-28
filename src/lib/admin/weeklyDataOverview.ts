import { adminDb } from '@/lib/firebaseAdmin';
import { createWeeklyDataSources } from '@/schemas/weekly-data-sources';
import type { WeeklyDataSources } from '@/schemas/weekly-data-sources';
import { RawFileArchiveEntry } from '@/schemas/raw-file-archive';
import {
  WEEKLY_PLATFORMS,
  WeeklyDataOverview,
  WeeklyPlatform,
  RawFilesByPlatform,
} from '@/lib/admin/weeklyDataShared';

function createEmptyRawFiles(): Record<WeeklyPlatform, RawFilesByPlatform> {
  return WEEKLY_PLATFORMS.reduce((acc, platform) => {
    acc[platform] = {
      total: 0,
      processed: 0,
      pending: 0,
      entries: [],
    };
    return acc;
  }, {} as Record<WeeklyPlatform, RawFilesByPlatform>);
}

function toWeeklyPlatform(value: string | undefined): WeeklyPlatform | null {
  if (!value) return null;
  const normalized = value.toLowerCase() as WeeklyPlatform;
  return WEEKLY_PLATFORMS.includes(normalized) ? normalized : null;
}

function mergeRawEntry(
  overview: WeeklyDataOverview,
  docId: string,
  entry: RawFileArchiveEntry
) {
  const platform = toWeeklyPlatform(entry.platform);
  if (!platform) {
    return;
  }

  const summary = overview.rawFiles[platform];
  summary.entries.push({
    id: docId,
    fileName: entry.fileName,
    importedAt: entry.importedAt,
    processed: Boolean(entry.processed),
    importedBy: entry.importedBy,
    platform,
  });
  summary.total += 1;
  if (entry.processed) {
    summary.processed += 1;
  }
  summary.pending = summary.total - summary.processed;

  overview.totalRawFiles += 1;
  overview.pendingRawFiles += entry.processed ? 0 : 1;

  if (entry.importedAt) {
    if (!overview.lastImportAt || entry.importedAt > overview.lastImportAt) {
      overview.lastImportAt = entry.importedAt;
    }
  }

  const source = overview.sources[platform];
  const rowsCount = Array.isArray(entry.rawData?.rows) ? entry.rawData.rows.length : 0;

  if (rowsCount > 0) {
    source.recordsCount = (source.recordsCount ?? 0) + rowsCount;
  }

  source.origin = source.origin ?? 'manual';
  source.strategy = source.strategy ?? 'upload';

  if (!source.importedAt || (entry.importedAt && entry.importedAt > source.importedAt)) {
    source.importedAt = entry.importedAt;
  }

  if (summary.processed > 0 && summary.pending === 0) {
    source.status = 'complete';
  } else if (summary.total > 0) {
    if (source.status !== 'complete') {
      source.status = summary.processed > 0 ? 'partial' : 'pending';
    }
  }
}

export async function fetchWeeklyDataOverview(limit = 12): Promise<WeeklyDataOverview[]> {
  const weekSnapshot = await adminDb
    .collection('weeklyDataSources')
    .orderBy('weekStart', 'desc')
    .limit(limit)
    .get();

  const weekMap = new Map<string, WeeklyDataOverview>();

  weekSnapshot.forEach((doc) => {
    const data = doc.data() as WeeklyDataSources;
    
    // Remove cartrack from legacy data if it exists
    const cleanedSources = { ...data.sources };
    if ('cartrack' in cleanedSources) {
      delete (cleanedSources as any).cartrack;
    }
    
    weekMap.set(data.weekId, {
      ...data,
      sources: cleanedSources,
      id: data.id ?? doc.id,
      rawFiles: createEmptyRawFiles(),
      totalRawFiles: 0,
      pendingRawFiles: 0,
      lastImportAt: data.updatedAt,
    });
  });

  const rawSnapshot = await adminDb
    .collection('rawFileArchive')
    .orderBy('importedAt', 'desc')
    .limit(limit * 12)
    .get();

  rawSnapshot.forEach((doc) => {
    const data = doc.data() as RawFileArchiveEntry;
    let overview = weekMap.get(data.weekId);

    if (!overview) {
      const placeholder = createWeeklyDataSources(data.weekId, data.weekStart, data.weekEnd);
      overview = {
        ...placeholder,
        id: placeholder.id,
        rawFiles: createEmptyRawFiles(),
        totalRawFiles: 0,
        pendingRawFiles: 0,
        lastImportAt: data.importedAt,
      };
      weekMap.set(data.weekId, overview);
    }

    mergeRawEntry(overview, doc.id, data);
  });

  const weeks = Array.from(weekMap.values());

  weeks.forEach((week) => {
    week.isComplete = WEEKLY_PLATFORMS.every((platform) => week.sources[platform].status === 'complete');
    if (!week.updatedAt || (week.lastImportAt && week.lastImportAt > week.updatedAt)) {
      week.updatedAt = week.lastImportAt ?? week.updatedAt;
    }
  });

  weeks.sort((a, b) => {
    const aDate = a.weekStart || '';
    const bDate = b.weekStart || '';
    return bDate.localeCompare(aDate);
  });

  return limit > 0 ? weeks.slice(0, limit) : weeks;
}

