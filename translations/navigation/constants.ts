// Constantes de tradução de navegação
export const NAVIGATION = {
  HOME: 'navigation.home',
  ABOUT: 'navigation.about',
  SERVICES: 'navigation.services',
  SERVICES_DRIVERS: 'navigation.servicesDrivers',
  CONTACT: 'navigation.contact',
  LOGIN: 'navigation.login',
  LOGOUT: 'navigation.logout',
  DASHBOARD: 'navigation.dashboard',
  PROFILE: 'navigation.profile',
  SETTINGS: 'navigation.settings',
  HELP: 'navigation.help',
  
  // Menu Admin
  ADMIN: {
    DASHBOARD: 'navigation.admin.dashboard',
    REQUESTS: 'navigation.admin.requests',
    DRIVERS: 'navigation.admin.drivers',
    CONTENT: 'navigation.admin.content',
    METRICS: 'navigation.admin.metrics',
    SETTINGS: 'navigation.admin.settings',
  },
  
  // Menu Motorista
  DRIVER: {
    DASHBOARD: 'navigation.driver.dashboard',
    PROFILE: 'navigation.driver.profile',
    STATUS: 'navigation.driver.status',
  },
} as const;
