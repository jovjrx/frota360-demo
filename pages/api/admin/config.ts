import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';
import { getPortugalTimestamp } from '@/lib/timezone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar sessão de admin
    const session = await getSession(req, res);
    if (!session.userId || session.role !== 'admin') {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Obter dados do corpo da requisição
    const configData = req.body;
    
    if (!configData) {
      return res.status(400).json({ error: 'Dados de configuração são obrigatórios' });
    }

    // Obter timestamp atual em Portugal
    const now = getPortugalTimestamp();

    // Salvar configurações no Firestore
    await adminDb.collection('system_config').doc('main').set({
      ...configData,
      updatedAt: now,
      updatedBy: session.userId,
    });

    // Log da ação
    await adminDb.collection('audit_logs').add({
      action: 'system_config_update',
      adminId: session.userId,
      configFields: Object.keys(configData),
      timestamp: now,
      createdAt: now,
    });

    return res.status(200).json({
      success: true,
      message: 'Configurações salvas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
