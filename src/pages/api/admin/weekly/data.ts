import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { getProcessedWeeklyRecords } from '@/lib/api/weekly-data-processor';
import { enrichRecordsWithPaymentData } from '@/lib/api/payment-enrichment-service';

/**
 * API ENDPOINT - DADOS SEMANAIS ADMIN
 * GET /api/admin/weekly/data?weekId=2024-W40&forceRefresh=true
 * 
 * Usa função ÚNICA e centralizada: getProcessedWeeklyRecords(weekId)
 * - Sem driverId: retorna TODOS os motoristas
 * - Com driverId: retorna apenas aquele motorista
 * 
 * Enriquece com dados finais de pagamento quando status='paid'
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session.userId || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { weekId, forceRefresh } = req.query;

    if (!weekId || typeof weekId !== 'string') {
      return res.status(400).json({ error: 'weekId é obrigatório' });
    }

    const shouldRefresh = forceRefresh === 'true';
    
    console.log(`[API Weekly Data] Buscando dados para semana ${weekId} (refresh: ${shouldRefresh})`);
    
    // Buscar TODOS os motoristas da semana usando função ÚNICA
    const records = await getProcessedWeeklyRecords(weekId, undefined, shouldRefresh);
    
    // ✅ NOVO: Enriquecer com dados finais de pagamento
    const enrichedRecords = await enrichRecordsWithPaymentData(records);
    
    console.log(`[API Weekly Data] Retornando ${enrichedRecords.length} registros (${enrichedRecords.filter(r => r.paymentFrozen).length} congelados)`);

    return res.status(200).json({
      weekId,
      records: enrichedRecords,
      count: enrichedRecords.length
    });

  } catch (error: any) {
    console.error('[API Weekly Data] Erro:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}

