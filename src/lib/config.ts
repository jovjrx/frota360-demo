// Configurações globais da aplicação

export const APP_CONFIG = {
  // URLs e rotas
  routes: {
    login: '/login',
    signup: '/signup',
    dashboard: '/dashboard',
    admin: '/dashboard/admin',
    setup: '/dashboard/setup',
  },
  
  // Configurações de upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
  },
  
  // Configurações de notificação
  notifications: {
    maxItems: 10,
    types: {
      status_change: 'Mudança de Status',
      document_approved: 'Documento Aprovado',
      earnings_update: 'Ganhos Atualizados',
      system: 'Sistema',
    },
  },
  
  // Configurações de paginação
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  
  // Configurações de tempo
  timeouts: {
    api: 30000, // 30 segundos
    auth: 5000, // 5 segundos
  },
  
  // Configurações de validação
  validation: {
    password: {
      minLength: 6,
      requireSpecialChar: false,
      requireNumber: false,
    },
    email: {
      domains: ['frota360.pt'],
      adminEmails: ['adm@frota360.pt'],
    },
  },
  
  // Configurações de UI
  ui: {
    colors: {
      primary: 'green.500',
      secondary: 'blue.500',
      success: 'green.500',
      warning: 'orange.500',
      error: 'red.500',
      info: 'blue.500',
    },
    animations: {
      duration: 200,
      easing: 'ease-in-out',
    },
  },
  
  // Configurações de desenvolvimento
  dev: {
    enableLogs: process.env.NODE_ENV === 'development',
    enableDebug: process.env.NODE_ENV === 'development',
  },

  // Configurações financeiras
  finance: {
    // Taxa administrativa (já implementada no cálculo como 7%)
    adminFeePercent: 7,
    // Nova Comissão (item adicional, separado da Taxa Adm). Por padrão, desativada.
    commission: {
      enabled: false,             // Se true, aplica comissão ao cálculo do repasse
      mode: 'percent' as 'percent' | 'fixed', // Modo de cálculo
      percent: 0,                 // Percentual aplicado sobre a base escolhida
      fixedAmount: 0,             // Valor fixo (se mode === 'fixed')
      base: 'ganhosMenosIVA' as 'ganhosMenosIVA' | 'repasseBeforeCommission', // Base da comissão
      applyTo: 'all' as 'all' | 'affiliate' | 'renter', // Público-alvo da comissão
    },
  },
} as const;

// Funções utilitárias
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('pt-PT');
};

export const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('pt-PT');
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = new Date().getTime();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d atrás`;
  if (hours > 0) return `${hours}h atrás`;
  if (minutes > 0) return `${minutes}m atrás`;
  return 'Agora';
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < APP_CONFIG.validation.password.minLength) {
    return {
      valid: false,
      message: `A senha deve ter pelo menos ${APP_CONFIG.validation.password.minLength} caracteres`,
    };
  }
  
  return { valid: true };
};

export const isAdminEmail = (email: string): boolean => {
  const { domains, adminEmails } = APP_CONFIG.validation.email;
  
  // Verifica se está na lista de emails admin
  if (adminEmails.includes(email.toLowerCase() as any)) {
    return true;
  }
  
  // Verifica se termina com domínio permitido
  return domains.some(domain => email.toLowerCase().endsWith(`@${domain}`));
};

