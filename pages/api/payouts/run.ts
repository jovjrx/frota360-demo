import { NextApiRequest, NextApiResponse } from 'next';
import { payoutEngine } from '@/lib/payouts/engine';
import { requireAdmin } from '@/lib/auth/rbac';

const handler = requireAdmin(async (req: NextApiRequest, res: NextApiResponse, context) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { 
      periodStart, 
      periodEnd, 
      driverIds,
      defaultCommissionPercent = 10 
    } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'Period start and end dates are required' });
    }

    const startDate = new Date(periodStart).getTime();
    const endDate = new Date(periodEnd).getTime();

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'Period start must be before period end' });
    }

    // Create payouts
    const payouts = await payoutEngine.createPayouts(
      startDate,
      endDate,
      context.user.userId!,
      driverIds,
      defaultCommissionPercent
    );

    res.status(200).json({ 
      success: true,
      payouts,
      message: `${payouts.length} payouts created successfully`,
    });
  } catch (error: any) {
    console.error('Run payouts error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payouts' });
  }
});

export default handler;
