import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase-admin';
import { updateDataSource } from '@/schemas/weekly-data-sources';

/**
 * POST /api/admin/weekly/sync
 * Tenta sincronizar dados via APIs automáticas
 * (Placeholder - implementar quando APIs estiverem disponíveis)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { weekId } = req.body;

    if (!weekId) {
      return res.status(400).json({ error: 'weekId é obrigatório' });
    }

    // Buscar registro da semana
    const weekDoc = await db.collection('weeklyDataSources').doc(weekId).get();
    
    if (!weekDoc.exists) {
      return res.status(404).json({ error: 'Semana não encontrada' });
    }

    let weekData = weekDoc.data() as any;

    // TODO: Implementar sincronização automática quando APIs estiverem disponíveis
    // Por enquanto, apenas retorna mensagem informativa
    
    return res.status(200).json({
      success: true,
      message: 'Sincronização automática ainda não disponível. Use importação manual.',
      weekData,
    });
  } catch (error) {
    console.error('Erro ao sincronizar:', error);
    return res.status(500).json({ error: 'Erro ao sincronizar dados' });
  }
}
