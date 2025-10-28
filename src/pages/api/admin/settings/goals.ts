import type { NextApiRequest, NextApiResponse } from 'next';

// Config storage for goals (weekly rewards)
// GET returns { config: { rewardPercentage, minRideCount, minRevenuePerWeek, rewardBase, weeklyBudgetCap } }
// POST updates the same

const DEFAULT_CONFIG = {
  rewardPercentage: 15,
  minRideCount: 50,
  minRevenuePerWeek: 600,
  rewardBase: 'repasse' as const,
  weeklyBudgetCap: 10000,
};

export interface GoalsConfig {
  rewardPercentage: number;
  minRideCount: number;
  minRevenuePerWeek: number;
  rewardBase: 'repasse' | 'ganhosMenosIVA';
  weeklyBudgetCap: number;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // TODO: validar sessão admin
  try {
    if (req.method === 'GET') {
      // For now, return default config. In future, fetch from Firestore
      return res.status(200).json({ success: true, config: DEFAULT_CONFIG });
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const rewardPercentage = Number(body.rewardPercentage);
      const minRideCount = Number(body.minRideCount);
      const minRevenuePerWeek = Number(body.minRevenuePerWeek);
      const rewardBase = body.rewardBase === 'ganhosMenosIVA' ? 'ganhosMenosIVA' : 'repasse';
      const weeklyBudgetCap = Number(body.weeklyBudgetCap);

      if (!Number.isFinite(rewardPercentage) || rewardPercentage < 0 || rewardPercentage > 100) {
        return res.status(400).json({ success: false, error: 'rewardPercentage inválido (0-100)' });
      }
      if (!Number.isFinite(minRideCount) || minRideCount < 1) {
        return res.status(400).json({ success: false, error: 'minRideCount inválido (mínimo 1)' });
      }
      if (!Number.isFinite(minRevenuePerWeek) || minRevenuePerWeek < 0) {
        return res.status(400).json({ success: false, error: 'minRevenuePerWeek inválido' });
      }
      if (!Number.isFinite(weeklyBudgetCap) || weeklyBudgetCap < 0) {
        return res.status(400).json({ success: false, error: 'weeklyBudgetCap inválido' });
      }

      const config: GoalsConfig = {
        rewardPercentage,
        minRideCount,
        minRevenuePerWeek,
        rewardBase,
        weeklyBudgetCap,
      };

      // TODO: save to Firestore at 'config/goalsConfig'
      // For now, just return success
      return res.status(200).json({ success: true, config });
    }

    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  } catch (e: any) {
    console.error('[admin/settings/goals] error', e);
    return res.status(500).json({ success: false, error: e?.message || 'Internal Server Error' });
  }
}

export default handler;

