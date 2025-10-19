/**
 * API: POST /api/driver/commissions/calculate
 * Calcula comissões para uma semana específica
 * Apenas para afiliados
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebaseAdmin';
import { calculateWeeklyCommissions, saveWeeklyCommissions } from '@/lib/services/commission-calculator';
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

