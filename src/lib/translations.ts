// Dynamic imports for Node.js modules (server-side only)
const fs = typeof window === 'undefined' ? require('fs') : null;
const path = typeof window === 'undefined' ? require('path') : null;

export interface TranslationNamespace {
  [key: string]: any;
}

export interface Translations {
  [namespace: string]: TranslationNamespace;
}

const SUPPORTED_LOCALES = ['pt', 'en', 'es'] as const;
const DEFAULT_LOCALE = 'pt';

type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Load translations for a specific locale and namespaces
 * Namespaces can be in format "category/file" (e.g., "public/home") or just "file" (defaults to common)
 */
export async function loadTranslations(
  locale: string = DEFAULT_LOCALE,
  namespaces: string[] = ['common']
): Promise<Translations> {
  // Only work on server-side
  if (typeof window !== 'undefined' || !fs || !path) {
    console.warn('loadTranslations can only be used on the server-side');
    return {};
  }

  const normalizedLocale = SUPPORTED_LOCALES.includes(locale as SupportedLocale) 
    ? locale as SupportedLocale 
    : DEFAULT_LOCALE;

  const translations: Translations = {};

  for (const namespace of namespaces) {
    try {
      const baseLocalePath = path.join(process.cwd(), 'locales', normalizedLocale);
      const namespaceParts = namespace.split('/').filter(Boolean);

      interface CandidatePath {
        filePath: string;
        storeKeys: string[];
      }

      const candidates: CandidatePath[] = [];

      if (namespaceParts.length > 1) {
        const [category, ...segments] = namespaceParts;
        const normalizedKey = [category, ...segments].join('/');
        const candidatePath = path.join(baseLocalePath, category, ...segments) + '.json';
        candidates.push({ filePath: candidatePath, storeKeys: [namespace, normalizedKey] });
      } else {
        const name = namespaceParts[0] || namespace;

        const preferredCategories = name === 'admin'
          ? ['admin']
          : name === 'dashboard'
          ? ['dashboard']
          : name === 'common'
          ? ['common']
          : ['public', 'common', 'admin', 'dashboard'];

        for (const category of preferredCategories) {
          const candidatePath = path.join(baseLocalePath, category, `${name}.json`);
          const normalizedKey = `${category}/${name}`;
          candidates.push({ filePath: candidatePath, storeKeys: [namespace, normalizedKey] });
        }

        // Legacy flat-file support (e.g., locales/pt/common.json)
        const legacyPath = path.join(baseLocalePath, `${name}.json`);
        candidates.push({ filePath: legacyPath, storeKeys: [namespace] });
      }

      const resolvedCandidate = candidates.find(({ filePath }) => fs.existsSync(filePath));

      if (resolvedCandidate) {
        console.log('Found translation file at:', resolvedCandidate.filePath);
        const fileContent = fs.readFileSync(resolvedCandidate.filePath, 'utf8');
        const parsed = JSON.parse(fileContent);

        const uniqueKeys = new Set(resolvedCandidate.storeKeys);
        for (const key of uniqueKeys) {
          translations[key] = parsed;
        }
      } else {
        console.warn(
          `Translation file not found for namespace "${namespace}" in locale "${normalizedLocale}". Searched paths: ${candidates
            .map(({ filePath }) => filePath)
            .join(', ')}`
        );
        translations[namespace] = {};
      }
    } catch (error) {
      console.error(`Error loading translation file for ${namespace}:`, error);
      translations[namespace] = {};
    }
  }

  return translations;
}

/**
 * Get a translation value by key path
 */
export function getTranslation(
  translations: TranslationNamespace,
  keyPath: string,
  variables?: Record<string, any>
): string {
  if (!keyPath || typeof keyPath !== 'string') return keyPath || '';
  const keys = keyPath.split('.');
  let value: any = translations;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return keyPath; // Return the key path if translation not found
    }
  }

  if (typeof value !== 'string') {
    return keyPath;
  }

  // Replace variables in the translation
  if (variables) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });
  }

  return value;
}

/**
 * Create a translation function for a specific namespace
 */
export function createTranslationFunction(
  translations: TranslationNamespace
) {
  return (keyPath: string, variables?: Record<string, any>): string => {
    return getTranslation(translations, keyPath, variables);
  };
}

/**
 * Get available locales
 */
export function getAvailableLocales(): readonly string[] {
  return SUPPORTED_LOCALES;
}

/**
 * Check if a locale is supported
 */
export function isLocaleSupported(locale: string): boolean {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

/**
 * Get the default locale
 */
export function getDefaultLocale(): string {
  return DEFAULT_LOCALE;
}

/**
 * Format currency based on locale
 */
export function formatCurrency(
  amount: number,
  locale: string = DEFAULT_LOCALE,
  currency: string = 'EUR'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `€${amount.toFixed(2)}`;
  }
}

/**
 * Format date based on locale
 */
export function formatDate(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const dateObj = new Date(date);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    return String(date);
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: string = DEFAULT_LOCALE
): string {
  try {
    const dateObj = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  } catch (error) {
    return String(date);
  }
}

/**
 * Get browser locale
 */
export function getBrowserLocale(): string {
  if (typeof window !== 'undefined' && window.navigator) {
    const browserLocale = window.navigator.language || '';
    const langCode = browserLocale ? browserLocale.split('-')[0] : DEFAULT_LOCALE;
    return isLocaleSupported(langCode) ? langCode : DEFAULT_LOCALE;
  }
  return DEFAULT_LOCALE;
}

/**
 * Server-side translation helper for API routes
 */
export async function getServerTranslations(
  locale: string,
  namespaces: string[]
) {
  const translations = await loadTranslations(locale, namespaces);
  
  const t = (namespace: string) => (keyPath: string, variables?: Record<string, any>) => {
    return getTranslation(translations[namespace] || {}, keyPath, variables);
  };

  return { translations, t };
}

export default {
  loadTranslations,
  getTranslation,
  createTranslationFunction,
  getAvailableLocales,
  isLocaleSupported,
  getDefaultLocale,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getBrowserLocale,
  getServerTranslations,
};

