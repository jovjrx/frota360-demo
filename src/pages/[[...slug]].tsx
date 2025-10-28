import { GetServerSideProps } from 'next';
import { withPublicSSR, PublicPageProps } from '@/lib/ssr';
import { DynamicPageContent } from '@/components/public/DynamicPageContent';
import { getPageConfig } from '@/lib/pages';
import { resolveBlockTranslations } from '@/lib/resolve-block-translations';

interface PageProps extends PublicPageProps {
  pageBlocks?: any;
  slug?: string;
}

export default function DynamicPage({ tPage, tCommon, pageBlocks, locale }: PageProps) {
  return (
    <DynamicPageContent 
      blocks={pageBlocks?.blocks} 
      tPage={tPage} 
      tCommon={tCommon} 
      locale={locale} 
    />
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // [[...slug]] captura array, precisa converter
  const slugArray = context.params?.slug as string[] | undefined;
  const slug = Array.isArray(slugArray) ? slugArray.join('/') : (slugArray as string | undefined);

  // Se não tem slug (rota raiz "/"), trata como 'home'
  // Também trata caso seja array vazio [''] que significa rota raiz
  const pageSlug = (slug && slug.trim() !== '') ? slug : 'home';

  // NÃO processar rotas de API - deixar Next.js lidar com elas
  if (pageSlug.startsWith('api/')) {
    // Retorna 404 (página não existe) para que o Next.js continue processando como API
    return { notFound: true };
  }

  // Busca a página do Firebase (ou fallback para data/pages)
  try {
    const pageBlocks = await getPageConfig(pageSlug);

    // Se não encontrou a página e NÃO é a home, redireciona para home
    if (!pageBlocks || !pageBlocks.blocks || pageBlocks.blocks.length === 0) {
      if (pageSlug !== 'home') {
        console.warn(`Página ${pageSlug} não encontrada, redirecionando para home`);
        return { redirect: { destination: '/', permanent: false } };
      }
      // Se é a home e não tem blocos, retorna vazio
      return { props: { pageBlocks: { blocks: [] }, slug: pageSlug } };
    }

    // Carrega traduções
    const { loadTranslations } = await import('@/lib/translations');
    // Locale vem do header x-locale (definido pelo middleware) ou default PT
    const localeHeader = context.req.headers['x-locale'] as string | undefined;
    const locale = localeHeader || context.locale || 'pt';
    
    // Mapeia slug para namespace de tradução correto
    const translationMap: { [key: string]: string } = {
      home: 'public/home',
      drivers: 'public/services-drivers',
      companies: 'public/services-companies',
      about: 'public/about',
      contact: 'public/contact',
      request: 'public/request',
    };
    
    const translationNamespace = translationMap[pageSlug] || (pageSlug === 'home' ? 'public/home' : `public/${pageSlug}`);
    // Carrega home também para ter acesso a payments/referral em todas as páginas
    const translationsData = await loadTranslations(locale, ['common/common', 'public/home', translationNamespace]);

    // Função para fazer merge profundo preservando chaves aninhadas
    const deepMerge = (target: any, source: any): any => {
      const output = { ...target };
      if (typeof source === 'object' && source !== null) {
        Object.keys(source).forEach(key => {
          if (key in output && typeof output[key] === 'object' && typeof source[key] === 'object' && !Array.isArray(output[key]) && !Array.isArray(source[key])) {
            output[key] = deepMerge(output[key], source[key]);
          } else {
            output[key] = source[key];
          }
        });
      }
      return output;
    };

    // Se não é home, adiciona traduções de home preservando blocos nativos
    const pageTranslations = pageSlug === 'home' 
      ? translationsData[translationNamespace] || {}
      : deepMerge(translationsData['public/home'] || {}, translationsData[translationNamespace] || {});

    // Resolve blocos que usam chaves de tradução (ex: "benefits.items")
    const resolvedBlocks = resolveBlockTranslations(
      pageBlocks.blocks,
      {
        common: translationsData['common/common'] || {},
        page: pageTranslations,
      },
      locale
    );

    const finalTranslations = {
      common: translationsData['common/common'] || {},
      page: pageTranslations,
    };

    return {
      props: {
        user: null,
        translations: finalTranslations,
        locale,
        pageBlocks: { blocks: resolvedBlocks },
        slug: pageSlug,
      },
    };
  } catch (error) {
    console.error(`Erro ao buscar página ${pageSlug}:`, error);
    return { redirect: { destination: '/', permanent: false } };
  }
};

