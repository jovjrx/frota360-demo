import { getStorage } from 'firebase-admin/storage';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';

/**
 * Faz upload de comprovante de pagamento para o Firebase Storage
 * @param file Buffer do arquivo
 * @param fileName Nome original do arquivo
 * @param financingId ID do financiamento
 * @returns URL pública do arquivo
 */
export async function uploadFinancingProof(
  file: Buffer,
  fileName: string,
  financingId: string
): Promise<{ url: string; path: string }> {
  const storage = getStorage(firebaseAdmin);
  const bucket = storage.bucket();

  // Criar nome único com timestamp
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `financing-proofs/${financingId}/${timestamp}_${sanitizedFileName}`;

  // Upload do arquivo
  const fileUpload = bucket.file(storagePath);
  await fileUpload.save(file, {
    metadata: {
      contentType: getMimeType(extension || ''),
      metadata: {
        originalName: fileName,
        financingId: financingId,
        uploadedAt: new Date().toISOString(),
      },
    },
  });

  // Tornar arquivo público
  await fileUpload.makePublic();

  // Obter URL pública
  const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

  return { url, path: storagePath };
}

/**
 * Deleta comprovante de pagamento do Firebase Storage
 * @param path Caminho do arquivo no Storage
 */
export async function deleteFinancingProof(path: string): Promise<void> {
  const storage = getStorage(firebaseAdmin);
  const bucket = storage.bucket();
  const file = bucket.file(path);

  try {
    await file.delete();
  } catch (error) {
    console.error('Erro ao deletar comprovante:', error);
    // Não lança erro se arquivo não existir
  }
}

/**
 * Obtém MIME type baseado na extensão do arquivo
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

