// Sistema de cache para configurações do site
// Evita bater no Firebase toda hora

import { SiteSettings } from '@/types/site-settings';

interface CacheEntry {
  data: SiteSettings;
  timestamp: number;
}

class SiteSettingsCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  get(key: string): SiteSettings | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: SiteSettings): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

export const siteSettingsCache = new SiteSettingsCache();

