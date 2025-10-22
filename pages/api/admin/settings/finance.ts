import type { NextApiRequest, NextApiResponse } from 'next';
import { getFinancialConfig, updateFinancialConfig } from '@/lib/finance/config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: validar sessão admin
  try {
    if (req.method === 'GET') {
      const config = await getFinancialConfig();
      return res.status(200).json({ success: true, config });
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      const percent = Number(body.adminFeePercent);
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        return res.status(400).json({ success: false, error: 'adminFeePercent inválido' });
      }

      const next = await updateFinancialConfig({
        adminFeePercent: percent,
        financing: {
          dynamicCalculation: typeof body.financing?.dynamicCalculation === 'boolean' ? body.financing.dynamicCalculation : undefined,
          eligibilityPolicy: typeof body.financing?.eligibilityPolicy === 'string' ? body.financing.eligibilityPolicy : undefined,
          paymentDecrementDynamic: typeof body.financing?.paymentDecrementDynamic === 'boolean' ? body.financing.paymentDecrementDynamic : undefined,
        },
      });
      return res.status(200).json({ success: true, config: next });
    }
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (e: any) {
    console.error('[admin/settings/finance] error', e);
    return res.status(500).json({ success: false, error: e?.message || 'Internal Server Error' });
  }
}
