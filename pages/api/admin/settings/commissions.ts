import type { NextApiRequest, NextApiResponse } from 'next';
import { getCommissionConfig, updateCommissionConfig, BonusLevels } from '@/lib/commissions/bonusConfig';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: validar sessão admin
  try {
    if (req.method === 'GET') {
      const config = await getCommissionConfig();
      return res.status(200).json({ success: true, config });
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      const min = Number(body.minWeeklyRevenueForEligibility);
      const base = body.base === 'ganhosMenosIVA' ? 'ganhosMenosIVA' : 'repasse';
      const maxLevels = Number(body.maxLevels);
      const levels = (body.levels || {}) as Record<string, number>;

      if (!Number.isFinite(min) || min < 0) {
        return res.status(400).json({ success: false, error: 'minWeeklyRevenueForEligibility inválido' });
      }
      if (!Number.isFinite(maxLevels) || maxLevels < 1 || maxLevels > 10) {
        return res.status(400).json({ success: false, error: 'maxLevels inválido (1-10)' });
      }

      const parsedLevels: BonusLevels = {};
      for (let i = 1; i <= maxLevels; i++) {
        const key = String(i);
        const raw = levels[key];
        const num = Number(raw);
        if (!Number.isFinite(num) || num < 0 || num > 1) {
          return res.status(400).json({ success: false, error: `Percentual do nível ${i} inválido (use decimais, ex: 0.02)` });
        }
        parsedLevels[i] = num;
      }

      const next = await updateCommissionConfig({
        minWeeklyRevenueForEligibility: min,
        base,
        maxLevels,
        levels: parsedLevels,
      });
      return res.status(200).json({ success: true, config: next });
    }
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (e: any) {
    console.error('[admin/settings/commissions] error', e);
    return res.status(500).json({ success: false, error: e?.message || 'Internal Server Error' });
  }
}
