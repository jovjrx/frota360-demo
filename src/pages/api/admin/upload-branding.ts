// API para upload de logo/ícones para Firebase Storage
import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminStorage } from '@/lib/firebaseAdmin';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb', // Limite para imagens
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação admin
    const session = await getSession(req, res);
    if (!session?.isLoggedIn || (session.role !== 'admin' && session.user?.role !== 'admin')) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    const { fileType, fileName, base64 } = req.body;

    if (!fileType || !fileName || !base64) {
      return res.status(400).json({ 
        success: false, 
        error: 'fileType, fileName e base64 são obrigatórios' 
      });
    }

    // Tipos permitidos: logo, favicon, appleTouchIcon
    const allowedTypes = ['logo', 'favicon', 'appleTouchIcon'];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de arquivo inválido' 
      });
    }

    // Converter base64 para Buffer
    const buffer = Buffer.from(base64, 'base64');
    
    // Upload para Firebase Storage
    const contentType = getContentType(fileName);
    const fileRef = adminStorage.file(`branding/${fileType}/${fileName}`);
    
    await fileRef.save(buffer, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
    });
    
    // Configurar arquivo como público
    await fileRef.makePublic();
    
    // Aguardar um pouco para garantir que o arquivo foi publicado
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Construir URL pública do Firebase Storage
    // Formato: https://storage.googleapis.com/[BUCKET]/[PATH]
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'frota360-assets';
    const publicPath = `branding/${fileType}/${fileName}`;
    const downloadURL = `https://storage.googleapis.com/${bucketName}/${publicPath}`;

    return res.status(200).json({
      success: true,
      url: downloadURL,
      message: 'Arquivo enviado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao fazer upload do arquivo'
    });
  }
}

function getContentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  const types: { [key: string]: string } = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
  };
  
  return types[ext || ''] || 'image/png';
}

