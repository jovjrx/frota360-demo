import { useMemo } from 'react';
import { useLanguage } from '@/components/providers/Language';
import {
  HeroBlock,
  PaymentsBlock,
  BenefitsBlock,
  ReferralBlock,
  HowItWorksBlock,
  ServicesBlock,
  TestimonialsBlock,
  FAQBlock,
  CTABlock,
  CardWithHighlightBlock,
  TeamBlock,
  ValueCardsBlock,
  FinancingBlock,
  RequirementsBlock,
  SupportBlock,
  TitleOnlyBlock,
} from './blocks';
import type { PageBlock } from '@/types/page-blocks';
import { getText, getArray } from '@/lib/page-blocks-resolver';

interface BlockRendererProps {
  block: PageBlock;
  tPage: (key: string) => any;
  tCommon: (key: string) => any;
  getText?: (value: any) => string;
  getArray?: (value: any) => any[];
  locale?: string;
}

export function BlockRenderer({ block, tPage, tCommon, getText, getArray: getArrayProp, locale: localeProp }: BlockRendererProps) {
  const { locale: localeHook } = useLanguage();
  const locale = localeProp || localeHook;
  
  // Função para extrair texto multilíngua (DEFINIDA PRIMEIRO)
  const getMultiLang = useMemo(() => {
    if (getText) return getText;
    
    return (value: any): string => {
      if (!value) return '';
      
      // Se é string normal, retorna direto
      if (typeof value === 'string') return value;
      
      // Se é número, retorna como string
      if (typeof value === 'number') return String(value);
      
      // Se é boolean, retorna como string
      if (typeof value === 'boolean') return String(value);
      
      // Se é array, não deveria estar aqui
      if (Array.isArray(value)) return '';
      
      // Se é um objeto multilíngua
      if (typeof value === 'object' && !Array.isArray(value)) {
        if (value.pt || value.en) {
          return locale === 'pt' ? (value.pt || value.en || '') : (value.en || value.pt || '');
        }
        return '';
      }
      
      return '';
    };
  }, [locale, getText]);

  const t = useMemo(() => (key: string, fallback?: any) => {
    // Se key não é string, é um objeto - usar getMultiLang
    if (typeof key !== 'string') {
      return getMultiLang(key);
    }
    
    try {
      if (key.startsWith('common.')) {
        const path = key.replace('common.', '');
        const value = tCommon(path);
        return value || fallback || key;
      }
      const value = tPage(key);
      return value || fallback || key;
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return fallback || key;
    }
  }, [tPage, tCommon, getMultiLang]);
  
  // Função para extrair array multilíngua
  const getMultiLangArray = useMemo(() => {
    if (getArrayProp) return getArrayProp;
    
    return (value: any): any[] => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'object' && value !== null && (value.pt || value.en)) {
        return locale === 'pt' ? (value.pt || []) : (value.en || []);
      }
      return [];
    };
  }, [locale, getArrayProp]);

  switch (block.type) {
    case 'hero':
      return <HeroBlock block={block} t={t} tPage={tPage} getText={getMultiLang} />;

    case 'payments':
      return <PaymentsBlock block={block} getText={getMultiLang} locale={locale} />;

    case 'benefits':
      return <BenefitsBlock block={block} t={t} getText={getMultiLang} getArray={getMultiLangArray} />;

    case 'referral':
      return <ReferralBlock block={block} getText={getMultiLang} getArray={getMultiLangArray} locale={locale} />;

    case 'how_it_works':
      return <HowItWorksBlock block={block} t={t} getArray={getMultiLangArray} />;

    case 'services':
      return <ServicesBlock block={block} t={t} getText={getMultiLang} />;

    case 'testimonials':
      return <TestimonialsBlock block={block} t={t} getArray={getMultiLangArray} />;

    case 'faq':
      return <FAQBlock block={block} t={t} getArray={getMultiLangArray} />;

    case 'cta':
      return <CTABlock block={block} t={t} getText={getMultiLang} />;

    case 'card_with_highlight':
      return <CardWithHighlightBlock block={block} t={t} getText={getMultiLang} getArray={getMultiLangArray} />;

    case 'team':
      return <TeamBlock block={block} t={t} getArray={getMultiLangArray} />;

    case 'value_cards':
      return <ValueCardsBlock block={block} t={t} getText={getMultiLang} getArray={getMultiLangArray} />;

    case 'financing':
      return <FinancingBlock block={block} t={t} getText={getMultiLang} getArray={getMultiLangArray} />;

    case 'requirements':
      return <RequirementsBlock block={block} t={t} getArray={getMultiLangArray} />;

    case 'support':
      return <SupportBlock block={block} t={t} getArray={getMultiLangArray} />;

    case 'title_only':
      return <TitleOnlyBlock block={block} t={t} getText={getMultiLang} />;

    default:
      return null;
  }
}
