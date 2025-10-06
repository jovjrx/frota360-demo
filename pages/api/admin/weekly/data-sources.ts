import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';

/**
 * GET /api/admin/weekly/data-sources
 * Retorna informações sobre as fontes de dados semanais
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação admin
    const session = await getSession(req, res);
    if (!session?.isLoggedIn) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const isAdmin = session.role === 'admin' || session.user?.role === 'admin';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar semanas com dados
    const weeksSnapshot = await adminDb
      .collection('weeklyData')
      .orderBy('weekStart', 'desc')
      .limit(20)
      .get();

    const weeks = await Promise.all(weeksSnapshot.docs.map(async (doc) => {
      const data = doc.data();
      const weekId = doc.id;

      // Verificar se há registros de motoristas para esta semana
      const driversSnapshot = await adminDb
        .collection('driverWeeklyRecords')
        .where('weekId', '==', weekId)
        .limit(1)
        .get();

      const hasDriverData = !driversSnapshot.empty;

      // Verificar completude dos dados
      const isComplete = hasDriverData && data.uberTotal > 0 && data.boltTotal > 0;
      
      let status = 'pending';
      if (isComplete) {
        status = 'complete';
      } else if (hasDriverData || data.uberTotal > 0 || data.boltTotal > 0) {
        status = 'partial';
      }

      return {
        weekId,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        status,
        origin: data.origin || 'auto',
        isComplete,
        lastSync: data.lastSync || data.updatedAt || data.createdAt,
      };
    }));

    return res.status(200).json({
      weeks,
      total: weeks.length,
    });

  } catch (error) {
    console.error('Erro ao buscar fontes de dados:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}