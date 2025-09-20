import { NextApiRequest, NextApiResponse } from 'next';
import { createUberRidersClient } from '@/lib/uber/client-riders';
import { getUberTokens } from '@/lib/uber/oauth';
import { requireDriver } from '@/lib/auth/rbac';

const handler = requireDriver(async (req: NextApiRequest, res: NextApiResponse, context) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { tripId } = req.query;

    if (!tripId || typeof tripId !== 'string') {
      return res.status(400).json({ error: 'Trip ID is required' });
    }

    // Get Uber tokens for the driver
    const tokens = await getUberTokens(context.user.userId!);
    if (!tokens) {
      return res.status(400).json({ error: 'Uber not connected. Please connect your Uber account first.' });
    }

    // Create Uber client and set tokens
    const uberClient = createUberRidersClient();
    await uberClient.setTokens(tokens);

    // Get receipt
    const response = await uberClient.getReceipt(tripId);

    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    res.status(200).json({ 
      success: true, 
      data: response.data,
    });
  } catch (error: any) {
    console.error('Get Uber receipt error:', error);
    res.status(500).json({ error: error.message || 'Failed to get Uber receipt' });
  }
});

export default handler;
