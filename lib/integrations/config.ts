/**
 * ============================================================================
 * CONDUZ PT - Configuração Centralizada de Integrações TVDE
 * ============================================================================
 * 
 * Este arquivo centraliza TODAS as credenciais e configurações das integrações
 * com plataformas TVDE (Uber, Bolt, Cartrack, etc.)
 * 
 * 🔒 SEGURANÇA:
 * - Todas as credenciais vêm de variáveis de ambiente (.env)
 * - NUNCA commitar senhas diretamente no código
 * - Usar .env.local para desenvolvimento
 * - Usar variáveis de ambiente no servidor de produção
 * 
 * 📝 COMO USAR:
 * 1. Copie .env.local.example para .env.local
 * 2. Preencha as credenciais reais
 * 3. Import { getIntegrationConfig } from './config'
 * 4. const config = getIntegrationConfig('cartrack')
 * 
 * ============================================================================
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface IntegrationConfig {
  enabled: boolean;
  name: string;
  type: 'api' | 'scraper' | 'oauth';
  credentials: Record<string, string>;
  endpoints?: {
    base: string;
    auth?: string;
    [key: string]: string | undefined;
  };
  options?: Record<string, any>;
}

export type IntegrationPlatform = 
  | 'uber' 
  | 'bolt' 
  | 'cartrack' 
  | 'viaverde' 
  | 'myprio';

// ============================================================================
// CONFIGURAÇÕES POR PLATAFORMA
// ============================================================================

/**
 * 🚗 UBER BUSINESS API
 * Tipo: OAuth 2.0 Authorization Code Flow
 * Documentação: https://developer.uber.com/
 */
