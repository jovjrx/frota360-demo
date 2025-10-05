import { GetServerSidePropsContext } from 'next';
import { getSession } from '@/lib/session';
import { loadTranslations } from '@/lib/translations';

export async function checkAdminAuth(context: GetServerSidePropsContext) {
  try {
    const session = await getSession(context.req, context.res);

    // Verificar se está logado
    if (!session?.isLoggedIn) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Verificar se é admin (verificar ambos os locais possíveis)
    const isAdmin = session.role === 'admin' || session.user?.role === 'admin';
    
    if (!isAdmin) {
      return {
        redirect: {
          destination: '/drivers',
          permanent: false,
        },
      };
    }

    // Carregar traduções
    const locale = Array.isArray(context.req.headers['x-locale'])
      ? context.req.headers['x-locale'][0]
      : context.req.headers['x-locale'] || 'pt';

    const translations = await loadTranslations(locale, ['common', 'admin']);
    const { common, admin: page } = translations;

    return {
      props: {
        translations: { common, page },
        locale,
      },
    };
  } catch (error) {
    console.error('Admin auth check failed:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
}
