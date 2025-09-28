import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="pt">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <meta charSet="utf-8" />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Forçar tema claro antes do Chakra UI carregar
            localStorage.setItem('chakra-ui-color-mode', 'light');
            document.documentElement.setAttribute('data-theme', 'light');
          `
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

