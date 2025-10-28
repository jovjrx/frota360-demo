import { NextApiRequest, NextApiResponse } from 'next';
import { createUberRidersClient } from '@/lib/uber/client-riders';
import { getUberTokens } from '@/lib/uber/oauth';
import { requireDriver } from '@/lib/auth/rbac';

const handler = requireDriver(async (req: NextApiRequest, res: NextApiResponse, context) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { limit = '50', offset = '0' } = req.query;

    // Get Uber tokens for the driver
    const tokens = await getUberTokens(context.user.userId!);
    if (!tokens) {
      return res.status(400).json({ error: 'Uber not connected. Please connect your Uber account first.' });
    }

    // Create Uber client and set tokens
    const uberClient = createUberRidersClient();
    await uberClient.setTokens(tokens);

    // Get trip history
    const response = await uberClient.getTripHistory(
      parseInt(limit as string),
      parseInt(offset as string)
    );

    if (response.error) {
      return res.status(400).json({ error: response.error });
    }

    res.status(200).json({ 
      success: true, 
      data: response.data || [],
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error: any) {
    console.error('List Uber trips error:', error);
    res.status(500).json({ error: error.message || 'Failed to list Uber trips' });
  }
});

export default handler;

