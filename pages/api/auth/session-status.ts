import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    
    if (session && session.userId) {
      return res.status(200).json({ 
        authenticated: true, 
        user: {
          userId: session.userId,
          role: session.role,
          email: session.email,
          name: session.name,
          driverId: session.driverId
        }
      });
    } else {
      return res.status(200).json({ authenticated: false });
    }
  } catch (error) {
    console.error('Error checking session:', error);
    return res.status(200).json({ authenticated: false });
  }
}
