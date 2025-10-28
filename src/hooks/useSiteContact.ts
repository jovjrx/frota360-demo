// Hook para obter informações de contato dinamicamente
import { useSiteSettings } from '@/components/providers/SiteSettings';
import { ContactInfo, DEFAULT_SITE_SETTINGS } from '@/types/site-settings';

export function useSiteContact(): ContactInfo {
  const { settings } = useSiteSettings();
  return settings?.contact || DEFAULT_SITE_SETTINGS.contact;
}

