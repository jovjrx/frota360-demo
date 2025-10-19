/**
 * API: POST /api/driver/referral/create-invite
 * Cria novo convite de recrutamento
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { createReferralInvite } from '@/lib/services/referral-manager';
import { getSession } from '@/lib/session/ironSession';
import { z } from 'zod';

const RequestSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
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

    const userEmail = session.userId;

    // Validar schema
    const { email, phone } = RequestSchema.parse(req.body);

    // Buscar motorista
    const driverSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', userEmail)
      .limit(1)
      .get();

    if (driverSnapshot.empty) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }

    const driver = driverSnapshot.docs[0].data();
    const driverId = driverSnapshot.docs[0].id;

    // Apenas afiliados podem recrutar
    if (driver.type !== 'affiliate') {
      return res.status(403).json({ error: 'Apenas afiliados podem recrutar' });
    }

    // Criar convite
    const invite = await createReferralInvite(
      driverId,
      driver.fullName || driver.name,
      email,
      phone
    );

    return res.status(200).json({
      success: true,
      invite: {
        id: invite.id,
        inviteCode: invite.inviteCode,
        email: invite.email,
        phone: invite.phone,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('[/api/driver/referral/create-invite]', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: error.issues });
    }

    return res.status(500).json({ error: 'Erro ao criar convite' });
  }
}