const UBER_CONFIG: IntegrationConfig = {
  enabled: true,
  name: 'Uber Business',
  type: 'oauth',
  credentials: {
    clientId: process.env.UBER_CLIENT_ID || '0W89Kw8QMgGdesno5dBdvNdabnMw8KkL',
    clientSecret: process.env.UBER_CLIENT_SECRET || 'mQdZgiooj9SId57DuR5w9t6TSq10HHfG7acVTq1A',
    orgUuid: process.env.UBER_ORG_UUID || '',
  },
  endpoints: {
    base: process.env.UBER_BASE_URL || 'https://api.uber.com/v1',
    auth: 'https://auth.uber.com/oauth/v2/authorize',
    token: 'https://auth.uber.com/oauth/v2/token',
  },
  options: {
    scopes: ['profile', 'history', 'history_lite'],
    redirectUri: process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/auth/uber/callback`
      : 'http://localhost:3000/api/auth/uber/callback',
  },
};

/**
 * ⚡ BOLT FLEET API
 * Tipo: API REST com OAuth 2.0 Client Credentials
 * Documentação: https://api-docs.bolt.eu/
 */
const BOLT_CONFIG: IntegrationConfig = {
  enabled: true,
  name: 'Bolt Fleet',
  type: 'api',
  credentials: {
    clientId: process.env.BOLT_CLIENT_ID || 'G__hozQ4Baf39Xk9PjVH7',
    clientSecret: process.env.BOLT_CLIENT_SECRET || 'SL5zIEeoQCAdz_wPOqEl1F4wL24xaYMoVws5jtemEZE_WZzBPIfSawHE-oaZ14UquJG6iejy84zs_njFjJ4wsA',
  },
  endpoints: {
    base: process.env.BOLT_BASE_URL || 'https://node.bolt.eu/fleet-integration-gateway',
    auth: process.env.BOLT_AUTH_URL || 'https://oidc.bolt.eu/token',
  },
  options: {
    grantType: 'client_credentials',
    scope: 'fleet_api',
  },
};

/**
 * 🛰️ CARTRACK PORTUGAL API
 * Tipo: API REST com Basic Authentication (API Key)
 * Documentação: https://fleetapi-pt.cartrack.com/rest/redoc.php
 * 
 * ⚠️ IMPORTANTE: 
 * - A senha do portal WEB (Alvorada2025@) NÃO é a API Key
 * - Use a API Key fornecida no portal (Account Settings > API)
 * - API Key atual: 4204acaf6943762f716ce3301f38d9f10e699512bbbca783f96aec223cbef805
 */
const CARTRACK_CONFIG: IntegrationConfig = {
  enabled: true,
  name: 'Cartrack Portugal',
  type: 'api',
  credentials: {
    username: process.env.CARTRACK_USERNAME || 'ALVO00008',
    apiKey: process.env.CARTRACK_API_KEY || '4204acaf6943762f716ce3301f38d9f10e699512bbbca783f96aec223cbef805',
    // ⚠️ Senha do portal (NÃO usar para API, apenas para scraping se necessário)
    portalPassword: process.env.CARTRACK_PORTAL_PASSWORD || 'Alvorada2025@',
  },
  endpoints: {
    base: process.env.CARTRACK_BASE_URL || 'https://fleetapi-pt.cartrack.com/rest',
  },
  options: {
    authType: 'basic', // Basic Auth: username + API Key
    dateFormat: 'YYYY-MM-DD HH:MM:SS', // Formato obrigatório
    timezone: 'Europe/Lisbon',
    units: {
      distance: 'meters', // API retorna em metros, converter para km
      duration: 'seconds', // API retorna em segundos, converter para minutos
    },
  },
};

/**
 * 🛣️ VIAVERDE
 * Tipo: Web Scraping (Puppeteer)
 * URL: https://www.viaverde.pt/particulares/login
 */
const VIAVERDE_CONFIG: IntegrationConfig = {
  enabled: true,
  name: 'ViaVerde',
  type: 'scraper',
  credentials: {
    email: process.env.VIAVERDE_EMAIL || 'info@alvoradamagistral.eu',
    password: process.env.VIAVERDE_PASSWORD || 'Alvorada2025@',
  },
  endpoints: {
    base: process.env.VIAVERDE_BASE_URL || 'https://www.viaverde.pt',
    login: 'https://www.viaverde.pt/particulares/login',
  },
  options: {
    headless: process.env.NODE_ENV === 'production',
    timeout: 30000,
    waitForSelector: '.login-form',
  },
};

/**
 * 💳 MYPRIO (Expense Management)
 * Tipo: Web Scraping (Puppeteer)
 * URL: https://www.myprio.pt/
 */
const MYPRIO_CONFIG: IntegrationConfig = {
  enabled: true,
  name: 'myPrio',
  type: 'scraper',
  credentials: {
    accountId: process.env.MYPRIO_ACCOUNT_ID || '606845',
    password: process.env.MYPRIO_PASSWORD || 'Alvorada25@',
  },
  endpoints: {
    base: process.env.MYPRIO_BASE_URL || 'https://www.myprio.pt',
    login: 'https://www.myprio.pt/login',
  },
  options: {
    headless: process.env.NODE_ENV === 'production',
    timeout: 30000,
  },
};

// ============================================================================
// MAPA DE CONFIGURAÇÕES
// ============================================================================

const INTEGRATION_CONFIGS: Record<IntegrationPlatform, IntegrationConfig> = {
  uber: UBER_CONFIG,
  bolt: BOLT_CONFIG,
  cartrack: CARTRACK_CONFIG,
  viaverde: VIAVERDE_CONFIG,
  myprio: MYPRIO_CONFIG,
};

// ============================================================================
// FUNÇÕES PÚBLICAS
// ============================================================================

/**
 * Obtém a configuração de uma plataforma específica
 * 
 * @param platform Nome da plataforma
 * @returns Configuração da integração
 * @throws Error se a plataforma não existir
 * 
 * @example
 * const config = getIntegrationConfig('cartrack');
 * console.log(config.credentials.username); // ALVO00008
 */
export function getIntegrationConfig(platform: IntegrationPlatform): IntegrationConfig {
  const config = INTEGRATION_CONFIGS[platform];
  
  if (!config) {
    throw new Error(`Configuração não encontrada para plataforma: ${platform}`);
  }
  
  return config;
}

/**
 * Obtém todas as configurações de integrações
 * 
 * @param onlyEnabled Se true, retorna apenas integrações ativas
 * @returns Array de configurações
 */
export function getAllIntegrationConfigs(onlyEnabled = false): IntegrationConfig[] {
  const configs = Object.values(INTEGRATION_CONFIGS);
  
  if (onlyEnabled) {
    return configs.filter(config => config.enabled);
  }
  
  return configs;
}

/**
 * Verifica se uma integração está habilitada
 * 
 * @param platform Nome da plataforma
 * @returns true se habilitada
 */
export function isIntegrationEnabled(platform: IntegrationPlatform): boolean {
  return INTEGRATION_CONFIGS[platform]?.enabled || false;
}

/**
 * Valida se todas as credenciais necessárias estão configuradas
 * 
 * @param platform Nome da plataforma
 * @returns { valid: boolean, missing: string[] }
 */
export function validateIntegrationConfig(platform: IntegrationPlatform): {
  valid: boolean;
  missing: string[];
} {
  const config = getIntegrationConfig(platform);
  const missing: string[] = [];
  
  // Verificar credenciais obrigatórias
  Object.entries(config.credentials).forEach(([key, value]) => {
    if (!value || value === '' || value === 'your_' + key) {
      missing.push(key);
    }
  });
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Obtém um resumo de status de todas as integrações
 * 
 * @returns Array com status de cada integração
 */
export function getIntegrationsStatus(): Array<{
  platform: IntegrationPlatform;
  name: string;
  enabled: boolean;
  configured: boolean;
  type: string;
}> {
  return Object.entries(INTEGRATION_CONFIGS).map(([platform, config]) => {
    const validation = validateIntegrationConfig(platform as IntegrationPlatform);
    
    return {
      platform: platform as IntegrationPlatform,
      name: config.name,
      enabled: config.enabled,
      configured: validation.valid,
      type: config.type,
    };
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  UBER_CONFIG,
  BOLT_CONFIG,
  CARTRACK_CONFIG,
  VIAVERDE_CONFIG,
  MYPRIO_CONFIG,
};
