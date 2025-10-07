import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { SessionData } from '@/lib/session/ironSession';
import { loadTranslations } from '@/lib/translations';

export interface GuestPageProps {
  user: SessionData['user'] | null;
  translations: {
    common: any;
    guest: any;
  };
  locale: string;
  [key: string]: any;
}

type GetGuestPageData<P = {}> = (
  context: GetServerSidePropsContext,
  user: SessionData['user'] | null
) => Promise<P> | P;

/**
 * HOC para páginas de convidado (login, registro, etc) com SSR
 * 
 * Funcionalidades:
 * - Verifica se usuário NÃO está logado
 * - Redireciona para dashboard se já estiver logado
 * - Carrega traduções
 * - Carrega dados específicos da página
 * 
 * @example
 * ```typescript
 * export const getServerSideProps = withGuestSSR(async (context, user) => {
 *   // Retornar dados específicos da página
 *   return {};
 * });
 * ```
 */
export function withGuestSSR<P extends Record<string, any> = {}>(
  getPageData?: GetGuestPageData<P>
): GetServerSideProps<GuestPageProps & P> {
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<GuestPageProps & P>> => {
    try {
      // 1. Verificar se usuário já está logado
      const { req, res, locale } = context;
      const session = await getSession(req, res);

      // Redirecionar para dashboard se já estiver logado
      if (session.isLoggedIn && session.user) {
        const destination = session.user.role === 'admin' ? '/admin' : '/dashboard';
        return {
          redirect: {
            destination,
            permanent: false,
          },
        };
      }

      // 2. Carregar traduções
      const localeStr = (locale || context.defaultLocale || 'pt') as string;
      const translations = await loadTranslations(localeStr, ['common', 'guest']);

      // 3. Preparar props base
      const baseProps: GuestPageProps = {
        user: session.user || null,
        translations: {
          common: translations.common || {},
          guest: translations.guest || {},
        },
        locale: localeStr,
      };

      // 4. Carregar dados específicos da página
      if (getPageData) {
        const pageData = await getPageData(context, session.user || null);
        return {
          props: {
            ...baseProps,
            ...pageData,
          } as GuestPageProps & P,
        };
      }

      // 5. Retornar apenas props base
      return {
        props: baseProps as GuestPageProps & P,
      };
    } catch (error) {
      console.error('Error in withGuestSSR:', error);
      // Em caso de erro, retornar props vazias mas válidas
      return {
        props: {
          user: null,
          translations: { common: {}, guest: {} },
          locale: 'pt',
        } as GuestPageProps & P,
      };
    }
  };
}

