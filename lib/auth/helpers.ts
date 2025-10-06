import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';

/**
 * Verifica se o usuário é admin
 * Checa tanto session.role quanto session.user.role para compatibilidade
 */
export function isAdmin(session: any): boolean {
  if (!session?.isLoggedIn) return false;
  return session.role === 'admin' || session?.user?.role === 'admin';
}

/**
 * Middleware para verificar autenticação admin em APIs
 * Retorna a sessão se for admin, ou envia resposta 401 e retorna null
 */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<any | null> {
  const session = await getSession(req, res);
  
  if (!session?.isLoggedIn || !isAdmin(session)) {
    res.status(401).json({
      success: false,
      error: 'Não autorizado',
    });
    return null;
  }
  
  return session;
}
