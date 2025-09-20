import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { getTranslation, TranslationNamespace } from '../lib/translations';

interface UseTranslationsProps {
  translations: Record<string, TranslationNamespace>;
  namespace?: string;
}

export function useTranslations({ translations, namespace = 'common' }: UseTranslationsProps) {
  const router = useRouter();
  const locale = router.locale || 'pt';

  const t = useMemo(() => {
    const namespaceTranslations = translations[namespace] || {};
    
    return (keyPath: string, variables?: Record<string, any>): string => {
      return getTranslation(namespaceTranslations, keyPath, variables);
    };
  }, [translations, namespace, locale]);

  return { t, locale };
}

export default useTranslations;
