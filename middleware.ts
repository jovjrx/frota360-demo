import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Se a URL começa com /en/ ou é /en, remover o /en e reescrever com header de idioma inglês
  if (pathname.startsWith('/en/') || pathname === '/en') {
    const newPath = pathname === '/en' ? '/' : pathname.replace('/en', '');
    const newUrl = new URL(newPath, request.url);
    
    // Criar resposta que continua para a nova URL com header de idioma
    const response = NextResponse.rewrite(newUrl);
    response.headers.set('x-locale', 'en');
    return response;
  }
  
  // Para todas as outras rotas, definir locale como português (padrão)
  const response = NextResponse.next();
  response.headers.set('x-locale', 'pt');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
