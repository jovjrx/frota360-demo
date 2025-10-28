import { useMemo } from 'react';
import { useRouter } from 'next/router';
import { BlockRenderer } from '@/components/public/BlockRenderer';
import { PageBlock } from '@/types/page-blocks';
import { getText, getArray } from '@/lib/page-blocks-resolver';

interface DynamicPageContentProps {
  blocks?: any[];
  tPage: (key: string) => any;
  tCommon: (key: string) => any;
  locale: string;
}

export function DynamicPageContent({ blocks, tPage, tCommon, locale }: DynamicPageContentProps) {
  const router = useRouter();

  // Função para extrair texto multilíngua
  const getTextMultiLang = useMemo(() => (value: any): string => {
    // Se é null/undefined, retorna vazio
    if (!value) return '';
    
    // Se é string normal, retorna direto
    if (typeof value === 'string') return value;
    
    // Se é número, retorna como string
    if (typeof value === 'number') return String(value);
    
    // Se é boolean, retorna como string
    if (typeof value === 'boolean') return String(value);
    
    // Se é array, não deveria estar aqui, mas retorna string
    if (Array.isArray(value)) return '';
    
    // Se é objeto multilíngua {pt, en}
    if (typeof value === 'object' && (value.pt || value.en)) {
      return locale === 'pt' ? (value.pt || value.en || '') : (value.en || value.pt || '');
    }
    
    // Se chegou aqui, não é nada esperado
    console.warn('getText recebeu valor inesperado:', typeof value, value);
    return '';
  }, [locale]);
  
  // Função para extrair array multilíngua
  const getArrayMultiLang = useMemo(() => (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'object' && value !== null && (value.pt || value.en)) {
      return locale === 'pt' ? (value.pt || []) : (value.en || []);
    }
    return [];
  }, [locale]);

  // Se não tem blocos, redireciona para home
  if (!blocks || blocks.length === 0) {
    if (typeof window !== 'undefined') {
      router.replace('/');
    }
    return null;
  }

  return (
    <>
      {blocks.map((block: PageBlock, index: number) => (
        <BlockRenderer 
          key={index} 
          block={block} 
          tPage={tPage} 
          tCommon={tCommon}
          getText={getTextMultiLang}
          getArray={getArrayMultiLang}
          locale={locale}
        />
      ))}
    </>
  );
}

