import { NextApiRequest, NextApiResponse } from 'next';
import { createUberOAuthClient } from '@/lib/uber/oauth';
import { getSession } from '@/lib/session/ironSession';
import { storeUberTokens } from '@/lib/uber/oauth';
import { auditLogger } from '@/lib/audit/logger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.status(400).json({ error: `OAuth error: ${oauthError}` });
    }

    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    const session = await getSession(req, res);
    
    if (!session.isLoggedIn) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const uberClient = createUberOAuthClient();
    
    if (!uberClient.isConfigured()) {
      return res.status(400).json({ error: 'Uber integration not configured' });
    }

    // Exchange code for tokens
    const tokenResponse = await uberClient.exchangeCodeForTokens(code as string);
    
    if (tokenResponse.error || !tokenResponse.data) {
      return res.status(400).json({ error: tokenResponse.error || 'Failed to exchange code for tokens' });
    }

    // Store tokens for the user
    await storeUberTokens(session.userId!, tokenResponse.data);

    // Get user profile to verify connection
    const profileResponse = await uberClient.getUserProfile();
    
    if (profileResponse.error) {
      console.warn('Failed to get Uber profile after token exchange:', profileResponse.error);
    }

    // Log the successful integration
    await auditLogger.logUberIntegration(
      session.userId!,
      session.role!,
      'connect',
      {
        type: 'riders',
        state,
        profileEmail: profileResponse.data?.email,
      }
    );

    // Redirect to success page
    res.redirect(302, '/admin/integrations/uber?success=1');
  } catch (error: any) {
    console.error('Uber OAuth callback error:', error);
    res.redirect(302, '/admin/integrations/uber?error=' + encodeURIComponent(error.message));
  }
}
