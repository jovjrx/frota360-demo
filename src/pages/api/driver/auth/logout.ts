import type { NextApiResponse } from 'next';
import { SessionRequest } from '@/lib/session/ironSession';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';

export default withIronSessionApiRoute(async function logoutRoute(req: SessionRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  req.session.destroy();
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}, sessionOptions);


