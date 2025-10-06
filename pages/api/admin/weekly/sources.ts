import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase-admin';
import { getWeekId, getWeekDates } from '@/schemas/driver-weekly-record';
import { createWeeklyDataSources } from '@/schemas/weekly-data-sources';

/**
 * GET /api/admin/weekly/sources
 * Retorna lista de semanas com status de dados
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Buscar todas as semanas existentes
    const sourcesSnapshot = await db
      .collection('weeklyDataSources')
      .orderBy('weekStart', 'desc')
      .limit(12) // Últimas 12 semanas
      .get();

    const weeks = sourcesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Se não houver semanas, criar as últimas 4
    if (weeks.length === 0) {
      const newWeeks = [];
      const today = new Date();
      
      for (let i = 0; i < 4; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 7));
        
        const weekId = getWeekId(date);
        const { start, end } = getWeekDates(weekId);
        
        const weekData = createWeeklyDataSources(weekId, start, end);
        
        // Salvar no Firestore
        await db.collection('weeklyDataSources').doc(weekId).set(weekData);
        
        newWeeks.push(weekData);
      }
      
      return res.status(200).json({ weeks: newWeeks });
    }

    return res.status(200).json({ weeks });
  } catch (error) {
    console.error('Erro ao buscar semanas:', error);
    return res.status(500).json({ error: 'Erro ao buscar semanas' });
  }
}
