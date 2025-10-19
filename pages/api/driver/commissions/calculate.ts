/**
 * API: POST /api/driver/commissions/calculate
 * Calcula comissões para uma semana específica
 * Apenas para admins
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { calculateWeeklyCommissions, saveWeeklyCommissions } from '@/lib/services/commission-calculator';
import { getSession } from '@/lib/session/ironSession';
import { z } from 'zod';

const RequestSchema = z.object({
  weekId: z.string(),
  weekStart: z.string(),
  weekEnd: z.string(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getSession(req, res);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Verificar se é admin
    if (session.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - apenas admins' });
    }

    const adminDoc = await adminDb.collection('admins').doc(session.user.id).get();
    if (!adminDoc.exists) {
      return res.status(403).json({ error: 'Acesso negado - apenas admins' });
    }

    // Validar schema
    const { weekId, weekStart, weekEnd } = RequestSchema.parse(req.body);

    // Calcular comissões para todos os afiliados
    const affiliatesSnapshot = await adminDb
      .collection('drivers')
      .where('type', '==', 'affiliate')
      .where('status', '==', 'active')
      .get();

    const commissions = [];

    for (const affiliateDoc of affiliatesSnapshot.docs) {
      const commission = await calculateWeeklyCommissions(
        affiliateDoc.id,
        weekId,
        weekStart,
        weekEnd
      );

      if (commission) {
        commissions.push(commission);
      }
    }

    // Salvar comissões
    if (commissions.length > 0) {
      await saveWeeklyCommissions(commissions);
    }

    return res.status(200).json({
      success: true,
      message: `Calculadas ${commissions.length} comissões`,
      weekId,
      commissions: commissions.map(c => ({
        driverId: c.driverId,
        driverName: c.driverName,
        totalCommission: c.totalCommission,
      })),
    });
  } catch (error: any) {
    console.error('[/api/driver/commissions/calculate]', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    }

    return res.status(500).json({ error: 'Erro ao calcular comissões' });
  }
}

