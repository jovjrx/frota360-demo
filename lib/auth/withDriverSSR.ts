import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { SessionData } from '@/lib/session/ironSession';
import { loadTranslations } from '@/lib/translations';

interface DriverPageProps {
  user: SessionData['user'];
  translations: { [namespace: string]: Record<string, any> };
  locale: string;
}

export function withDriverSSR<P extends { [key: string]: any } = { [key: string]: any }>(
  gssp: (context: GetServerSidePropsContext, user: SessionData['user']) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P & DriverPageProps> {
  return async (context: GetServerSidePropsContext) => {
    const { req, res, locale } = context;
    const session = await getSession(req, res);

    // Redirect to login if not logged in or not a driver
    if (!session.isLoggedIn || session.user?.role !== 'driver') {
      return {
        redirect: {
          destination: '/driver/login',
          permanent: false,
        },
      };
    }

    // Load translations for the driver dashboard
    const loadedTranslations = await loadTranslations(locale || 'pt', ['common', 'driver']);

    const result = await gssp(context, session.user);

    if ('props' in result) {
      return {
        props: {
          ...result.props,
          user: session.user,
          translations: loadedTranslations,
          locale: locale || 'pt',
        } as P & DriverPageProps,
      };
    }
    return result;
  };
}

