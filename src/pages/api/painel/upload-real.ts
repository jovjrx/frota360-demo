import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminStorage } from '@/lib/firebaseAdmin';
import formidable from 'formidable';
import { promises as fs } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const userId = Array.isArray(fields.userId) ? fields.userId[0] : fields.userId;
    const docType = Array.isArray(fields.docType) ? fields.docType[0] : fields.docType;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!userId || !docType || !file) {
      return res.status(400).json({ error: 'userId, docType e file são obrigatórios' });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ error: 'Tipo de arquivo não permitido' });
    }

    // Ler arquivo
    const fileBuffer = await fs.readFile(file.filepath);
    
    // Upload para Firebase Storage
    const fileName = `${Date.now()}-${file.originalFilename}`;
    const filePath = `documents/${userId}/${fileName}`;
    
    const bucket = adminStorage;
    const fileUpload = bucket.file(filePath);
    
    await fileUpload.save(fileBuffer, {
      metadata: {
        contentType: file.mimetype || 'application/octet-stream',
        metadata: {
          userId,
          docType,
          uploadedAt: Date.now().toString(),
        },
      },
    });

    // Tornar arquivo público
    await fileUpload.makePublic();
    
    // Obter URL pública
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Salvar no Firestore
    const docRef = adminDb
      .collection('drivers')
      .doc(userId)
      .collection('documents')
      .doc();

    await docRef.set({
      id: docRef.id,
      name: file.originalFilename || fileName,
      url: publicUrl,
      type: docType,
      uploadedAt: Date.now(),
      fileName,
      filePath,
      size: file.size,
      mimeType: file.mimetype,
    });

    // Criar notificação
    await adminDb
      .collection('drivers')
      .doc(userId)
      .collection('notifications')
      .add({
        type: 'document_uploaded',
        title: 'Documento Enviado',
        message: `Seu documento ${docType} foi enviado com sucesso e está em análise.`,
        read: false,
        createdAt: Date.now(),
        createdBy: 'system',
      });

    // Limpar arquivo temporário
    await fs.unlink(file.filepath);

    return res.status(200).json({ 
      success: true, 
      documentId: docRef.id,
      url: publicUrl,
      message: 'Documento enviado com sucesso' 
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
}

