import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Idiomas suportados
const SUPPORTED_LOCALES = ['pt', 'en', 'it', 'fr', 'es', 'de'];
const DEFAULT_LOCALE = 'pt';
const LANGUAGE_STORAGE_KEY = 'conduz-locale';

export function useLanguage() {
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState<string>(DEFAULT_LOCALE);
  const [isDetecting, setIsDetecting] = useState(true);

  // Detectar idioma do navegador
  const detectBrowserLanguage = (): string => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;

    // Obter idioma do navegador
    const browserLang = navigator.language || navigator.languages?.[0] || '';
    
    // Extrair código de idioma (ex: 'pt-BR' -> 'pt')
    const langCode = browserLang ? browserLang.split('-')[0].toLowerCase() : DEFAULT_LOCALE;
    
    // Verificar se é suportado
    if (SUPPORTED_LOCALES.includes(langCode)) {
      return langCode;
    }
    
    // Fallback para idiomas similares
    const fallbackMap: Record<string, string> = {
      'pt-br': 'pt',
      'pt-pt': 'pt',
      'en-us': 'en',
      'en-gb': 'en',
      'it-it': 'it',
      'fr-fr': 'fr',
      'es-es': 'es',
      'de-de': 'de',
    };
    
    const fallback = fallbackMap[browserLang.toLowerCase()];
    if (fallback) return fallback;
    
    // Se não encontrar, usar português como padrão
    return DEFAULT_LOCALE;
  };

  // Função para detectar idioma baseado na URL
  const detectLocaleFromUrl = () => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE;
    
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/en')) {
      return 'en';
    }
    return 'pt';
  };

  // Inicializar idioma
  useEffect(() => {
    const initializeLanguage = () => {
      setIsDetecting(true);
      
      try {
        // 1. Detectar idioma baseado na URL atual
        const urlLocale = detectLocaleFromUrl();
        setCurrentLocale(urlLocale);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, urlLocale);
        setIsDetecting(false);
        
      } catch (error) {
        console.warn('Erro ao detectar idioma:', error);
        setCurrentLocale(DEFAULT_LOCALE);
        setIsDetecting(false);
      }
    };

    initializeLanguage();
    
    // Listener para mudanças na URL
    const handleRouteChange = () => {
      const urlLocale = detectLocaleFromUrl();
      setCurrentLocale(urlLocale);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, urlLocale);
    };

    // Adicionar listener para mudanças na URL
    router.events?.on('routeChangeComplete', handleRouteChange);
    
    // Cleanup
    return () => {
      router.events?.off('routeChangeComplete', handleRouteChange);
    };
  }, []);

  // Função para mudar idioma
  const changeLanguage = async (newLocale: string) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) {
      console.warn(`Idioma não suportado: ${newLocale}`);
      return;
    }

    try {
      setCurrentLocale(newLocale);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);
      
      // Get current path
      const currentPath = router.asPath;
      let newPath = currentPath;
      
      if (newLocale === 'en') {
        // Switching to English - add /en/ prefix
        if (!currentPath.startsWith('/en')) {
          newPath = `/en${currentPath === '/' ? '' : currentPath}`;
        }
      } else {
        // Switching to Portuguese - remove /en/ prefix
        if (currentPath.startsWith('/en')) {
          newPath = currentPath.replace('/en', '') || '/';
        }
      }
      
      // Redirect to new URL
      window.location.href = newPath;
    } catch (error) {
      console.error('Erro ao mudar idioma:', error);
    }
  };

  // Função para obter idioma nativo
  const getNativeLanguageName = (locale: string): string => {
    const names: Record<string, string> = {
      'pt': 'Português',
      'en': 'English',
      'it': 'Italiano',
      'fr': 'Français',
      'es': 'Español',
      'de': 'Deutsch',
    };
    return names[locale] || locale;
  };

  // Função para obter bandeira/emoji do idioma
  const getLanguageFlag = (locale: string): string => {
    const flags: Record<string, string> = {
      'pt': '🇵🇹',
      'en': '🇺🇸',
      'it': '🇮🇹',
      'fr': '🇫🇷',
      'es': '🇪🇸',
      'de': '🇩🇪',
    };
    return flags[locale] || '🌐';
  };

  return {
    currentLocale,
    isDetecting,
    supportedLocales: SUPPORTED_LOCALES,
    changeLanguage,
    getNativeLanguageName,
    getLanguageFlag,
    isDefaultLocale: currentLocale === DEFAULT_LOCALE,
  };
}
