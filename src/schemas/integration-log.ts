/**
 * ============================================================================
 * SCHEMA: INTEGRATION LOGS
 * ============================================================================
 * 
 * Armazena logs de todas as requisições e eventos das integrações
 * 
 * COLEÇÃO: integration_logs
 * DOCUMENTO ID: auto-gerado
 * 
 * ESTRUTURA:
 * integration_logs/
 *   ├── {logId1}/
 *   ├── {logId2}/
 *   └── ...
 * 
 * CONSULTAS COMUNS:
 * - Por plataforma: WHERE platform == 'cartrack'
 * - Por status: WHERE type == 'error'
 * - Por período: WHERE timestamp >= startDate AND timestamp <= endDate
 * - Últimos logs: ORDER BY timestamp DESC LIMIT 100
 * 
 * ============================================================================
 */

import { Timestamp } from 'firebase-admin/firestore';
import { IntegrationPlatform } from './integration';

/**
 * Tipos de log disponíveis
 */
export type IntegrationLogType = 
  | 'success'      // Requisição bem-sucedida
  | 'error'        // Erro na requisição
  | 'warning'      // Aviso (ex: dados incompletos)
  | 'info'         // Informação geral
  | 'auth'         // Eventos de autenticação
  | 'sync'         // Eventos de sincronização
  | 'test';        // Testes de conexão

/**
 * Severidade do log
 */
export type IntegrationLogSeverity = 
  | 'debug'    // Desenvolvimento
  | 'info'     // Informativo
  | 'warning'  // Atenção necessária
  | 'error'    // Erro recuperável
  | 'critical'; // Erro crítico

/**
 * Documento de log no Firestore
 */
export interface IntegrationLog {
  // Identificação
  id?: string; // Auto-gerado pelo Firestore
  platform: IntegrationPlatform;
  
  // Classificação
  type: IntegrationLogType;
  severity: IntegrationLogSeverity;
  
  // Detalhes do evento
  message: string;
  details?: string; // Detalhes adicionais/stack trace
  
  // Contexto da requisição
  endpoint?: string; // Endpoint chamado
  method?: string; // GET, POST, etc.
  statusCode?: number; // HTTP status code
  responseTime?: number; // Tempo de resposta em ms
  
  // Dados adicionais
  metadata?: {
    userId?: string;
    requestId?: string;
    [key: string]: any;
  };
  
  // Timestamp
  timestamp: Timestamp;
  
  // TTL (para limpeza automática)
  expiresAt?: Timestamp; // Opcional: deletar logs antigos
}

/**
 * Dados para criar um novo log
 */
export interface CreateIntegrationLogData {
  platform: IntegrationPlatform;
  type: IntegrationLogType;
  severity: IntegrationLogSeverity;
  message: string;
  details?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  metadata?: Record<string, any>;
}

/**
 * Filtros para buscar logs
 */
export interface IntegrationLogFilters {
  platform?: IntegrationPlatform;
  type?: IntegrationLogType;
  severity?: IntegrationLogSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Estatísticas de logs
 */
export interface IntegrationLogStats {
  platform: IntegrationPlatform;
  totalLogs: number;
  byType: Record<IntegrationLogType, number>;
  bySeverity: Record<IntegrationLogSeverity, number>;
  lastLog?: IntegrationLog;
  period: {
    start: Date;
    end: Date;
  };
}

