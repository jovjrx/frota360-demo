// Hook para obter configurações SMTP dinamicamente
import { useSiteSettings } from '@/components/providers/SiteSettings';
import { SMTPConfig, DEFAULT_SITE_SETTINGS } from '@/types/site-settings';

export function useSiteSMTP(): SMTPConfig {
  const { settings } = useSiteSettings();
  return settings?.smtp || DEFAULT_SITE_SETTINGS.smtp;
}

