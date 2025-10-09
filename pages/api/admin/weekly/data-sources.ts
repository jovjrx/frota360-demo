import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchWeeklyDataOverview } from '@/lib/admin/weeklyDataOverview';
import { withIronSessionApiRoute, SessionRequest, sessionOptions } from '@/lib/session/ironSession';

interface WeekOption {
  label: string;
  value: string;
  start: string;
  end: string;
}

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse<{
    weeks?: any[]; // Alterado para any[] para flexibilidade, pode ser mais específico se necessário
    error?: string;
  }>,
) {
  if (req.method === 'GET') {
    try {
      const weeks = await fetchWeeklyDataOverview();

      return res.status(200).json({ weeks });
    } catch (e) {
      console.error('Error fetching weekly data sources:', e);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}, sessionOptions);

