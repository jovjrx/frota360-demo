// pages/_app.tsx
import React, { useMemo } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { GoogleAnalytics } from "nextjs-google-analytics";
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { theme } from "@/lib/theme";
import { fonts } from "@/lib/fonts";
import { LanguageProvider } from "@/components/Language";
import { AuthProvider } from "@/lib/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { makeT, makeTArray, ns } from "@/lib/i18n-helpers";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-6YFDWZFGV7";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const translations = (pageProps as any)?.translations || {};
  const { common = {}, page = {} } = translations;

  const tCommon = useMemo(() => makeT(common), [common]);
  const tPage = useMemo(() => makeT(page), [page]);
  const tArray = useMemo(() => makeTArray(translations), [translations]);
  const scopedNs = useMemo(() => ns(makeT(translations)), [translations]);


  const getCurrentPage = () => {
    const path = router.pathname;
    if (path === "/") return "home";
    if (path === "/about") return "about";
    if (path === "/services-drivers") return "services";
    if (path === "/services-companies") return "services-companies";
    if (path === "/contact") return "contact";
    if (path === "/login") return "login";
    if (path === "/signup") return "signup";
    return "home";
  };

  const currentPage = getCurrentPage();
  const pageSEO = tCommon(`seo.pages.${currentPage}`);

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
          <AuthProvider>
            <SEO
              title={(pageSEO as any)?.title || tCommon("seo.default.title")}
              description={(pageSEO as any)?.description || tCommon("seo.default.description")}
              keywords={(pageSEO as any)?.keywords || tCommon("seo.default.keywords")}
              ogImage={tCommon("seo.default.image")}
              canonical={router.asPath}
              locale={router.locale ?? "pt"}
            />

            <Header t={tCommon} panel={router.pathname.startsWith("/admin") || router.pathname.startsWith("/dashboard")} />
            <Component
              key={router.locale}
              {...pageProps}
              tCommon={tCommon}
              tPage={tPage}
              tArray={tArray}
              ns={scopedNs}
            />
            <Footer t={tCommon} />
            <GoogleAnalytics gaMeasurementId={GA_ID} trackPageViews />
            <Analytics />
            <SpeedInsights />
          </AuthProvider>
        </LanguageProvider>
      </ChakraProvider>
    </>
  );
}
