import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';
import {
  setAdminFeeExemption,
  clearAdminFeeExemption,
  getAdminFeeExemption,
  getExemptionDaysRemaining,
} from '@/lib/finance/admin-fee-exemption';

interface ExemptionRequest {
  driverId: string;
  exemptionWeeks?: number;
  reason?: string;
}

interface ExemptionResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExemptionResponse>
) {
  const session = await getSession(req, res);
  if (!session?.isLoggedIn || (session.role !== 'admin' && session.user?.role !== 'admin')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { method } = req;

  try {
    switch (method) {
      // GET: Obter isenção de um motorista
      case 'GET': {
        const { driverId } = req.query;
        if (!driverId || typeof driverId !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'driverId é obrigatório',
          });
        }

        const exemption = await getAdminFeeExemption(driverId);
        const daysRemaining = await getExemptionDaysRemaining(driverId);

        return res.status(200).json({
          success: true,
          data: {
            exemption,
            daysRemaining,
          },
        });
      }

      // POST: Criar ou atualizar isenção
      case 'POST': {
        const { driverId, exemptionWeeks, reason } = req.body as ExemptionRequest;

        if (!driverId) {
          return res.status(400).json({
            success: false,
            error: 'driverId é obrigatório',
          });
        }

        if (exemptionWeeks === undefined || exemptionWeeks === null) {
          return res.status(400).json({
            success: false,
            error: 'exemptionWeeks é obrigatório',
          });
        }

        if (typeof exemptionWeeks !== 'number' || exemptionWeeks < 0) {
          return res.status(400).json({
            success: false,
            error: 'exemptionWeeks deve ser um número >= 0',
          });
        }

        // Verifica se motorista existe
        const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
        if (!driverDoc.exists) {
          return res.status(404).json({
            success: false,
            error: 'Motorista não encontrado',
          });
        }

        const exemption = await setAdminFeeExemption(
          driverId,
          exemptionWeeks,
          reason || '',
          session.user?.id || session.userId || 'unknown'
        );

        const message =
          exemptionWeeks === 0
            ? 'Isenção removida. Motorista voltará a ter desconto normal.'
            : `Motorista isento de taxa adm por ${exemptionWeeks} semana${exemptionWeeks !== 1 ? 's' : ''}.`;

        return res.status(200).json({
          success: true,
          message,
          data: exemption,
        });
      }

      // DELETE: Remover isenção
      case 'DELETE': {
        const { driverId } = req.query;
        if (!driverId || typeof driverId !== 'string') {
          return res.status(400).json({
            success: false,
            error: 'driverId é obrigatório',
          });
        }

        // Verifica se motorista existe
        const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
        if (!driverDoc.exists) {
          return res.status(404).json({
            success: false,
            error: 'Motorista não encontrado',
          });
        }

        await clearAdminFeeExemption(driverId);

        return res.status(200).json({
          success: true,
          message: 'Isenção removida. Motorista voltará ao desconto normal.',
        });
      }

      default:
        return res.status(405).json({
          success: false,
          error: `Método ${method} não permitido`,
        });
    }
  } catch (error: any) {
    console.error('[admin/drivers/admin-fee-exemption]', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao gerenciar isenção de taxa',
    });
  }
}

