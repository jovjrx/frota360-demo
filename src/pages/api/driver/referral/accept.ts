/**
 * API: POST /api/driver/referral/accept
 * Aceita um convite de recrutamento e vincula o motorista ao referenciador (referredBy)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';
import { z } from 'zod';
import { acceptReferralInvite } from '@/lib/services/referral-manager';

const RequestSchema = z.object({
  inviteCode: z.string().min(3),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const session = await getSession(req, res);
    if (!session || !session.userId) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    // Validar payload
    const { inviteCode } = RequestSchema.parse(req.body);

    // Buscar motorista atual
    const driverSnap = await adminDb
      .collection('drivers')
      .where('email', '==', session.userId)
      .limit(1)
      .get();

    if (driverSnap.empty) {
      return res.status(404).json({ success: false, error: 'Motorista não encontrado' });
    }

    const driverDoc = driverSnap.docs[0];
    const driverId = driverDoc.id;
    const driverData = driverDoc.data() as any;

    // Impedir aceitar novo convite se já vinculado
    if (driverData.referredBy) {
      return res.status(400).json({ success: false, error: 'Motorista já possui um referenciador' });
    }

    // Aceitar convite
    const result = await acceptReferralInvite(
      inviteCode,
      driverId,
      driverData.fullName || driverData.name || 'Motorista',
      driverData.email || session.userId
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message || 'Convite inválido' });
    }

    return res.status(200).json({ success: true, message: result.message, referrerId: result.referrerId });
  } catch (error: any) {
    console.error('[/api/driver/referral/accept]', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.issues });
    }
    return res.status(500).json({ success: false, error: 'Erro ao aceitar convite' });
  }
}

