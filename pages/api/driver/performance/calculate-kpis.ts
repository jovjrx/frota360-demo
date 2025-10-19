/**
 * API: POST /api/driver/performance/calculate-kpis
 * Calcula KPIs para uma semana específica
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebaseAdmin';
import { calculateAllWeeklyKPIs, saveWeeklyKPIs } from '@/lib/services/kpi-calculator';
import { z } from 'zod';

const RequestSchema = z.object({
  weekId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validar schema
    const { weekId, weekStart, weekEnd } = RequestSchema.parse(req.body);

    // Verificar autenticação (admin only)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth().verifyIdToken(token);

    // Verificar se é admin
    const adminDoc = await adminDb.collection('admins').doc(decodedToken.uid).get();
    if (!adminDoc.exists) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Calcular KPIs para todos os motoristas
    const kpis = await calculateAllWeeklyKPIs(weekId, weekStart, weekEnd);

    // Salvar KPIs
    if (kpis.length > 0) {
      await saveWeeklyKPIs(kpis);
    }

    return res.status(200).json({
      success: true,
      message: `Calculados ${kpis.length} KPIs`,
      weekId,
      kpis: kpis.map(k => ({
        driverId: k.driverId,
        driverName: k.driverName,
        overallScore: k.overallScore,
        performanceLevel: k.performanceLevel,
      })),
    });
  } catch (error: any) {
    console.error('[/api/driver/performance/calculate-kpis]', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    }

    return res.status(500).json({ error: 'Erro ao calcular KPIs' });
  }
}

