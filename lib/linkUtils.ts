import { useRouter } from 'next/router';

export function getLocalizedHref(href: string, locale?: string): string {
  // If locale is not provided, try to detect from current URL
  if (!locale && typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    locale = currentPath.startsWith('/en') ? 'en' : 'pt';
  }

  // Default to 'pt' if no locale is provided
  const currentLocale = locale || 'pt';

  // Don't add prefix for Portuguese (default)
  if (currentLocale === 'pt') {
    return href;
  }

  // Add /en prefix for English
  if (currentLocale === 'en') {
    return `/en${href === '/' ? '' : href}`;
  }

  // For other locales, add the locale prefix
  return `/${currentLocale}${href === '/' ? '' : href}`;
}

/**
 * Hook to get localized href based on current router locale
 */
export function useLocalizedHref() {
  const router = useRouter();
  
  // Detect locale from current path
  const currentPath = router.asPath;
  const locale = currentPath.startsWith('/en') ? 'en' : 'pt';
  
  return (href: string) => getLocalizedHref(href, locale);
}

/**
 * Component wrapper for NextLink with automatic locale prefixing
 */
export function createLocalizedLink(href: string, locale?: string) {
  return getLocalizedHref(href, locale);
}
