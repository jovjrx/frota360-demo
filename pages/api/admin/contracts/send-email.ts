import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';
import { ContractTemplateSchema } from '@/schemas/contract-template';
import { DriverContractSchema } from '@/schemas/driver-contract';
import { sendEmail } from '@/lib/email/sendEmail';
import { z } from 'zod';

const bodySchema = z.object({
  driverId: z.string(),
  contractType: z.enum(['affiliate', 'renter']),
});

const APP_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.APP_BASE_URL || 'https://app.conduz.pt';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session.userId || session.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

  const { driverId, contractType } = parsed.data;

  try {
    // Buscar motorista
    const driverSnapshot = await adminDb.collection('drivers').doc(driverId).get();
    if (!driverSnapshot.exists) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    const driverData = driverSnapshot.data() as Record<string, any>;
    const driverEmail: string | undefined = driverData.email;

    if (!driverEmail) {
      return res.status(400).json({ success: false, error: 'Driver missing email' });
    }

    // Buscar template ativo
    const templateSnapshot = await adminDb
      .collection('contractTemplates')
      .where('type', '==', contractType)
      .where('isActive', '==', true)
      .orderBy('uploadedAt', 'desc')
      .limit(1)
      .get();

    if (templateSnapshot.empty) {
      return res.status(404).json({ success: false, error: 'No active template found' });
    }

    const templateDoc = templateSnapshot.docs[0];
    const template = ContractTemplateSchema.parse({
      id: templateDoc.id,
      ...(templateDoc.data() as Record<string, unknown>),
    });

    const nowIso = new Date().toISOString();

    const driverContractRef = adminDb.collection('driverContracts').doc(`${driverId}_${contractType}`);
    const existingContractSnapshot = await driverContractRef.get();
    let baseContract: z.infer<typeof DriverContractSchema> | null = null;
    if (existingContractSnapshot.exists) {
      const parsed = DriverContractSchema.safeParse({
        id: driverContractRef.id,
        ...(existingContractSnapshot.data() as Record<string, unknown>),
      });
      if (parsed.success) {
        baseContract = parsed.data;
      }
    }

    const payload = {
      driverId,
      driverName: driverData.fullName || driverData.name || 'Motorista',
      driverEmail,
      contractType,
      templateVersion: template.version,
      signedDocumentUrl: baseContract?.signedDocumentUrl ?? null,
      signedDocumentFileName: baseContract?.signedDocumentFileName ?? null,
      submittedAt: baseContract?.submittedAt ?? null,
      status: baseContract?.status ?? 'pending_signature',
      reviewedBy: baseContract?.reviewedBy ?? null,
      reviewedAt: baseContract?.reviewedAt ?? null,
      rejectionReason: baseContract?.rejectionReason ?? null,
      emailSentAt: nowIso,
      createdAt: baseContract?.createdAt ?? nowIso,
      updatedAt: nowIso,
    } satisfies Record<string, unknown>;

    await driverContractRef.set(payload, { merge: true });

    const dashboardLink = `${APP_BASE_URL}/login`;

    await sendEmail({
      to: driverEmail,
      subject: 'Contrato disponível para assinatura',
      text: `Olá ${payload.driverName}!

Seu contrato (${contractType === 'affiliate' ? 'Afiliado' : 'Locatário'}) está disponível no portal do motorista.

1. Acesse o dashboard: ${dashboardLink}
2. No menu "Contratos", baixe o modelo mais recente.
3. Assine o documento e faça o upload do PDF assinado.

Se tiver dúvidas, responda a este email.

Obrigado,
Equipe Conduz.pt`,
      html: `<p>Olá ${payload.driverName}!</p>
<p>Seu contrato (${contractType === 'affiliate' ? 'Afiliado' : 'Locatário'}) está disponível no portal do motorista.</p>
<ol>
  <li><a href="${dashboardLink}">Aceda ao dashboard</a> com as suas credenciais.</li>
  <li>No menu <strong>Contratos</strong>, faça o download do modelo atualizado.</li>
  <li>Assine o documento e envie o PDF pelo próprio dashboard.</li>
</ol>
<p>Se tiver qualquer dúvida, responda a este email.</p>
<p>Obrigado,<br/>Equipe Conduz.pt</p>`,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Contracts] Failed to send contract email:', error);
    return res.status(500).json({ success: false, error: 'Failed to send contract email' });
  }
}
