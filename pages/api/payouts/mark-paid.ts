import { NextApiRequest, NextApiResponse } from 'next';
import { payoutEngine } from '@/lib/payouts/engine';
import { requireAdmin } from '@/lib/auth/rbac';

const handler = requireAdmin(async (req: NextApiRequest, res: NextApiResponse, context) => {
  try {
    if (req.method === 'POST') {
      // Mark single payout as paid
      const { payoutId, proofUrl } = req.body;

      if (!payoutId) {
        return res.status(400).json({ error: 'Payout ID is required' });
      }

      const payout = await payoutEngine.markPayoutAsPaid(
        payoutId,
        proofUrl,
        context.user.userId!
      );

      if (!payout) {
        return res.status(404).json({ error: 'Payout not found' });
      }

      res.status(200).json({ 
        success: true,
        payout,
        message: 'Payout marked as paid successfully',
      });
    } else if (req.method === 'PUT') {
      // Mark multiple payouts as paid
      const { payoutIds, proofUrl } = req.body;

      if (!payoutIds || !Array.isArray(payoutIds) || payoutIds.length === 0) {
        return res.status(400).json({ error: 'Payout IDs array is required' });
      }

      const payouts = await payoutEngine.markMultiplePayoutsAsPaid(
        payoutIds,
        proofUrl,
        context.user.userId!
      );

      res.status(200).json({ 
        success: true,
        payouts,
        message: `${payouts.length} payouts marked as paid successfully`,
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Mark payouts paid error:', error);
    res.status(500).json({ error: error.message || 'Failed to mark payouts as paid' });
  }
});

export default handler;
