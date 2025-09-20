import { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { active } = req.query;
    
    let plans = await store.plans.findAll();
    
    // Filter by active status if specified
    if (active !== undefined) {
      const isActive = active === 'true';
      plans = plans.filter(plan => plan.active === isActive);
    }

    res.status(200).json({ 
      success: true, 
      data: plans 
    });
  } catch (error: any) {
    console.error('List plans error:', error);
    res.status(500).json({ error: error.message || 'Failed to list plans' });
  }
}
