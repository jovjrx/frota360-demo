import { GetServerSidePropsContext } from 'next';
import { getSession } from '@/lib/session';
import { loadTranslations } from '@/lib/translations';
import { getDriverData, getDriverContracheques } from './driverData';

export async function checkDriverAuth(context: GetServerSidePropsContext, options?: {
  loadDriverData?: boolean;
  loadContracheques?: boolean;
  contrachequeLimit?: number;
}) {
  const {
    loadDriverData = false,
    loadContracheques = false,
    contrachequeLimit = 2
  } = options || {};

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

    // Verificar se é motorista (não é admin)
    const isAdmin = session.role === 'admin' || session.user?.role === 'admin';
    
    if (isAdmin) {
      // Se for admin, redirecionar para área admin
      return {
        redirect: {
          destination: '/admin',
          permanent: false,
        },
      };
    }

    // Verificar se tem dados de motorista (userId deve existir para motoristas)
    if (!session.userId) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Carregar traduções
    const locale = Array.isArray(context.req.headers['x-locale'])
      ? context.req.headers['x-locale'][0]
      : context.req.headers['x-locale'] || 'pt';

    const translations = await loadTranslations(locale, ['common', 'painel']);
    const { common, painel: page } = translations;

    // Props base
    const props: any = {
      translations: { common, page },
      locale,
      driverId: session.userId,
      session: {
        isLoggedIn: session.isLoggedIn,
        userId: session.userId,
        email: session.email,
        role: session.role,
      },
    };

    // Carregar dados do motorista se solicitado
    if (loadDriverData) {
      const driverData = await getDriverData(session.userId);
      if (!driverData) {
        // Motorista não encontrado ou inativo
        return {
          redirect: {
            destination: '/login?error=driver_not_found',
            permanent: false,
          },
        };
      }
      props.motorista = driverData;
    }

    // Carregar contracheques se solicitado
    if (loadContracheques) {
      const contracheques = await getDriverContracheques(session.userId, contrachequeLimit);
      props.contracheques = contracheques;
    }

    return {
      props,
    };
  } catch (error) {
    console.error('Driver auth check failed:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
}