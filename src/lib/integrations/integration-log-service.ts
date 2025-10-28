/**
 * ============================================================================
 * INTEGRATION LOG SERVICE - Gerenciador de Logs de Integrações
 * ============================================================================
 * 
 * Serviço para registrar e consultar logs de todas as integrações TVDE
 * 
 * FUNCIONALIDADES:
 * ✅ Registrar logs de sucesso/erro/warning
 * ✅ Consultar logs por plataforma/tipo/período
 * ✅ Estatísticas de logs
 * ✅ Limpeza automática de logs antigos
 * 
 * USO:
 * ```typescript
 * import integrationLogService from '@/lib/integrations/integration-log-service';
 * 
 * // Registrar sucesso
 * await integrationLogService.logSuccess('cartrack', 'Viagens carregadas', {
 *   endpoint: '/trips',
 *   responseTime: 1234
 * });
 * 
 * // Registrar erro
 * await integrationLogService.logError('cartrack', 'API retornou 401', {
 *   statusCode: 401,
 *   details: error.stack
 * });
 * ```
 * 
 * ============================================================================
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import admin from 'firebase-admin';
import {
  IntegrationLog,
  IntegrationLogType,
  IntegrationLogSeverity,
  CreateIntegrationLogData,
  IntegrationLogFilters,
  IntegrationLogStats,
} from '@/schemas/integration-log';
import { IntegrationPlatform } from '@/schemas/integration';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const COLLECTION_NAME = 'integration_logs';
const LOG_RETENTION_DAYS = 30; // Manter logs por 30 dias

// ============================================================================
// INICIALIZAÇÃO FIREBASE
// ============================================================================

function initializeFirebase() {
  if (!admin.apps.length) {
    try {
      // Tentar carregar credenciais do Firebase
      let serviceAccount;
      try {
        // serviceAccount = require('../../firebase-service-account.json'); // Firebase desabilitado
      } catch (e) {
        serviceAccount = require('../../../firebase-service-account.json');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      // Firebase já inicializado por outro serviço ou credenciais não disponíveis
      console.warn('Firebase credentials not found or already initialized');
    }
  }
}

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class IntegrationLogService {
  private static instance: IntegrationLogService;
  private db;

  private constructor() {
    initializeFirebase();
    this.db = getFirestore();
  }

  public static getInstance(): IntegrationLogService {
    if (!IntegrationLogService.instance) {
      IntegrationLogService.instance = new IntegrationLogService();
    }
    return IntegrationLogService.instance;
  }

  // ==========================================================================
  // CRIAR LOGS
  // ==========================================================================

  /**
   * Cria um log genérico
   */
  async createLog(data: CreateIntegrationLogData): Promise<string> {
    const now = Timestamp.now();
    
    // Calcular data de expiração (30 dias)
    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    );

    // Criar log removendo campos undefined
    const log: any = {
      platform: data.platform,
      type: data.type,
      severity: data.severity,
      message: data.message,
      timestamp: now,
      expiresAt,
    };

    // Adicionar campos opcionais apenas se definidos
    if (data.details) log.details = data.details;
    if (data.endpoint) log.endpoint = data.endpoint;
    if (data.method) log.method = data.method;
    if (data.statusCode !== undefined) log.statusCode = data.statusCode;
    if (data.responseTime !== undefined) log.responseTime = data.responseTime;
    if (data.metadata) log.metadata = data.metadata;

    const docRef = await this.db.collection(COLLECTION_NAME).add(log);
    
    return docRef.id;
  }

  /**
   * Registra um sucesso
   */
  async logSuccess(
    platform: IntegrationPlatform,
    message: string,
    metadata?: {
      endpoint?: string;
      method?: string;
      statusCode?: number;
      responseTime?: number;
      [key: string]: any;
    }
  ): Promise<string> {
    return this.createLog({
      platform,
      type: 'success',
      severity: 'info',
      message,
      ...metadata,
    });
  }

  /**
   * Registra um erro
   */
  async logError(
    platform: IntegrationPlatform,
    message: string,
    metadata?: {
      endpoint?: string;
      method?: string;
      statusCode?: number;
      details?: string;
      [key: string]: any;
    }
  ): Promise<string> {
    return this.createLog({
      platform,
      type: 'error',
      severity: metadata?.statusCode === 401 || metadata?.statusCode === 403 ? 'critical' : 'error',
      message,
      ...metadata,
    });
  }

  /**
   * Registra um warning
   */
  async logWarning(
    platform: IntegrationPlatform,
    message: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.createLog({
      platform,
      type: 'warning',
      severity: 'warning',
      message,
      ...metadata,
    });
  }

  /**
   * Registra informação
   */
  async logInfo(
    platform: IntegrationPlatform,
    message: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.createLog({
      platform,
      type: 'info',
      severity: 'info',
      message,
      ...metadata,
    });
  }

  /**
   * Registra evento de autenticação
   */
  async logAuth(
    platform: IntegrationPlatform,
    success: boolean,
    message: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.createLog({
      platform,
      type: 'auth',
      severity: success ? 'info' : 'critical',
      message,
      ...metadata,
    });
  }

  /**
   * Registra evento de sincronização
   */
  async logSync(
    platform: IntegrationPlatform,
    message: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    return this.createLog({
      platform,
      type: 'sync',
      severity: 'info',
      message,
      ...metadata,
    });
  }

  // ==========================================================================
  // CONSULTAR LOGS
  // ==========================================================================

  /**
   * Busca logs com filtros
   */
  async getLogs(filters: IntegrationLogFilters = {}): Promise<IntegrationLog[]> {
    let query: any = this.db.collection(COLLECTION_NAME);

    // Aplicar filtros
    if (filters.platform) {
      query = query.where('platform', '==', filters.platform);
    }

    if (filters.type) {
      query = query.where('type', '==', filters.type);
    }

    if (filters.severity) {
      query = query.where('severity', '==', filters.severity);
    }

    if (filters.startDate) {
      query = query.where('timestamp', '>=', Timestamp.fromDate(filters.startDate));
    }

    if (filters.endDate) {
      query = query.where('timestamp', '<=', Timestamp.fromDate(filters.endDate));
    }

    // Ordenar por timestamp decrescente
    query = query.orderBy('timestamp', 'desc');

    // Limitar resultados
    if (filters.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100); // Limite padrão
    }

    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as IntegrationLog));
  }

  /**
   * Busca último log de uma plataforma
   */
  async getLastLog(platform: IntegrationPlatform): Promise<IntegrationLog | null> {
    const logs = await this.getLogs({ platform, limit: 1 });
    return logs[0] || null;
  }

  /**
   * Busca logs de erro
   */
  async getErrors(
    platform?: IntegrationPlatform,
    limit = 50
  ): Promise<IntegrationLog[]> {
    return this.getLogs({
      platform,
      type: 'error',
      limit,
    });
  }

  /**
   * Busca últimos N logs de uma plataforma
   */
  async getRecentLogs(
    platform: IntegrationPlatform,
    limit = 20
  ): Promise<IntegrationLog[]> {
    return this.getLogs({ platform, limit });
  }

  // ==========================================================================
  // ESTATÍSTICAS
  // ==========================================================================

  /**
   * Gera estatísticas de logs por plataforma
   */
  async getStats(
    platform: IntegrationPlatform,
    startDate?: Date,
    endDate?: Date
  ): Promise<IntegrationLogStats> {
    const logs = await this.getLogs({
      platform,
      startDate,
      endDate,
      limit: 1000, // Limitar para performance
    });

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    logs.forEach(log => {
      byType[log.type] = (byType[log.type] || 0) + 1;
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    });

    return {
      platform,
      totalLogs: logs.length,
      byType: byType as any,
      bySeverity: bySeverity as any,
      lastLog: logs[0],
      period: {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate || new Date(),
      },
    };
  }

  // ==========================================================================
  // LIMPEZA
  // ==========================================================================

  /**
   * Remove logs expirados (mais antigos que LOG_RETENTION_DAYS)
   */
  async cleanupExpiredLogs(): Promise<number> {
    const now = Timestamp.now();
    
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('expiresAt', '<', now)
      .limit(500) // Processar em lotes
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    console.log(`🗑️ Removidos ${snapshot.size} logs expirados`);
    
    return snapshot.size;
  }

  /**
   * Remove logs de uma plataforma específica
   */
  async clearPlatformLogs(platform: IntegrationPlatform): Promise<number> {
    const snapshot = await this.db
      .collection(COLLECTION_NAME)
      .where('platform', '==', platform)
      .limit(500)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    console.log(`🗑️ Removidos ${snapshot.size} logs de ${platform}`);
    
    return snapshot.size;
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export default IntegrationLogService.getInstance();

