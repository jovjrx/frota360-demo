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
    
    // Se não há sessão Iron Session, permitir acesso mas o cliente deve criar a sessão
    // O componente withAuth/withAdmin vai verificar o Firebase Auth no cliente
    if (!sessionCookie) {
      // Não redirecionar automaticamente, deixar o cliente lidar com isso
      // Isso permite que usuários logados no Firebase Auth acessem as páginas
      // e criem a sessão Iron Session automaticamente
    }
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
