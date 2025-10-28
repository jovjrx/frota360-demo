import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getActiveReferralRules, type ReferralRule } from '@/schemas/referral-rule';

interface ReferralRuleWithUsage extends ReferralRule {
  usageCount: number;
}

interface ApiResponse {
  success: boolean;
  data?: ReferralRuleWithUsage[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  try {
    // Para esse endpoint vamos permitir acesso sem autenticação temporariamente
    // já que será usado do admin
    
    if (req.method === 'GET') {
      // Buscar todas as regras ativas
      const rules = await getActiveReferralRules();

      // Para cada regra, contar quantos referrers usam essa regra
      const rulesWithUsage: ReferralRuleWithUsage[] = [];

      for (const rule of rules) {
        // Buscar quantidade de motoristas que recebem bônus com essa regra
        // Procura por referências na coleção affiliateNetwork
        const referralsSnapshot = await adminDb
          .collection('affiliateNetwork')
          .where('status', '==', 'active')
          .get();

        // Contar referrers únicos (motoristas que indicaram outros)
        const referrerIds = new Set<string>();
        referralsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.recruitedBy) {
            referrerIds.add(data.recruitedBy);
          }
        });

        rulesWithUsage.push({
          ...rule,
          usageCount: referrerIds.size,
        });
      }

      return res.status(200).json({ success: true, data: rulesWithUsage });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[/api/admin/referrals]', error);
    return res.status(500).json({ success: false, error: message });
  }
}
