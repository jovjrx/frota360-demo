// Constantes de tradução do painel admin
export const ADMIN = {
  DASHBOARD: {
    TITLE: 'admin.dashboard.title',
    SUBTITLE: 'admin.dashboard.subtitle',
    WELCOME: 'admin.dashboard.welcome',
  },
  
  REQUESTS: {
    TITLE: 'admin.requests.title',
    SUBTITLE: 'admin.requests.subtitle',
    NEW_REQUESTS: 'admin.requests.newRequests',
    PENDING: 'admin.requests.pending',
    APPROVED: 'admin.requests.approved',
    REJECTED: 'admin.requests.rejected',
    
    TABLE: {
      NAME: 'admin.requests.table.name',
      EMAIL: 'admin.requests.table.email',
      PHONE: 'admin.requests.table.phone',
      TYPE: 'admin.requests.table.type',
      STATUS: 'admin.requests.table.status',
      DATE: 'admin.requests.table.date',
      ACTIONS: 'admin.requests.table.actions',
    },
    
    ACTIONS: {
      VIEW: 'admin.requests.actions.view',
      APPROVE: 'admin.requests.actions.approve',
      REJECT: 'admin.requests.actions.reject',
      CONTACT: 'admin.requests.actions.contact',
      DELETE: 'admin.requests.actions.delete',
    },
    
    MODAL: {
      TITLE: 'admin.requests.modal.title',
      APPROVE_CONFIRM: 'admin.requests.modal.approveConfirm',
      REJECT_CONFIRM: 'admin.requests.modal.rejectConfirm',
      REJECT_REASON: 'admin.requests.modal.rejectReason',
      NOTES: 'admin.requests.modal.notes',
    },
  },
  
  DRIVERS: {
    TITLE: 'admin.drivers.title',
    SUBTITLE: 'admin.drivers.subtitle',
    TOTAL: 'admin.drivers.total',
    ACTIVE: 'admin.drivers.active',
    INACTIVE: 'admin.drivers.inactive',
    
    TABLE: {
      NAME: 'admin.drivers.table.name',
      EMAIL: 'admin.drivers.table.email',
      TYPE: 'admin.drivers.table.type',
      STATUS: 'admin.drivers.table.status',
      JOINED: 'admin.drivers.table.joined',
      ACTIONS: 'admin.drivers.table.actions',
    },
    
    TYPES: {
      AFFILIATE: 'admin.drivers.types.affiliate',
      RENTER: 'admin.drivers.types.renter',
    },
  },
  
  METRICS: {
    TITLE: 'admin.metrics.title',
    SUBTITLE: 'admin.metrics.subtitle',
    
    PLATFORMS: {
      UBER: 'admin.metrics.platforms.uber',
      BOLT: 'admin.metrics.platforms.bolt',
      CARTRACK: 'admin.metrics.platforms.cartrack',
      FONOA: 'admin.metrics.platforms.fonoa',
      VIAVERDE: 'admin.metrics.platforms.viaverde',
      MYPRIO: 'admin.metrics.platforms.myprio',
    },
    
    STATS: {
      TOTAL_TRIPS: 'admin.metrics.stats.totalTrips',
      TOTAL_EARNINGS: 'admin.metrics.stats.totalEarnings',
      TOTAL_EXPENSES: 'admin.metrics.stats.totalExpenses',
      NET_PROFIT: 'admin.metrics.stats.netProfit',
      ACTIVE_VEHICLES: 'admin.metrics.stats.activeVehicles',
      ACTIVE_DRIVERS: 'admin.metrics.stats.activeDrivers',
    },
    
    FILTERS: {
      PERIOD: 'admin.metrics.filters.period',
      PLATFORM: 'admin.metrics.filters.platform',
      DRIVER: 'admin.metrics.filters.driver',
      VEHICLE: 'admin.metrics.filters.vehicle',
    },
  },
  
  CONTENT: {
    TITLE: 'admin.content.title',
    SUBTITLE: 'admin.content.subtitle',
  },
} as const;
