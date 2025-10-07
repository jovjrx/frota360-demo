import type { NextApiRequest, NextApiResponse } from 'next';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '@/lib/session/ironSession';

export default withIronSessionApiRoute(async function logoutRoute(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  req.session.destroy();
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}, sessionOptions);
