import { NextApiRequest, NextApiResponse } from 'next';
import { rejectRequestSchema } from '@/schemas/request';
import { db } from '@/lib/firebaseAdmin';
import { requireAdmin } from '@/lib/auth/helpers';
import { ApiResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Verificar autenticação
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { requestId } = req.query;
    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID da solicitação é obrigatório',
      });
    }

    // Validar dados
    const validatedData = rejectRequestSchema.parse(req.body);

    // Buscar solicitação
    const requestDoc = await db.collection('requests').doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Solicitação não encontrada',
      });
    }

    // Atualizar solicitação
    await db.collection('requests').doc(requestId).update({
      status: 'rejected',
      rejectionReason: validatedData.rejectionReason,
      reviewedBy: session.user.id,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Enviar email de rejeição
    try {
      const { sendEmail } = await import('@/lib/email/sendEmail');
      const { getRejectionEmailTemplate } = await import('@/lib/email/templates');
      
      const requestData = requestDoc.data();
      const emailTemplate = getRejectionEmailTemplate({
        driverName: `${requestData?.firstName} ${requestData?.lastName}`,
        reason: validatedData.rejectionReason,
      });

      await sendEmail({
        to: requestData?.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Não falhar a rejeição se o email falhar
    }

    return res.status(200).json({
      success: true,
      message: 'Solicitação rejeitada',
    });
  } catch (error: any) {
    console.error('Error rejecting request:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        message: error.errors[0]?.message || 'Erro de validação',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Erro ao rejeitar solicitação',
      message: error.message,
    });
  }
}
