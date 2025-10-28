import type { NextApiRequest, NextApiResponse } from 'next';
import { getAdminFeeConfig, updateAdminFeeConfig, AdminFeeConfig } from '@/lib/finance/admin-fee';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: validar sessão admin
  try {
    if (req.method === 'GET') {
      const config = await getAdminFeeConfig();
      return res.status(200).json({ success: true, config });
    }
    if (req.method === 'POST') {
      const body = req.body || {};

      // Aceita payload no novo formato (por tipo) ou legado (global)
      const updated = await updateAdminFeeConfig(body);
      return res.status(200).json({ success: true, config: updated });
    }
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (e: any) {
    console.error('[admin/settings/finance] error', e);
    return res.status(500).json({ success: false, error: e?.message || 'Internal Server Error' });
  }
}

