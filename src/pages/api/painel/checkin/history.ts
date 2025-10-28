import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';
import { getPortugalStartOfDay, getPortugalEndOfDay } from '@/lib/timezone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar sessão
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Obter parâmetros da query
    const { limit = '50', startDate, endDate } = req.query;
    const limitNum = parseInt(limit as string);

    // Construir query
    let query = adminDb.collection('driver_checkins')
      .where('driverId', '==', session.driverId)
      .orderBy('timestamp', 'desc')
      .limit(limitNum);

    // Aplicar filtros de data se fornecidos
    if (startDate) {
      const start = new Date(startDate as string);
      query = query.where('timestamp', '>=', start.getTime());
    }

    if (endDate) {
      const end = new Date(endDate as string);
      query = query.where('timestamp', '<=', end.getTime());
    }

    // Executar query
    const snapshot = await query.get();
    const checkins = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Obter estatísticas do dia atual
    const todayStart = getPortugalStartOfDay().toMillis();
    const todayEnd = getPortugalEndOfDay().toMillis();
    
    const todayQuery = adminDb.collection('driver_checkins')
      .where('driverId', '==', session.driverId)
      .where('timestamp', '>=', todayStart)
      .where('timestamp', '<=', todayEnd);
    
    const todaySnapshot = await todayQuery.get();
    const todayCheckins = todaySnapshot.docs.length;

    return res.status(200).json({
      success: true,
      checkins,
      stats: {
        todayCheckins,
        totalCheckins: checkins.length
      }
    });

  } catch (error) {
    console.error('Erro ao obter histórico de check-ins:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

