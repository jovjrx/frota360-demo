import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import { Document, CreateDocumentDTO, UpdateDocumentDTO, DocumentStats } from '@/schemas/document';
import * as admin from 'firebase-admin';

const DOCUMENTS_COLLECTION = 'documents';

/**
 * Cria um novo documento no Firestore
 */
export async function createDocument(
  dto: CreateDocumentDTO,
  fileUrl: string,
  fileName: string,
  fileSize: number,
  fileMimeType: string,
  adminId: string
): Promise<Document> {
  const now = Date.now();
  
  const doc: Document = {
    id: adminDb.collection(DOCUMENTS_COLLECTION).doc().id,
    name: dto.name,
    description: dto.description,
    category: dto.category,
    fileUrl,
    fileName,
    fileSize,
    fileMimeType,
    validFrom: dto.validFrom,
    validUntil: dto.validUntil,
    accessLevel: dto.accessLevel,
    allowedDriverIds: dto.allowedDriverIds || [],
    status: 'active',
    isRequired: dto.isRequired,
    createdAt: now,
    createdBy: adminId,
    updatedAt: now,
    updatedBy: adminId,
  };

  await adminDb.collection(DOCUMENTS_COLLECTION).doc(doc.id).set(doc);
  return doc;
}

/**
 * Obtém um documento por ID
 */
export async function getDocument(documentId: string): Promise<Document | null> {
  const snap = await adminDb.collection(DOCUMENTS_COLLECTION).doc(documentId).get();
  return snap.exists ? (snap.data() as Document) : null;
}

/**
 * Lista todos os documentos ativos (com filtros opcionais)
 */
export async function listDocuments(filters?: {
  category?: string;
  status?: string;
  onlyActive?: boolean;
}): Promise<Document[]> {
  let query = adminDb.collection(DOCUMENTS_COLLECTION) as any;

  if (filters?.status) {
    query = query.where('status', '==', filters.status);
  } else if (filters?.onlyActive !== false) {
    query = query.where('status', '==', 'active');
  }

  if (filters?.category) {
    query = query.where('category', '==', filters.category);
  }

  query = query.orderBy('createdAt', 'desc');
  const snap = await query.get();
  return snap.docs.map(d => d.data() as Document);
}

/**
 * Lista documentos acessíveis por um motorista específico
 */
export async function listDocumentsForDriver(driverId: string): Promise<Document[]> {
  const docs = await adminDb
    .collection(DOCUMENTS_COLLECTION)
    .where('status', '==', 'active')
    .get();

  const now = Date.now();
  return docs.docs
    .map(d => d.data() as Document)
    .filter(doc => {
      // Verificar validade
      if (doc.validFrom && doc.validFrom > now) return false; // ainda não é válido
      if (doc.validUntil && doc.validUntil < now) return false; // expirado

      // Verificar acesso
      if (doc.accessLevel === 'all_drivers') return true;
      if (doc.accessLevel === 'specific_drivers' && doc.allowedDriverIds?.includes(driverId)) return true;
      return false;
    });
}

/**
 * Atualiza um documento
 */
export async function updateDocument(
  documentId: string,
  dto: UpdateDocumentDTO,
  adminId: string
): Promise<Document> {
  const current = await getDocument(documentId);
  if (!current) {
    throw new Error('Documento não encontrado');
  }

  const updated: Document = {
    ...current,
    ...dto,
    updatedAt: Date.now(),
    updatedBy: adminId,
  };

  await adminDb.collection(DOCUMENTS_COLLECTION).doc(documentId).set(updated);
  return updated;
}

/**
 * Deleta um documento
 */
export async function deleteDocument(documentId: string, fileUrl: string): Promise<void> {
  // Deletar arquivo do Cloud Storage
  if (fileUrl) {
    try {
      const fileName = fileUrl.split('/').pop() || '';
      await adminStorage.file(fileName).delete().catch(() => {}); // ignorar erros
    } catch (e) {
      console.warn('[deleteDocument] erro ao deletar arquivo:', e);
    }
  }

  // Deletar documento do Firestore
  await adminDb.collection(DOCUMENTS_COLLECTION).doc(documentId).delete();
}

/**
 * Registra reconhecimento de documento pelo motorista
 */
export async function acknowledgeDocument(documentId: string, driverId: string, ipAddress?: string): Promise<void> {
  const doc = await getDocument(documentId);
  if (!doc) {
    throw new Error('Documento não encontrado');
  }

  const acknowledgedBy = doc.acknowledgedBy || {};
  acknowledgedBy[driverId] = {
    acknowledgedAt: Date.now(),
    ipAddress,
  };

  await adminDb.collection(DOCUMENTS_COLLECTION).doc(documentId).update({ acknowledgedBy });
}

/**
 * Obtém estatísticas de documentos
 */
export async function getDocumentStats(): Promise<DocumentStats> {
  const all = await listDocuments({ onlyActive: false });
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  return {
    total: all.length,
    active: all.filter(d => d.status === 'active').length,
    archived: all.filter(d => d.status === 'archived').length,
    expiredSoon: all.filter(
      d => d.validUntil && d.validUntil > now && d.validUntil < now + thirtyDaysMs
    ).length,
    notAcknowledged: 0, // será calculado separadamente se necessário
  };
}

/**
 * Verifica se um documento está expirado
 */
export function isDocumentExpired(doc: Document): boolean {
  if (!doc.validUntil) return false;
  return doc.validUntil < Date.now();
}

/**
 * Calcula dias até expiração
 */
export function getDaysUntilExpiration(doc: Document): number | null {
  if (!doc.validUntil) return null;
  const daysMs = doc.validUntil - Date.now();
  return Math.ceil(daysMs / (24 * 60 * 60 * 1000));
}

