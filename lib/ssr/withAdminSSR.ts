import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { requireAdmin, AdminUser } from '@/lib/admin/requireAdmin';
import { loadTranslations } from '@/lib/translations';

export type TFn = (key: string) => string;

export interface AdminPageProps {
  user: AdminUser;
  translations: {
    common: any;
    page: any;
    admin?: any;
  };
  locale: string;
  tCommon?: TFn;
  tPage?: TFn;
  tAdmin?: TFn;
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
 * - Verifica autenticação obrigatória
 * - Verifica role admin
 * - Carrega traduções: common + admin
 * - Permite carregar dados específicos da página via SSR
 * - Dados carregados podem ser usados como fallback para SWR
 * - Redireciona para login se não autenticado
 * 
 * @param getPageData - Função opcional para carregar dados específicos da página
 * 
 * @example
 * ```typescript
 * export const getServerSideProps = withAdminSSR(async (context, user) => {
 *   const drivers = await getDrivers();
 *   return { drivers }; // Será usado como fallback no SWR
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

      // 2. Carregar traduções (common/common + admin/admin)
      const locale = (context.locale || context.defaultLocale || 'pt') as string;
      const translations = await loadTranslations(locale, ['common/common', 'admin/admin']);
      const adminTranslations = translations['admin/admin'] || {};

      // 3. Preparar props base
      const baseProps: AdminPageProps = {
        user,
        translations: {
          common: translations['common/common'] || {},
          page: adminTranslations,
          admin: adminTranslations,
        },
        locale,
      };

      // 4. Carregar dados específicos da página
      // Estes dados podem ser usados como fallback para SWR
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

// Re-export tipos para compatibilidade
export type { AdminUser } from '@/lib/admin/requireAdmin';
