/**
 * API: POST /api/driver/referral/create-invite
 * Cria novo convite de recrutamento
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { createReferralInvite } from '@/lib/services/referral-manager';
import { getSession } from '@/lib/session/ironSession';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/sendEmail';

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

    // Se email informado, enviar convite por email com link direto
    if (email) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'https://conduz.pt';
      const referralPath = driver.refSlug ? `/r/${driver.refSlug}` : `/r/${invite.inviteCode}`;
      const referralUrl = `${baseUrl}${referralPath}`;

      const subject = `${driver.fullName || driver.name} convidou você para a Conduz.pt`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color:#2D3748;">Convite para ser motorista afiliado</h2>
          <p>Olá,</p>
          <p><strong>${driver.fullName || driver.name}</strong> convidou você para conhecer a Conduz.pt.</p>
          <p>Clique no botão abaixo para aceitar o convite e iniciar sua candidatura:</p>
          <div style="margin: 20px 0;">
            <a href="${referralUrl}" style="background-color:#48BB78;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Aceitar convite</a>
          </div>
          <p>Se preferir, copie e cole este link no navegador:</p>
          <p style="word-break:break-all; color:#4A5568;">${referralUrl}</p>
          <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;"/>
          <p style="color:#718096;font-size:12px;">Este convite foi enviado a seu pedido. Se você não esperava este email, ignore-o.</p>
        </div>
      `;
      const text = `Convite para a Conduz.pt\n\n${driver.fullName || driver.name} convidou você para conhecer a Conduz.pt.\n\nAceitar convite: ${referralUrl}\n\nSe você não esperava este email, ignore-o.`;

      // Dispara de forma resiliente; não bloqueia a resposta caso falhe
      try {
        await sendEmail({ to: email, subject, html, text });
      } catch (e) {
        console.warn('Falha ao enviar email de convite, seguindo sem bloquear.', e);
      }
    }

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

