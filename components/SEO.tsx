import Head from "next/head";
import Script from "next/script";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;  
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  keywords?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  locale?: string;
}

export default function SEO({
  title,
  description,
  canonical,
  ogImage = "/img/conduz.png",
  ogType = "website",
  twitterCard = "summary_large_image",
  keywords = "TVDE Portugal, motorista TVDE, Uber Portugal, Bolt Portugal, mobilidade urbana, transporte privado, empresa TVDE, frota TVDE, licença TVDE",
  author = "Frota360",
  publishedTime,
  modifiedTime,
  locale = "pt",
}: SEOProps) {
  const siteUrl = "https://conduz.pt";
  const fullTitle = `${title} - Frota360`;

  // Limpar canonical removendo /en se presente
  const cleanCanonical = canonical?.replace(/^\/en/, '') || "/";
  const fullCanonical = new URL(cleanCanonical, siteUrl).toString();
  const fullOgImage = ogImage.startsWith("http") ? ogImage : new URL(ogImage, siteUrl).toString();
    
  const ogLocaleMap: Record<string, string> = {
    pt: "pt_PT",
    en: "en_GB",
    it: "it_IT",
    es: "es_ES",
    de: "de_DE",
    fr: "fr_FR",
  };
  const ogLocale = ogLocaleMap[locale] || "pt_PT";

  const locales = ["pt", "en"];
  const hreflangLinks = locales.map((loc) => {
    const lang =
      loc === "pt" ? "pt-PT" :
      loc === "en" ? "en-GB" : loc;

    const href = loc === 'en' 
      ? new URL(`/en${cleanCanonical === '/' ? '' : cleanCanonical}`, siteUrl).toString()
      : new URL(cleanCanonical, siteUrl).toString();

    return { rel: "alternate", hrefLang: lang, href };
  });

  // Site-wide metadata for structured data
  const siteName = "Frota360.pt";
  const siteDescriptionMap: Record<string, string> = {
    pt: "TVDE sem Fricção | Motoristas e Empresas em Portugal",
    en: "Frictionless TVDE | Drivers & Companies in Portugal",
  };
  const siteDescription = siteDescriptionMap[locale] || siteDescriptionMap.pt;

  // URL parsing utilities for page classification and breadcrumbs
  const urlObj = new URL(fullCanonical);
  const pathname = urlObj.pathname || "/";
  const pathSegments = pathname.replace(/\/+$/, "").split("/").filter(Boolean);

  // Narrowed locale for lookups
  const loc: 'pt' | 'en' = locale === 'en' ? 'en' : 'pt';

  const pageType = (() => {
    const first = pathSegments[0];
    if (!first) return "WebPage";
    if (["sobre", "about"].includes(first)) return "AboutPage";
    if (["contacto", "contact"].includes(first)) return "ContactPage";
    if (["para", "services"].includes(first)) return "CollectionPage";
    return "WebPage";
  })();

  const labelMap: Record<string, { pt: string; en: string }> = {
    sobre: { pt: "Sobre", en: "About" },
    about: { pt: "Sobre", en: "About" },
    contacto: { pt: "Contacto", en: "Contact" },
    contact: { pt: "Contacto", en: "Contact" },
    para: { pt: "Para", en: "For" },
    services: { pt: "Para", en: "Services" },
    motoristas: { pt: "Motoristas", en: "Drivers" },
    drivers: { pt: "Motoristas", en: "Drivers" },
    empresas: { pt: "Empresas", en: "Companies" },
    companies: { pt: "Empresas", en: "Companies" },
  };

  const breadcrumbItems = (() => {
    const items: any[] = [];
    let acc = "";
    items.push({
      "@type": "ListItem",
      position: 1,
      name: loc === "pt" ? "Início" : "Home",
      item: `${siteUrl}/`,
    });
    pathSegments.forEach((seg, idx) => {
      acc += `/${seg}`;
      items.push({
        "@type": "ListItem",
        position: idx + 2,
        name: labelMap[seg]?.[loc] ?? seg,
        item: `${siteUrl}${acc}`,
      });
    });
    return items;
  })();

  return (
    <>
      <Head>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <link rel="canonical" href={fullCanonical} />

        {hreflangLinks.map((link, i) => (
          <link key={i} rel={link.rel} hrefLang={link.hrefLang} href={link.href} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={fullCanonical} />

        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />

        <link rel="icon" href="/img/icone.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/img/conduz.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/img/icone.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/img/icone.png" />

        <meta property="og:type" content={ogType} />
        <meta property="og:url" content={fullCanonical} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={fullOgImage} />
        <meta property="og:image:secure_url" content={fullOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content={ogLocale} />
  <meta property="og:site_name" content={siteName} />

        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={fullOgImage} />
        <meta name="twitter:site" content="@conduz" />

        {publishedTime && <meta property="article:published_time" content={publishedTime} />}
        {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preload" href="/img/logo.png" as="image" />
      </Head>

      <Script id="structured-data" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${siteUrl}#organization`,
              "name": siteName,
              "url": siteUrl,
              "description": siteDescription,
              "logo": {
                "@type": "ImageObject",
                "url": `${siteUrl}/img/conduz.png`,
                "width": 500,
                "height": 500
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "contacto@conduz.pt",
                "telephone": "+351 913 415 670",
                "areaServed": "PT",
                "availableLanguage": ["pt-PT", "en-GB"]
              }
            },
            {
              "@type": pageType,
              "@id": `${fullCanonical}#webpage`,
              "url": fullCanonical,
              "name": fullTitle,
              "description": description,
              "inLanguage": ogLocale.replace("_", "-"),
              "isPartOf": { "@id": `${siteUrl}#website` },
              "primaryImageOfPage": {
                "@type": "ImageObject",
                "url": fullOgImage,
                "width": 1200,
                "height": 630
              },
              "breadcrumb": { "@id": `${fullCanonical}#breadcrumb` },
              "datePublished": publishedTime || new Date().toISOString(),
              "dateModified": modifiedTime || new Date().toISOString()
            },
            {
              "@type": "WebSite",
              "@id": `${siteUrl}#website`,
              "url": siteUrl,
              "name": siteName,
              "description": siteDescription,
              "publisher": { "@id": `${siteUrl}#organization` }
            },
            {
              "@type": "BreadcrumbList",
              "@id": `${fullCanonical}#breadcrumb`,
              "itemListElement": breadcrumbItems
            },
            // Optional: Service node for service-specific pages
            ...(pathSegments[0] && ["para", "services"].includes(pathSegments[0]) && pathSegments[1]
              ? [{
                  "@type": "Service",
                  "@id": `${fullCanonical}#service`,
                  "name": fullTitle,
                  "description": description,
                  "serviceType": "TVDE",
                  "areaServed": "PT",
                  "provider": { "@id": `${siteUrl}#organization` }
                }]
              : [])
          ]
        })}
      </Script>
    </>
  );
}
