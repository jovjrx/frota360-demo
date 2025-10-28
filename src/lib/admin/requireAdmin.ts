import { GetServerSidePropsContext } from 'next';
import { getSession } from '@/lib/session';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'admin';
}

export async function requireAdmin(
  context: GetServerSidePropsContext
): Promise<AdminUser | null> {
  try {
    const session = await getSession(context.req, context.res);

    // Verificar se está logado
    if (!session?.isLoggedIn) {
      return null;
    }

    // Verificar se é admin (verificar ambos os locais possíveis)
    const isAdmin = session.role === 'admin' || session.user?.role === 'admin';
    
    if (!isAdmin) {
      return null;
    }

    // Retornar dados do usuário admin
    // SessionData tem: userId, role, email, name, user.id, user.role, user.email, user.name
    return {
      uid: session.user?.id || session.userId || '',
      email: session.user?.email || session.email || '',
      displayName: session.user?.name || session.name || null,
      role: 'admin',
    };
  } catch (error) {
    console.error('Error verifying admin:', error);
    return null;
  }
}

