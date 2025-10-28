import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getActiveCommissionRules, type CommissionRule } from '@/schemas/commission-rule';

interface CommissionInfo {
  rule: CommissionRule;
  eligible: boolean;
  eligibilityReason?: string;
}

type ApiResponse =
  | { success: true; data: CommissionInfo[] }
  | { success: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const driverId = req.headers['x-driver-id'] as string;
    if (!driverId) {
      return res.status(401).json({ success: false, error: 'Driver ID não fornecido' });
    }

    // Buscar dados do motorista
    const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
    if (!driverDoc.exists) {
      return res.status(404).json({ success: false, error: 'Motorista não encontrado' });
    }

    const driverData = driverDoc.data() as any;
    const affiliateLevel = driverData.affiliateLevel || 1;
    const totalRecruitments = driverData.totalRecruitments || 0;

    // Buscar última semana de dados para calcular ganhos
    const dataWeeklySnapshot = await adminDb
      .collection('dataWeekly')
      .where('driverId', '==', driverId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    let weeklyGanhos = 0;
    if (!dataWeeklySnapshot.empty) {
      const data = dataWeeklySnapshot.docs[0].data();
      weeklyGanhos = data.totalValue || 0;
    }

    // Buscar todas as regras de comissão ativas
    const rules = await getActiveCommissionRules();

    // Verificar elegibilidade para cada regra
    const commissions: CommissionInfo[] = rules.map((rule) => {
      let eligible = false;
      let eligibilityReason = '';

      // Verificar nível
      if (rule.level !== affiliateLevel) {
        eligible = false;
        eligibilityReason = `Nível requerido: ${rule.level}, seu nível: ${affiliateLevel}`;
      } else if (rule.type === 'base') {
        const criteria: any = rule.criterios || {};
        if (criteria.minGanhos && weeklyGanhos < criteria.minGanhos) {
          eligible = false;
          eligibilityReason = `Ganhos insuficientes: €${weeklyGanhos.toFixed(2)} (mínimo: €${criteria.minGanhos})`;
        } else {
          eligible = true;
          eligibilityReason = 'Elegível';
        }
      } else if (rule.type === 'recruitment') {
        const criteria: any = rule.criterios || {};
        if (criteria.minRecruitments && totalRecruitments < criteria.minRecruitments) {
          eligible = false;
          eligibilityReason = `Indicações insuficientes: ${totalRecruitments} (mínimo: ${criteria.minRecruitments})`;
        } else {
          eligible = true;
          eligibilityReason = 'Elegível';
        }
      }

      return {
        rule,
        eligible,
        eligibilityReason,
      };
    });

    return res.status(200).json({
      success: true,
      data: commissions.filter((c) => c.rule.ativo),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[GET /api/driver/commissions]', error);
    return res.status(500).json({ success: false, error: message });
  }
}
