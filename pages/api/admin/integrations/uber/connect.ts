import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth/helpers';

/**
 * Inicia o fluxo OAuth 2.0 com Uber
 * Redireciona o admin para página de autorização do Uber
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const clientId = process.env.UBER_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/integrations/uber/callback`;
  
  // Scopes necessários para Fleet Integration
  const scopes = [
    'profile',
    'history',
    'history_lite',
  ].join(' ');

  // URL de autorização do Uber
  const authUrl = new URL('https://auth.uber.com/oauth/v2/authorize');
  authUrl.searchParams.set('client_id', clientId || '');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('response_type', 'code');

  // Redirecionar para Uber
  res.redirect(authUrl.toString());
}
