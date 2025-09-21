import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se é uma rota protegida
  const isAdminRoute = pathname.startsWith('/admin');
  const isDriverRoute = pathname.startsWith('/drivers');
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');
  
  // Verificar autenticação para rotas protegidas
  if (isAdminRoute || isDriverRoute) {
    // Verificar se há sessão ativa (Iron Session)
    const sessionCookie = request.cookies.get('conduz-session');
    
    // Se não há sessão, redirecionar para login
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Para rotas específicas, verificar se o usuário está logado via Firebase
    // Isso será verificado no lado do cliente pelos componentes withAuth/withAdmin
  }
  
  // Configurar headers de segurança
  const response = NextResponse.next();
  
  return response;
}

export const config = {
  matcher: [
    // Proteger rotas de admin e drivers
    '/admin/:path*',
    '/drivers/:path*',
    // Excluir arquivos estáticos e APIs
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};
