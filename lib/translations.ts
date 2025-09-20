import fs from 'fs';
import path from 'path';

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
 */
export async function loadTranslations(
  locale: string = DEFAULT_LOCALE,
  namespaces: string[] = ['common']
): Promise<Translations> {
  const normalizedLocale = SUPPORTED_LOCALES.includes(locale as SupportedLocale) 
    ? locale as SupportedLocale 
    : DEFAULT_LOCALE;

  const translations: Translations = {};

  for (const namespace of namespaces) {
    try {
      const filePath = path.join(process.cwd(), 'locales', normalizedLocale, `${namespace}.json`);
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        translations[namespace] = JSON.parse(fileContent);
      } else {
        console.warn(`Translation file not found: ${filePath}`);
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
    const browserLocale = window.navigator.language.split('-')[0];
    return isLocaleSupported(browserLocale) ? browserLocale : DEFAULT_LOCALE;
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
