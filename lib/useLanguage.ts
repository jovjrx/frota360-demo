import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// Idiomas suportados
const SUPPORTED_LOCALES = ['pt', 'en', 'it', 'fr', 'es', 'de'];
const DEFAULT_LOCALE = 'pt';

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
    const langCode = browserLang.split('-')[0].toLowerCase();
    
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

  // Inicializar idioma
  useEffect(() => {
    const initializeLanguage = () => {
      setIsDetecting(true);
      
      try {
        // 1. Tentar usar locale da URL (se existir)
        if (router.locale && SUPPORTED_LOCALES.includes(router.locale)) {
          setCurrentLocale(router.locale);
          setIsDetecting(false);
          return;
        }
        
        // 2. Tentar usar locale salvo no localStorage
        const savedLocale = localStorage.getItem('alvorada-locale');
        if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
          setCurrentLocale(savedLocale);
          // Atualizar URL se necessário
          if (router.locale !== savedLocale) {
            router.push(router.pathname, router.asPath, { locale: savedLocale });
          }
          setIsDetecting(false);
          return;
        }
        
        // 3. Detectar idioma do navegador
        const detectedLang = detectBrowserLanguage();
        setCurrentLocale(detectedLang);
        
        // Salvar no localStorage
        localStorage.setItem('alvorada-locale', detectedLang);
        
        // Atualizar URL se necessário
        if (router.locale !== detectedLang) {
          router.push(router.pathname, router.asPath, { locale: detectedLang });
        }
        
      } catch (error) {
        console.warn('Erro ao detectar idioma:', error);
        setCurrentLocale(DEFAULT_LOCALE);
      } finally {
        setIsDetecting(false);
      }
    };

    initializeLanguage();
  }, [router.pathname]);

  // Função para mudar idioma
  const changeLanguage = async (newLocale: string) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) {
      console.warn(`Idioma não suportado: ${newLocale}`);
      return;
    }

    try {
      setCurrentLocale(newLocale);
      localStorage.setItem('alvorada-locale', newLocale);
      
      // Atualizar URL
      await router.push(router.pathname, router.asPath, { locale: newLocale });
      
      // Recarregar página para aplicar traduções
      window.location.reload();
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
