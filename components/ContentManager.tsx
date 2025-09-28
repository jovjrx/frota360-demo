import { useState, useEffect } from 'react';
import { fetchPageContent, mergeContentWithTranslations } from '@/lib/content-manager';

interface ContentManagerProps {
  page: string;
  locale: string;
  translations: any;
  children: (mergedContent: any) => React.ReactNode;
}

export function ContentManager({ page, locale, translations, children }: ContentManagerProps) {
  const [cmsContent, setCmsContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContent();
  }, [page, locale]);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const content = await fetchPageContent(page, locale);
      setCmsContent(content);
    } catch (error) {
      console.error('Error loading CMS content:', error);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <>{children(translations)}</>; // Fallback to translations while loading
  }

  if (error) {
    return <>{children(translations)}</>; // Fallback to translations on error
  }

  // Merge CMS content with translations
  const mergedContent = mergeContentWithTranslations(cmsContent, translations, page);

  return <>{children(mergedContent)}</>;
}
