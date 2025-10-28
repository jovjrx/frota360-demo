/**
 * ============================================================================
 * SCHEMA: INTEGRATIONS
 * ============================================================================
 * 
 * Armazena as configurações e credenciais das integrações TVDE no Firestore
 * 
 * COLEÇÃO: integrations
 * DOCUMENTO ID: nome da plataforma (uber, bolt, cartrack, etc.)
 * 
 * ESTRUTURA:
 * integrations/
 *   ├── uber/
 *   ├── bolt/
 *   ├── cartrack/
 *   ├── viaverde/
 *   ├── fonoa/
 *   └── myprio/
 * 
 * ============================================================================
 */

import { Timestamp } from 'firebase-admin/firestore';

/**
 * Tipos de integração disponíveis
 */
export type IntegrationType = 'api' | 'oauth' | 'scraper';

/**
 * Status da integração
 */
export type IntegrationStatus = 
  | 'active'      // Ativa e funcionando
  | 'inactive'    // Desativada pelo usuário
  | 'error'       // Com erro
  | 'pending'     // Aguardando configuração/autorização
  | 'expired';    // Token/credenciais expiradas

/**
 * Plataformas suportadas
 */
export type IntegrationPlatform = 
  | 'uber' 
  | 'bolt' 
  | 'cartrack' 
  | 'viaverde' 
  | 'myprio';

/**
 * Documento de integração no Firestore
 */
export interface Integration {
  // Identificação
  platform: IntegrationPlatform;
  name: string;
  type: IntegrationType;
  
  // Status e controle
  enabled: boolean;
  status: IntegrationStatus;
  
  // Credenciais (criptografadas no Firestore)
  credentials: {
    [key: string]: string;
  };
  
  // Endpoints e configurações
  config: {
    baseUrl: string;
    authUrl?: string;
    tokenUrl?: string;
    endpoints?: Record<string, string>;
    options?: Record<string, any>;
  };
  
  // OAuth tokens (se aplicável)
  oauth?: {
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    expiresAt?: Timestamp;
    scope?: string;
  };
  
  // Estatísticas e monitoramento
  stats: {
    lastSync?: Timestamp;
    lastSuccess?: Timestamp;
    lastError?: Timestamp;
    errorMessage?: string;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
  };
  
  // Metadados
  metadata: {
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy?: string;
    updatedBy?: string;
  };
}

/**
 * Dados para criar uma nova integração
 */
export interface CreateIntegrationData {
  platform: IntegrationPlatform;
  name: string;
  type: IntegrationType;
  enabled?: boolean;
  credentials: Record<string, string>;
  config: Integration['config'];
  oauth?: Integration['oauth'];
}

/**
 * Dados para atualizar uma integração
 */
export interface UpdateIntegrationData {
  enabled?: boolean;
  status?: IntegrationStatus;
  credentials?: Record<string, string>;
  config?: Partial<Integration['config']>;
  oauth?: Partial<Integration['oauth']>;
  stats?: Partial<Integration['stats']>;
}

/**
 * Resultado de teste de conexão
 */
export interface IntegrationTestResult {
  success: boolean;
  platform: IntegrationPlatform;
  message?: string;
  error?: string;
  responseTime?: number;
  data?: any;
  testedAt: Timestamp;
}

/**
 * Cache de integração em memória
 */
export interface IntegrationCache {
  data: Integration;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Configurações padrão por plataforma
 */
export const DEFAULT_INTEGRATION_CONFIGS: Record<IntegrationPlatform, Partial<Integration>> = {
  uber: {
    platform: 'uber',
    name: 'Uber Business',
    type: 'oauth',
    config: {
      baseUrl: 'https://api.uber.com/v1',
      authUrl: 'https://auth.uber.com/oauth/v2/authorize',
      tokenUrl: 'https://auth.uber.com/oauth/v2/token',
    },
  },
  
  bolt: {
    platform: 'bolt',
    name: 'Bolt Fleet',
    type: 'oauth',
    config: {
      baseUrl: 'https://node.bolt.eu/fleet-integration-gateway',
      authUrl: 'https://oidc.bolt.eu/token',
    },
  },
  
  cartrack: {
    platform: 'cartrack',
    name: 'Cartrack Portugal',
    type: 'api',
    config: {
      baseUrl: 'https://fleetapi-pt.cartrack.com/rest',
      options: {
        authType: 'basic',
        dateFormat: 'YYYY-MM-DD HH:MM:SS',
        timezone: 'Europe/Lisbon',
      },
    },
  },
  
  viaverde: {
    platform: 'viaverde',
    name: 'ViaVerde',
    type: 'scraper',
    config: {
      baseUrl: 'https://www.viaverde.pt',
      endpoints: {
        login: 'https://www.viaverde.pt/particulares/login',
      },
    },
  },
  
  myprio: {
    platform: 'myprio',
    name: 'myPrio',
    type: 'scraper',
    config: {
      baseUrl: 'https://www.myprio.pt',
      endpoints: {
        login: 'https://www.myprio.pt/login',
      },
    },
  },
};

/**
 * Validação de credenciais obrigatórias por plataforma
 */
export const REQUIRED_CREDENTIALS: Record<IntegrationPlatform, string[]> = {
  uber: ['clientId', 'clientSecret', 'orgUuid'],
  bolt: ['clientId', 'clientSecret'],
  cartrack: ['username', 'apiKey'],
  viaverde: ['email', 'password'],
  myprio: ['accountId', 'password'],
};

