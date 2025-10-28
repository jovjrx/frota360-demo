/**
 * Schema para Requisições de Documentos
 * 
 * Admin pode requerer documentos específicos de motoristas
 * Motorista recebe notificação e precisa fazer upload
 * Admin revisa e aprova ou rejeita
 */

export type DocumentRequestStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface DocumentRequest {
  id: string;
  
  // Referências
  driverId?: string | null; // null se é documento de empresa
  driverName?: string | null;
  driverEmail?: string | null;
  categoryId: string;
  categoryName: string;
  
  // Documento solicitado
  documentType: string; // Ex: "insurance_certificate", "driving_license", etc
  documentName: string;
  description?: string;
  
  // Status
  status: DocumentRequestStatus; // pending, submitted, approved, rejected
  
  // Upload do motorista (quando submitted)
  uploadedFileUrl?: string | null;
  uploadedFileName?: string | null;
  uploadedFileSize?: number;
  uploadedAt?: number;
  
  // Revisão do admin (quando approved/rejected)
  reviewedBy?: string; // Email do admin que revisou
  reviewedAt?: number;
  rejectionReason?: string; // Se rejeitado
  
  // Tentativas
  uploadCount: number; // Quantas vezes o motorista tentou upload
  
  // Datas
  requestedAt: number;
  dueDate?: number; // Prazo para envio (opcional)
  
  // Auditoria
  createdBy: string; // ID do admin que criou
  createdAt: number;
  updatedAt: number;
}

export interface DocumentRequestDTO {
  driverId: string;
  documentType: string;
  documentName: string;
  description?: string;
  dueDate?: number;
}

export interface DocumentRequestUpdateDTO {
  status?: DocumentRequestStatus;
  reviewedBy?: string;
  rejectionReason?: string;
}

/**
 * Resposta para motorista ver requisições pendentes
 */
export interface DocumentRequestDriverView {
  id: string;
  documentType: string;
  documentName: string;
  description?: string;
  status: DocumentRequestStatus;
  requestedAt: number;
  dueDate?: number;
  rejectionReason?: string;
  uploadCount: number;
}

/**
 * Estatísticas de requisições
 */
export interface DocumentRequestStats {
  total: number;
  pending: number;
  submitted: number;
  approved: number;
  rejected: number;
  overdue: number; // vencidas
  resubmissionNeeded: number; // rejeitadas
}

