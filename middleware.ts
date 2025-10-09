import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPPORTED_LOCALES = ['pt', 'en'];
const DEFAULT_LOCALE = 'pt';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Se a URL começa com /en/, remover o /en e continuar com header de idioma
  if (pathname.startsWith('/en/')) {
    const newPath = pathname.replace('/en', '') || '/';
    const newUrl = new URL(newPath, request.url);
    
    // Criar resposta que continua para a nova URL com header de idioma
    const response = NextResponse.rewrite(newUrl);
    response.headers.set('x-locale', 'en');
    return response;
  }
  
  // Se a URL é exatamente /en, reescrever para / com header de idioma
  if (pathname === '/en') {
    const newUrl = new URL('/', request.url);
    const response = NextResponse.rewrite(newUrl);
    response.headers.set('x-locale', 'en');
    return response;
  }
  
  // Para todas as outras rotas, verificar se é uma rota pública
  const isPublicPage = pathname === '/' || 
                      pathname.startsWith('/about') || 
                      pathname.startsWith('/contact') || 
                      pathname.startsWith('/drivers') ||
                      pathname.startsWith('/login') || // Adicionado para considerar /login como página pública
                      pathname.startsWith('/reset-password') ||
                      pathname.startsWith('/forgot-password');
  
  // Se não é uma rota pública, permitir acesso normal (português padrão)
  if (!isPublicPage) {
    const response = NextResponse.next();
    response.headers.set('x-locale', 'pt');
    return response;
  }
  
  // Para rotas públicas, verificar preferência de idioma do navegador
  const acceptLanguage = request.headers.get('accept-language') || '';
  const preferredLocale = getPreferredLocale(acceptLanguage);
  
  // Se o idioma preferido é inglês E o navegador explicitamente prefere inglês, redirecionar
  if (preferredLocale === 'en') {
    const redirectUrl = new URL(`/en${pathname}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Para português (padrão), permitir acesso normal
  const response = NextResponse.next();
  response.headers.set('x-locale', 'pt');
  
  return response;
}

function getPreferredLocale(acceptLanguage: string): string {
  // Parse accept-language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [locale, qValue] = lang.trim().split(';q=');
      return {
        locale: locale ? locale.split('-')[0].toLowerCase() : DEFAULT_LOCALE,
        quality: qValue ? parseFloat(qValue) : 1.0
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // Só retorna inglês se for a primeira preferência com qualidade alta
  // ou se explicitamente configurado como preferência principal
  const topLanguage = languages[0];
  if (topLanguage && topLanguage.locale === 'en' && topLanguage.quality >= 0.8) {
    return 'en';
  }

  // Para qualquer outro caso, incluindo pt-BR, pt-PT, ou indefinido, retorna português
  return DEFAULT_LOCALE;
}

export const config = {
  matcher: [
    // Proteger rotas de admin e drivers
    '/admin/:path*',
    '/painel/:path*',
    // Excluir arquivos estáticos e APIs
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)/',
  ],
};
