import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { requireAdmin, AdminUser } from './requireAdmin';
import { loadTranslations } from '@/lib/translations';
import { ADMIN } from '@/translations';

export interface AdminPageProps {
  user: AdminUser;
  translations: {
    common: any;
    admin: any;
  };
  locale: string;
  [key: string]: any;
}

type GetAdminPageData<P = {}> = (
  context: GetServerSidePropsContext,
  user: AdminUser
) => Promise<P> | P;

/**
 * HOC para páginas admin com SSR
 * 
 * Funcionalidades:
 * - Verifica autenticação
 * - Verifica role admin
 * - Carrega traduções
 * - Carrega dados específicos da página
 * - Redireciona se não autorizado
 * 
 * @example
 * ```typescript
 * export const getServerSideProps = withAdminSSR(async (context, user) => {
 *   const drivers = await getDrivers();
 *   return { drivers };
 * });
 * ```
 */
export function withAdminSSR<P extends Record<string, any> = {}>(
  getPageData?: GetAdminPageData<P>
): GetServerSideProps<AdminPageProps & P> {
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<AdminPageProps & P>> => {
    try {
      // 1. Verificar autenticação e role admin
      const user = await requireAdmin(context);

      if (!user) {
        return {
          redirect: {
            destination: '/login?redirect=' + encodeURIComponent(context.resolvedUrl),
            permanent: false,
          },
        };
      }

      // 2. Carregar traduções
      const locale = (context.locale || context.defaultLocale || 'pt') as string;
      const translations = await loadTranslations(locale);
      const adminTranslations = ADMIN; // ADMIN constants são keys, não traduções por locale

      // 3. Preparar props base
      const baseProps: AdminPageProps = {
        user,
        translations: {
          common: translations,
          admin: adminTranslations,
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
          } as AdminPageProps & P,
        };
      }

      return {
        props: baseProps as AdminPageProps & P,
      };
    } catch (error) {
      console.error('Error in withAdminSSR:', error);
      
      // Em caso de erro, redirecionar para login
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }
  };
}
