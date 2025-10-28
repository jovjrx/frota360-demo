/**
 * Schema para Documentos
 * Sistema similar ao de Contratos: Admin gerencia (upload/delete/modify), Motorista visualiza
 * Com suporte a validade, categorias e permissões de acesso
 */

export type DocumentCategory = 'insurance' | 'tax' | 'compliance' | 'safety' | 'other';
export type DocumentStatus = 'active' | 'archived' | 'expired';

export interface Document {
  id: string;
  // Identificação
  name: string; // Ex: "Seguro Responsabilidade Civil 2025"
  description?: string;
  category: DocumentCategory;
  
  // Arquivo
  fileUrl: string; // URL do arquivo no Cloud Storage
  fileName: string;
  fileSize: number; // em bytes
  fileMimeType: string; // ex: "application/pdf"
  
  // Validade
  validFrom?: number; // timestamp quando começa a ser válido
  validUntil?: number; // timestamp de expiração
  expiresInDays?: number; // dias restantes (calculado)
  
  // Acesso
  accessLevel: 'all_drivers' | 'specific_drivers'; // todos ou só alguns motoristas
  allowedDriverIds?: string[]; // IDs dos motoristas que podem acessar (se specific)
  
  // Metadata
  status: DocumentStatus; // ativo, arquivado ou expirado
  isRequired: boolean; // deve ser reconhecido/aceito pelo motorista?
  
  // Auditoria
  createdAt: number;
  createdBy: string; // ID do admin que criou
  updatedAt: number;
  updatedBy: string; // ID do admin que atualizou
  
  // Reconhecimento do motorista (opcional)
  acknowledgedBy?: Record<string, {
    acknowledgedAt: number;
    ipAddress?: string;
  }>; // {driverId: {acknowledgedAt, ipAddress}}
}

export interface DocumentStats {
  total: number;
  active: number;
  archived: number;
  expiredSoon: number; // expira em 30 dias
  notAcknowledged: number; // required docs não reconhecidas
}

/**
 * DTO para upload de novo documento
 */
export interface CreateDocumentDTO {
  name: string;
  description?: string;
  category: DocumentCategory;
  validFrom?: number;
  validUntil?: number;
  accessLevel: 'all_drivers' | 'specific_drivers';
  allowedDriverIds?: string[];
  isRequired: boolean;
}

/**
 * DTO para atualizar documento
 */
export interface UpdateDocumentDTO {
  name?: string;
  description?: string;
  category?: DocumentCategory;
  validFrom?: number;
  validUntil?: number;
  accessLevel?: 'all_drivers' | 'specific_drivers';
  allowedDriverIds?: string[];
  isRequired?: boolean;
  status?: DocumentStatus;
}

/**
 * Resposta de visualização para motorista
 */
export interface DocumentDriverView {
  id: string;
  name: string;
  description?: string;
  category: DocumentCategory;
  fileUrl: string;
  validFrom?: number;
  validUntil?: number;
  expiresInDays?: number;
  isRequired: boolean;
  isExpired: boolean;
  acknowledgedAt?: number;
}

