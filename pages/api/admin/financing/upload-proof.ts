import type { NextApiRequest, NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { uploadFinancingProof } from '@/lib/files/financing-storage';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Parse do form-data
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const financingId = Array.isArray(fields.financingId) 
      ? fields.financingId[0] 
      : fields.financingId;

    if (!financingId) {
      return res.status(400).json({ success: false, error: 'financingId é obrigatório' });
    }

    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ success: false, error: 'Arquivo é obrigatório' });
    }

    const file = fileArray[0];
    
    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de arquivo não permitido. Use PDF, imagens ou documentos Word.' 
      });
    }

    // Ler arquivo
    const fileBuffer = fs.readFileSync(file.filepath);
    const fileName = file.originalFilename || 'comprovante';

    // Fazer upload
    const { url, path } = await uploadFinancingProof(fileBuffer, fileName, financingId);

    // Atualizar documento do financiamento no Firestore
    const db = getFirestore(firebaseAdmin);
    const now = new Date().toISOString();
    
    await db.collection('financing').doc(financingId).update({
      proofUrl: url,
      proofFileName: fileName,
      proofUploadedAt: now,
      proofStoragePath: path,
      updatedAt: now,
    });

    // Deletar arquivo temporário
    fs.unlinkSync(file.filepath);

    return res.status(200).json({
      success: true,
      url,
      fileName,
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload de comprovante:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno ao fazer upload' 
    });
  }
}

export default withIronSessionApiRoute(handler, sessionOptions);

