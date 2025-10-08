import { WeeklyDataSources } from '@/schemas/weekly-data-sources';

export type WeeklyPlatform = 'uber' | 'bolt' | 'myprio' | 'viaverde' | 'cartrack';

export const WEEKLY_PLATFORMS: WeeklyPlatform[] = ['uber', 'bolt', 'myprio', 'viaverde', 'cartrack'];

export interface RawFileSummary {
  id: string;
  fileName?: string;
  importedAt?: string;
  processed: boolean;
  importedBy?: string;
  platform: WeeklyPlatform;
}

export interface RawFilesByPlatform {
  total: number;
  processed: number;
  pending: number;
  entries: RawFileSummary[];
}

export interface WeeklyDataOverview extends WeeklyDataSources {
  rawFiles: Record<WeeklyPlatform, RawFilesByPlatform>;
  totalRawFiles: number;
  pendingRawFiles: number;
  lastImportAt?: string;
}
