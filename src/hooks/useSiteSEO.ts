// Hook para obter configurações de SEO dinamicamente
import { useRouter } from 'next/router';
import { useSiteSettings } from '@/components/providers/SiteSettings';
import { SEOConfig } from '@/types/site-settings';
import { DEFAULT_SITE_SETTINGS } from '@/types/site-settings';

export function useSiteSEO(): SEOConfig {
  const { settings } = useSiteSettings();
  const router = useRouter();
  
  // Detecta locale da URL
  const locale = router.asPath.startsWith('/en') ? 'en' : 'pt';
  
  const seo = settings?.seo || DEFAULT_SITE_SETTINGS.seo;
  return seo[locale];
}

