// Hook para obter configurações de tracking dinamicamente
import { useSiteSettings } from '@/components/providers/SiteSettings';
import { TrackingConfig } from '@/types/site-settings';
import { DEFAULT_SITE_SETTINGS } from '@/types/site-settings';

export function useSiteTracking(): TrackingConfig {
  const { settings } = useSiteSettings();
  return settings?.tracking || DEFAULT_SITE_SETTINGS.tracking;
}

