import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { getSession } from '@/lib/session';
import { loadTranslations } from '@/lib/translations';
import { 
  getDriverData, 
  getDriverContracheques,
  getDriverContracts,
  getDriverDocumentRequests,
  getDriverReferralsPreview,
  getDriverGoalsPreview,
} from '@/lib/auth/driverData';

export interface DashboardUser {
  uid: string;
  email: string;
  displayName: string | null;
  role: 'driver';
}

export type TFn = (key: string) => string;

export interface DashboardPageProps {
  user: DashboardUser;
  translations: {
    common: any;
    page: any;
    dashboard?: any;
  };
  locale: string;
  driverId: string;
  tCommon?: TFn;
  tPage?: TFn;
  tDashboard?: TFn;
  [key: string]: any;
}

type GetDashboardPageData<P = {}> = (
  context: GetServerSidePropsContext,
  user: DashboardUser,
  driverId: string
) => Promise<P> | P;

export interface DashboardSSROptions {
  /** Carregar dados completos do motorista */
  loadDriverData?: boolean;
  /** Carregar contracheques do motorista */
  loadContracheques?: boolean;
  /** Limite de contracheques a carregar */
  contrachequeLimit?: number;
  /** Carregar contratos pendentes de assinatura */
  loadContracts?: boolean;
  /** Limite de contratos a carregar */
  contractLimit?: number;
  /** Carregar documentos solicitados */
  loadDocuments?: boolean;
  /** Limite de documentos a carregar */
  documentLimit?: number;
  /** Carregar preview de indicações */
  loadReferrals?: boolean;
  /** Carregar preview de metas/bônus */
  loadGoals?: boolean;
}

/**
 * HOC para páginas do dashboard de motorista com SSR
 * 
 * Funcionalidades:
 * - Verifica autenticação obrigatória
 * - Verifica role driver (não admin)
 * - Carrega traduções: common + dashboard
 * - Opcionalmente carrega dados do motorista e contracheques
 * - Redireciona para login se não autenticado
 * - Redireciona para /admin se for admin
 * 
 * @param options - Opções para carregar dados adicionais
 * @param getPageData - Função opcional para carregar dados específicos da página
 * 
 * @example
 * ```typescript
 * export const getServerSideProps = withDashboardSSR(
 *   { loadDriverData: true, loadContracheques: true },
 *   async (context, user, driverId) => {
 *     const stats = await getDriverStats(driverId);
 *     return { stats };
 *   }
 * );
 * ```
 */
export function withDashboardSSR<P extends Record<string, any> = {}>(
  options?: DashboardSSROptions,
  getPageData?: GetDashboardPageData<P>
): GetServerSideProps<DashboardPageProps & P> {
  return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<DashboardPageProps & P>> => {
    const {
      loadDriverData = false,
      loadContracheques = false,
      contrachequeLimit = 2,
      loadContracts = false,
      contractLimit = 5,
      loadDocuments = false,
      documentLimit = 5,
      loadReferrals = false,
      loadGoals = false,
    } = options || {};

    try {
      // 1. Verificar autenticação
      const session = await getSession(context.req, context.res);

      if (!session?.isLoggedIn) {
        return {
          redirect: {
            destination: '/login?redirect=' + encodeURIComponent(context.resolvedUrl),
            permanent: false,
          },
        };
      }

      // 2. Verificar se é motorista (não admin)
      const userRole = session.user?.role || session.role;
      
      if (userRole === 'admin') {
        return {
          redirect: {
            destination: '/admin',
            permanent: false,
          },
        };
      }

      if (userRole !== 'driver') {
        return {
          redirect: {
            destination: '/login',
            permanent: false,
          },
        };
      }

      // 3. Verificar se tem email do motorista
      // ✅ IMPORTANTE: driverId é o EMAIL do motorista (não UID)
      const driverId = session.user?.email || session.email || session.driverId;
      
      if (!driverId) {
        console.error('❌ Email do motorista não encontrado na sessão:', session);
        return {
          redirect: {
            destination: '/login?error=no_email',
            permanent: false,
          },
        };
      }

      // 4. Carregar traduções (common/common + dashboard/dashboard)
      // Pegar locale do header x-locale (definido pelo middleware) ou usar padrão 'pt'
      const localeHeader = context.req.headers['x-locale'] as string | undefined;
      const locale = localeHeader || context.locale || context.defaultLocale || 'pt';
      
  const translations = await loadTranslations(locale, ['common/common', 'dashboard/dashboard']);
  const dashboardTranslations = translations['dashboard/dashboard'] || {};

      // 5. Preparar user
      const user: DashboardUser = {
        uid: driverId,
        email: session.user?.email || session.email || '',
        displayName: session.user?.name || session.name || null,
        role: 'driver',
      };

      // 6. Preparar props base
      const baseProps: DashboardPageProps & { motorista?: any; contracheques?: any } = {
        user,
        translations: {
          common: translations['common/common'] || {},
          page: dashboardTranslations,
          dashboard: dashboardTranslations,
        },
        locale,
        driverId,
      };

      // 7. Carregar dados do motorista se solicitado
      if (loadDriverData) {
        const driverData = await getDriverData(driverId);
        if (!driverData) {
          return {
            redirect: {
              destination: '/login?error=driver_not_found',
              permanent: false,
            },
          };
        }
        baseProps.motorista = driverData;
      }

      // 8. Carregar contracheques se solicitado
      if (loadContracheques) {
        const contracheques = await getDriverContracheques(driverId, contrachequeLimit);
        baseProps.contracheques = contracheques;
      }

      // 8.1 Carregar contratos pendentes se solicitado
      if (loadContracts) {
        const contracts = await getDriverContracts(driverId, contractLimit);
        baseProps.pendingContracts = contracts;
      }

      // 8.2 Carregar documentos solicitados se solicitado
      if (loadDocuments) {
        const documents = await getDriverDocumentRequests(driverId, documentLimit);
        baseProps.pendingDocuments = documents;
      }

      // 8.3 Carregar preview de indicações se solicitado
      if (loadReferrals) {
        const referrals = await getDriverReferralsPreview(driverId);
        baseProps.referralsPreview = referrals;
      }

      // 8.4 Carregar preview de metas/bônus se solicitado
      if (loadGoals) {
        const goals = await getDriverGoalsPreview(driverId);
        baseProps.goalsPreview = goals;
      }

      // 9. Carregar dados específicos da página
      if (getPageData) {
        const pageData = await getPageData(context, user, driverId);
        return {
          props: {
            ...baseProps,
            ...pageData,
          } as DashboardPageProps & P,
        };
      }

      return {
        props: baseProps as DashboardPageProps & P,
      };
    } catch (error) {
      console.error('Error in withDashboardSSR:', error);
      
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }
  };
}

