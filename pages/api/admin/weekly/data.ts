import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { getAllDriversWeekData } from '@/lib/api/driver-week-data';

/**
 * API ENDPOINT - DADOS SEMANAIS ADMIN
 * GET /api/admin/weekly/data?weekId=2024-W40&forceRefresh=true
 * 
 * Usa função centralizada getDriverWeekData
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
    
    // Buscar todos os motoristas da semana usando função centralizada
    const records = await getAllDriversWeekData(weekId, shouldRefresh);
    
    console.log(`[API Weekly Data] Retornando ${records.length} registros`);

    return res.status(200).json({
      weekId,
      records,
      count: records.length
    });

  } catch (error: any) {
    console.error('[API Weekly Data] Erro:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}
