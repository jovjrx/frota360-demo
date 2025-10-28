/**
 * Serviço de Requisições de Documentos
 * 
 * Admin requisita documentos de motoristas
 * Motorista recebe notificação e faz upload
 * Admin aprova ou rejeita
 */

import { adminDb } from '@/lib/firebaseAdmin';
import {
  DocumentRequest,
  DocumentRequestDTO,
  DocumentRequestUpdateDTO,
  DocumentRequestStatus,
  DocumentRequestDriverView,
  DocumentRequestStats,
} from '@/schemas/document-request';

const COLLECTION = 'documentRequests';

/**
 * Criar nova requisição de documento
 */
export async function createDocumentRequest(
  dto: DocumentRequestDTO,
  adminId: string
): Promise<DocumentRequest> {
  const now = Date.now();
  const docRef = adminDb.collection(COLLECTION).doc();
  
  const request: DocumentRequest = {
    id: docRef.id,
    driverId: dto.driverId,
    driverName: '', // Será preenchido ao buscar dados do motorista
    driverEmail: '', // Será preenchido ao buscar dados do motorista
    categoryId: 'general',
    categoryName: 'Documentação Geral',
    documentType: dto.documentType,
    documentName: dto.documentName,
    description: dto.description,
    status: 'pending',
    uploadCount: 0,
    requestedAt: now,
    dueDate: dto.dueDate,
    createdBy: adminId,
    createdAt: now,
    updatedAt: now,
  };
  
  await docRef.set(request);
  return request;
}

/**
 * Listar requisições de um motorista (para o motorista ver)
 */
export async function listDocumentRequestsForDriver(driverId: string): Promise<DocumentRequestDriverView[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where('driverId', '==', driverId)
    .where('status', 'in', ['pending', 'submitted', 'rejected'])
    .orderBy('requestedAt', 'desc')
    .get();
  
  return snap.docs.map(doc => {
    const data = doc.data() as DocumentRequest;
    return {
      id: data.id,
      documentType: data.documentType,
      documentName: data.documentName,
      description: data.description,
      status: data.status,
      requestedAt: data.requestedAt,
      dueDate: data.dueDate,
      rejectionReason: data.rejectionReason,
      uploadCount: data.uploadCount,
    };
  });
}

/**
 * Listar requisições (para admin - filtros opcionais)
 */
export async function listDocumentRequests(filters?: {
  driverId?: string;
  status?: DocumentRequestStatus;
  limit?: number;
}): Promise<DocumentRequest[]> {
  let query = adminDb.collection(COLLECTION) as any;
  
  if (filters?.driverId) {
    query = query.where('driverId', '==', filters.driverId);
  }
  
  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  }
  
  query = query.orderBy('requestedAt', 'desc');
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  const snap = await query.get();
  return snap.docs.map(doc => doc.data() as DocumentRequest);
}

/**
 * Buscar requisição por ID
 */
export async function getDocumentRequest(requestId: string): Promise<DocumentRequest | null> {
  const snap = await adminDb.collection(COLLECTION).doc(requestId).get();
  return snap.exists ? (snap.data() as DocumentRequest) : null;
}

/**
 * Atualizar requisição (upload, aprovação, rejeição)
 */
export async function updateDocumentRequest(
  requestId: string,
  update: Partial<DocumentRequest>
): Promise<DocumentRequest> {
  const now = Date.now();
  
  await adminDb
    .collection(COLLECTION)
    .doc(requestId)
    .update({
      ...update,
      updatedAt: now,
    });
  
  const snap = await adminDb.collection(COLLECTION).doc(requestId).get();
  return snap.data() as DocumentRequest;
}

/**
 * Marcar como submitted (motorista fez upload)
 */
export async function submitDocumentRequest(
  requestId: string,
  fileUrl: string,
  fileName: string,
  fileSize: number
): Promise<DocumentRequest> {
  const now = Date.now();
  
  const doc = await getDocumentRequest(requestId);
  if (!doc) {
    throw new Error('Document request not found');
  }
  
  return updateDocumentRequest(requestId, {
    status: 'submitted',
    uploadedFileUrl: fileUrl,
    uploadedFileName: fileName,
    uploadedFileSize: fileSize,
    uploadedAt: now,
    uploadCount: doc.uploadCount + 1,
  });
}

/**
 * Aprovar requisição (admin revisou e aprovou)
 */
export async function approveDocumentRequest(
  requestId: string,
  adminId: string
): Promise<DocumentRequest> {
  return updateDocumentRequest(requestId, {
    status: 'approved',
    reviewedBy: adminId,
    reviewedAt: Date.now(),
  });
}

/**
 * Rejeitar requisição (admin revisou e rejeitou)
 */
export async function rejectDocumentRequest(
  requestId: string,
  adminId: string,
  rejectionReason: string
): Promise<DocumentRequest> {
  return updateDocumentRequest(requestId, {
    status: 'rejected',
    reviewedBy: adminId,
    reviewedAt: Date.now(),
    rejectionReason,
  });
}

/**
 * Deletar requisição
 */
export async function deleteDocumentRequest(requestId: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(requestId).delete();
}

/**
 * Buscar estatísticas de requisições de um motorista
 */
export async function getDocumentRequestStatsForDriver(driverId: string): Promise<DocumentRequestStats> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where('driverId', '==', driverId)
    .get();
  
  const requests = snap.docs.map(doc => doc.data() as DocumentRequest);
  const now = Date.now();
  
  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    overdue: requests.filter(r => r.dueDate && r.dueDate < now && r.status !== 'approved').length,
    resubmissionNeeded: requests.filter(r => r.status === 'rejected').length,
  };
}

/**
 * Buscar estatísticas gerais (admin)
 */
export async function getDocumentRequestStats(): Promise<DocumentRequestStats> {
  const snap = await adminDb.collection(COLLECTION).get();
  const requests = snap.docs.map(doc => doc.data() as DocumentRequest);
  const now = Date.now();
  
  return {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    overdue: requests.filter(r => r.dueDate && r.dueDate < now && r.status !== 'approved').length,
    resubmissionNeeded: requests.filter(r => r.status === 'rejected').length,
  };
}

