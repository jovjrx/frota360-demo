/**
 * Wrappers SSR Centralizados
 * 
 * Este módulo exporta os 3 wrappers principais para SSR no projeto:
 * - withPublicSSR: Para páginas públicas (home, about, contact, etc)
 * - withAdminSSR: Para páginas administrativas (/admin/*)
 * - withDashboardSSR: Para páginas do dashboard de motorista (/dashboard/*)
 */

export { withPublicSSR } from './withPublicSSR';
export type { PublicPageProps, PublicPageUser } from './withPublicSSR';

export { withAdminSSR } from './withAdminSSR';
export type { AdminPageProps, AdminUser } from './withAdminSSR';

export { withDashboardSSR } from './withDashboardSSR';
export type { DashboardPageProps, DashboardUser, DashboardSSROptions } from './withDashboardSSR';
