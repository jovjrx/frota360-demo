import type { NextApiRequest, NextApiResponse } from 'next';
import { getDashboardStats, getDrivers, getRequests } from '@/lib/admin/adminQueries';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Adicionar verificação de autenticação aqui
    
    const [stats, recentDrivers, recentRequests] = await Promise.all([
      getDashboardStats(),
      getDrivers({ limit: 5 }),
      getRequests({ limit: 5 }),
    ]);

    return res.status(200).json({
      stats,
      recentDrivers,
      recentRequests,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
