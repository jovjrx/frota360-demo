import { NextApiRequest, NextApiResponse } from 'next';
import { createUberOAuthClient } from '@/lib/uber/oauth';
import { getSession } from '@/lib/session/ironSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    
    if (!session.isLoggedIn) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { type = 'riders', state } = req.query;
    const uberClient = createUberOAuthClient();
    
    if (!uberClient.isConfigured()) {
      return res.status(400).json({ error: 'Uber integration not configured' });
    }

    let authUrl: string;
    const stateParam = state as string || `${session.userId}_${Date.now()}`;

    if (type === 'business') {
      authUrl = uberClient.getBusinessAuthUrl(stateParam);
    } else {
      authUrl = uberClient.getRidersAuthUrl(stateParam);
    }

    res.status(200).json({ 
      success: true, 
      authUrl,
      state: stateParam,
    });
  } catch (error: any) {
    console.error('Uber OAuth start error:', error);
    res.status(500).json({ error: error.message || 'Failed to start OAuth flow' });
  }
}
