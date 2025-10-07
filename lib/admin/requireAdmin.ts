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
    return {
      uid: session.user?.uid || session.uid || '',
      email: session.user?.email || session.email || '',
      displayName: session.user?.displayName || session.displayName || null,
      role: 'admin',
    };
  } catch (error) {
    console.error('Error verifying admin:', error);
    return null;
  }
}
