// Hook para obter configurações de cores dinamicamente
import { useSiteSettings } from '@/components/providers/SiteSettings';
import { SiteColors } from '@/types/site-settings';
import { DEFAULT_SITE_SETTINGS } from '@/types/site-settings';

export function useSiteColors(): SiteColors {
  const { settings } = useSiteSettings();
  return settings?.colors || DEFAULT_SITE_SETTINGS.colors;
}

