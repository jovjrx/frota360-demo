import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, locale } = request.nextUrl;
  
  // Verificar se é uma rota protegida
  const isAdminRoute = pathname.startsWith('/admin');
  const isDriverRoute = pathname.startsWith('/drivers');
  const isApiRoute = pathname.startsWith('/api');
  
  // Verificar autenticação para rotas protegidas
  if (isAdminRoute || isDriverRoute) {
    const token = request.cookies.get('auth-token');
    const userType = request.cookies.get('user-type');
    
    // Se não há token, redirecionar para login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Verificar se o tipo de usuário corresponde à rota
    if (isAdminRoute && userType?.value !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    
    if (isDriverRoute && userType?.value !== 'driver') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  // Configurar headers de segurança
  const response = NextResponse.next();
  
  // Headers de segurança
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP (Content Security Policy)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  // Adicionar locale aos headers para uso nas páginas
  response.headers.set('x-locale', locale || 'pt');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
