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
  // Adicionar locale aos headers para uso nas páginas
  response.headers.set('x-locale', locale || 'pt');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
