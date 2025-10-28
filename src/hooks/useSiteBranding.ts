// Hook para obter configurações de branding dinamicamente
import { useSiteSettings } from '@/components/providers/SiteSettings';
import { SiteBranding } from '@/types/site-settings';
import { DEFAULT_SITE_SETTINGS } from '@/types/site-settings';

export function useSiteBranding(): SiteBranding {
  const { settings } = useSiteSettings();
  return settings?.branding || DEFAULT_SITE_SETTINGS.branding;
}

