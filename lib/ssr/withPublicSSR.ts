import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getSession } from '@/lib/session';
import { loadTranslations } from '@/lib/translations';

export interface PublicPageUser {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'admin' | 'driver';
}

export type TFn = (key: string) => string;

export interface PublicPageProps {
  user: PublicPageUser | null;
  translations: {
    common: any;
    page: any;
  };
  locale: string;
  tCommon?: TFn;  // Opcional para compatibilidade, será adicionado pelo _app.tsx
  tPage?: TFn;    // Opcional para compatibilidade, será adicionado pelo _app.tsx
  [key: string]: any;
}

type GetPublicPageData<P = {}> = (
  context: GetServerSidePropsContext,
  user: PublicPageUser | null
) => Promise<P> | P;

/**
 * HOC para páginas públicas com SSR
 * 
 * Funcionalidades:
 * - Páginas acessíveis por qualquer pessoa (logada ou não)
 * - Carrega traduções: common + página específica
 * - Se usuário estiver logado, retorna dados do usuário
 * - Permite carregar dados específicos da página via SSR
 * - Opcionalmente redireciona usuários logados (para login/register)
 * 
 * @param pageName - Nome do arquivo de tradução da página (ex: 'home', 'about', 'contact')
 * @param getPageData - Função opcional para carregar dados específicos da página
 * @param redirectIfAuthenticated - Se true, redireciona usuários autenticados para dashboard/admin
 * 
 * @example
 * ```typescript
 * // Página pública normal
 * export const getServerSideProps = withPublicSSR('home');
 * 
 * // Página de login (redireciona se já logado)
 * export const getServerSideProps = withPublicSSR('common', undefined, true);
 * ```
 */
export function withPublicSSR<P extends Record<string, any> = {}>(
  pageName: string,
  getPageData?: GetPublicPageData<P>,
  redirectIfAuthenticated: boolean = false
): GetServerSideProps<PublicPageProps & P> {
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<PublicPageProps & P>> => {
    try {
      // 1. Verificar se usuário está logado (opcional)
      const session = await getSession(context.req, context.res);
      
      let user: PublicPageUser | null = null;
      if (session?.isLoggedIn && session.user) {
        // Se deve redirecionar usuários autenticados (páginas de login/register)
        if (redirectIfAuthenticated) {
          const destination = session.user.role === 'admin' ? '/admin' : '/dashboard';
          return {
            redirect: {
              destination,
              permanent: false,
            },
          };
        }
        
        const userRole = session.user.role || session.role;
        user = {
          uid: session.user.id || session.userId || '',
          email: session.user.email || session.email || '',
          displayName: session.user.name || session.name || null,
          role: (userRole === 'admin' || userRole === 'driver') ? userRole : 'driver',
        };
      }

      // 2. Carregar traduções (common/common + public/pageName)
      const locale = (context.locale || context.defaultLocale || 'pt') as string;
      const namespaces = pageName === 'common' 
        ? ['common/common'] 
        : ['common/common', `public/${pageName}`];
      const translations = await loadTranslations(locale, namespaces);

      // 3. Preparar props base
      const baseProps: PublicPageProps = {
        user,
        translations: {
          common: translations['common/common'] || {},
          page: translations[`public/${pageName}`] || {},
        },
        locale,
      };

      // 4. Carregar dados específicos da página
      if (getPageData) {
        const pageData = await getPageData(context, user);
        return {
          props: {
            ...baseProps,
            ...pageData,
          } as PublicPageProps & P,
        };
      }

      return {
        props: baseProps as PublicPageProps & P,
      };
    } catch (error) {
      console.error('Error in withPublicSSR:', error);
      
      // Em caso de erro, retornar props base válidas
      return {
        props: {
          user: null,
          translations: { common: {}, page: {} },
          locale: 'pt',
        } as PublicPageProps & P,
      };
    }
  };
}
