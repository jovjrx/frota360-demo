import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { reprocessLastThreeWeeks } from '@/lib/api/reprocessor-payments';

/**
 * POST /api/admin/reprocess-payments
 * 
 * Reprocessa os últimos 3 pagamentos processados incorretamente
 * Corrige:
 * - Juros/Ônus como PERCENTUAL (não valor absoluto)
 * - Retorna comprovante nos dados
 * - Taxa de 7% (como era na época)
 * 
 * APENAS ADMIN
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session.userId || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('🔄 Iniciando reprocessamento de últimas 3 semanas...');

    const results = await reprocessLastThreeWeeks(7); // 7% taxa fixa

    return res.status(200).json({
      success: true,
      message: 'Reprocessamento concluído',
      results,
      totalWeeks: results.length,
      successCount: results.filter(r => r.success).length,
    });

  } catch (error: any) {
    console.error('❌ Erro ao reprocessar:', error);
    return res.status(500).json({
      error: 'Failed to reprocess payments',
      message: error.message,
    });
  }
}
