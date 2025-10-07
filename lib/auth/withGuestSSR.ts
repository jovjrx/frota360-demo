import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { SessionData } from '@/lib/session/ironSession';
import { getTranslation } from '@/lib/translations';

interface GuestPageProps {
  translations: Record<string, any>;
  locale: string;
}

export function withGuestSSR<P extends { [key: string]: any } = { [key: string]: any }>(
  gssp: (context: GetServerSidePropsContext, user: SessionData['user'] | null) => Promise<GetServerSidePropsResult<P>>
): GetServerSideProps<P & GuestPageProps> {
  return async (context: GetServerSidePropsContext) => {
    const { req, res, locale } = context;
    const session = await getSession(req, res);

    // Redirect to dashboard if already logged in
    if (session.isLoggedIn) {
      const destination = session.user?.role === 'admin' ? '/admin' : '/driver/dashboard';
      return {
        redirect: {
          destination,
          permanent: false,
        },
      };
    }

    // Load translations for guest pages
    const commonTranslations = getTranslation('common', locale || 'pt');
    const guestTranslations = getTranslation('guest', locale || 'pt'); // Assuming 'guest' translations for login

    const result = await gssp(context, session.user || null);

    if ('props' in result) {
      return {
        props: {
          ...result.props,
          user: session.user || null,
          translations: {
            common: commonTranslations,
            page: guestTranslations,
          },
          locale: locale || 'pt',
        } as P & GuestPageProps,
      };
    }
    return result;
  };
}

