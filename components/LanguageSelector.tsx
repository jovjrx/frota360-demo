import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { getAvailableLocales, isLocaleSupported } from '../lib/translations';

interface LanguageSelectorProps {
  className?: string;
}

const LANGUAGE_NAMES = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
};

export default function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const availableLocales = getAvailableLocales();
  const currentLocale = router.locale || 'pt';

  const handleLanguageChange = (locale: string) => {
    if (isLocaleSupported(locale)) {
      router.push(router.asPath, router.asPath, { locale });
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="mr-2">🌐</span>
        {LANGUAGE_NAMES[currentLocale as keyof typeof LANGUAGE_NAMES] || currentLocale}
        <svg
          className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right bg-white border border-gray-300 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {availableLocales.map((locale) => (
              <button
                key={locale}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  locale === currentLocale
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700'
                }`}
                role="menuitem"
                onClick={() => handleLanguageChange(locale)}
              >
                {LANGUAGE_NAMES[locale as keyof typeof LANGUAGE_NAMES] || locale}
                {locale === currentLocale && (
                  <span className="ml-2 text-blue-500">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
