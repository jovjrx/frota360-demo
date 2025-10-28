// pages/_app.tsx
import React, { useMemo } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { GoogleAnalytics } from "nextjs-google-analytics";
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import FacebookPixel from '@/components/layouts/FacebookPixel';
import { theme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { LanguageProvider } from "@/components/providers/Language";
import { AuthProvider } from "@/components/providers/Auth";
import { SiteSettingsProvider } from "@/components/providers/SiteSettings";
import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import SEO from "@/components/layouts/SEO";
import { makeT, makeTArray, ns } from "@/lib/i18n-helpers";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-6YFDWZFGV7";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const translations = (pageProps as any)?.translations || {};
  const { common = {}, page = {} } = translations;

  // Extrair dados do usuário do SSR se disponíveis (de withAdminSSR ou withDriverSSR)
  // Usar useMemo para evitar recriação desnecessária mas permitir atualização na navegação
  const serverUser = useMemo(() => (pageProps as any)?.user || null, [pageProps]);

  // Converter serverUser para formato do AuthProvider se disponível
  const initialUserData = useMemo(() => serverUser ? {
    uid: serverUser.uid,
    email: serverUser.email,
    role: serverUser.role,
    name: serverUser.displayName || serverUser.email,
  } : null, [serverUser]);

  const tCommon = useMemo(() => makeT(common), [common]);
  const tPage = useMemo(() => makeT(page), [page]);
  const tArray = useMemo(() => makeTArray(translations), [translations]);
  const scopedNs = useMemo(() => ns(makeT(translations)), [translations]);


  const getCurrentPage = () => {
    const path = router.pathname;
    if (path === "/") return "home";
    if (path === "/about") return "about";
    if (path === "/drivers") return "drivers";
    if (path === "/contact") return "contact";
    if (path === "/login") return "login";
    if (path === "/signup") return "signup";
    return "home";
  };

  const getPageTitle = () => {
    const path = router.pathname;
    const locale = router.locale || 'pt';
    const isAdminPath = path.startsWith('/admin');
    const isDashboardPath = path.startsWith('/dashboard');
    
    // Função auxiliar para traduzir partes do título
    const getSegmentName = (segment: string): string => {
      const titleMap: Record<string, Record<string, string>> = {
        pt: {
          'payments': 'Pagamentos',
          'drivers': 'Motoristas',
          'documents': 'Documentos',
          'financing': 'Financiamento',
          'contracts': 'Contratos',
          'goals': 'Metas',
          'commissions': 'Comissões',
          'referrals': 'Referências',
          'performance': 'Desempenho',
          'monitor': 'Monitor',
          'data': 'Dados',
          'settings': 'Configurações',
          'users': 'Utilizadores',
          'pages': 'Páginas',
          'integrations': 'Integrações',
          'index': '',
          'profile': 'Perfil',
          'tracking': 'Rastreamento',
          'referral': 'Referência',
          'payslips': 'Recibos',
          'recruitment': 'Recrutamento',
          'financial-performance': 'Desempenho Financeiro',
        },
        en: {
          'payments': 'Payments',
          'drivers': 'Drivers',
          'documents': 'Documents',
          'financing': 'Financing',
          'contracts': 'Contracts',
          'goals': 'Goals',
          'commissions': 'Commissions',
          'referrals': 'Referrals',
          'performance': 'Performance',
          'monitor': 'Monitor',
          'data': 'Data',
          'settings': 'Settings',
          'users': 'Users',
          'pages': 'Pages',
          'integrations': 'Integrations',
          'index': '',
          'profile': 'Profile',
          'tracking': 'Tracking',
          'referral': 'Referral',
          'payslips': 'Payslips',
          'recruitment': 'Recruitment',
          'financial-performance': 'Financial Performance',
        },
      };
      
      const localeMap = titleMap[locale] || titleMap['pt'];
      return localeMap[segment] || segment;
    };

    if (isAdminPath) {
      const adminPrefix = locale === 'en' ? 'Administration' : 'Administração';
      const pathSegments = path.replace('/admin', '').split('/').filter(Boolean);
      
      if (pathSegments.length === 0) {
        return locale === 'en' ? `${adminPrefix}` : adminPrefix;
      }
      
      const pageName = getSegmentName(pathSegments[0]);
      return pageName ? `${adminPrefix} | ${pageName}` : adminPrefix;
    }
    
    if (isDashboardPath) {
      const dashboardPrefix = locale === 'en' ? 'Driver Panel' : 'Painel do Motorista';
      const pathSegments = path.replace('/dashboard', '').split('/').filter(Boolean);
      
      if (pathSegments.length === 0) {
        return dashboardPrefix;
      }
      
      const pageName = getSegmentName(pathSegments[0]);
      return pageName ? `${dashboardPrefix} | ${pageName}` : dashboardPrefix;
    }

    // Páginas públicas
    const currentPage = getCurrentPage();
    const pageSEO = tCommon(`seo.pages.${currentPage}`);
    return (pageSEO as any)?.title || tCommon("seo.default.title");
  };

  const currentPage = getCurrentPage();
  const pageSEO = tCommon(`seo.pages.${currentPage}`);
  const pageTitle = getPageTitle();
  
  // Detectar locale atual baseado na URL
  const currentLocale = useMemo(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/en')) return 'en';
    }
    return (pageProps as any)?.locale || 'pt';
  }, [pageProps, router.asPath]);

  return (
    <>
      <style jsx global>{`
        :root { 
          --font-rubik: ${fonts.rubik.style.fontFamily};
        }
      `}</style>

      <ColorModeScript initialColorMode="light" />

      <ChakraProvider theme={theme}>
        <LanguageProvider>
          <SiteSettingsProvider>
            <AuthProvider initialUserData={initialUserData}>
              <SEO
              title={pageTitle}
              description={(pageSEO as any)?.description || tCommon("seo.default.description")}
              keywords={(pageSEO as any)?.keywords || tCommon("seo.default.keywords")}
              ogImage={tCommon("seo.default.image")}
              canonical={router.asPath.replace('/en', '')}
              locale={currentLocale}
            />

            <Header
              t={tCommon}
              tPage={tPage}
              panel={router.pathname.startsWith("/admin") || router.pathname.startsWith("/dashboard")}
              serverUser={serverUser}
            />
            <Component
              key={router.locale}
              {...pageProps}
              tCommon={tCommon}
              tPage={tPage}
              tArray={tArray}
              ns={scopedNs}
            />
            <Footer t={tCommon} panel={router.pathname.startsWith("/admin") || router.pathname.startsWith("/dashboard")} />
            <GoogleAnalytics gaMeasurementId={GA_ID} trackPageViews />
            <FacebookPixel />
            <Analytics />
            <SpeedInsights />
            </AuthProvider>
          </SiteSettingsProvider>
        </LanguageProvider>
      </ChakraProvider>
    </>
  );
}

