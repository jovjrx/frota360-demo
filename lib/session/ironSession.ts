import { getIronSession } from 'iron-session';
import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingMessage, ServerResponse } from 'http';

export interface SessionData {
  userId?: string;
  role?: 'admin' | 'ops' | 'driver';
  email?: string;
  name?: string;
  driverId?: string;
  isLoggedIn: boolean;
  user?: {
    id: string;
    role: 'admin' | 'ops' | 'driver';
    email?: string;
    name?: string;
  };
}

export interface SessionRequest extends NextApiRequest {
  session: SessionData;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'conduz-pt-super-secret-session-key-2024-production',
  cookieName: 'conduz-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export function getSession(
  req: NextApiRequest | IncomingMessage,
  res: NextApiResponse | ServerResponse
) {
  return getIronSession<SessionData>(req, res, sessionOptions);
}

export function createSessionMiddleware() {
  return async (req: SessionRequest, res: NextApiResponse, next: () => void) => {
    req.session = await getSession(req, res);
    next();
  };
}

export async function createSession(
  req: NextApiRequest | IncomingMessage,
  res: NextApiResponse | ServerResponse,
  data: Omit<SessionData, 'isLoggedIn'>
): Promise<void> {
  const session = await getSession(req, res);
  Object.assign(session, data, { isLoggedIn: true });
  await session.save();
}

export async function destroySession(
  req: NextApiRequest | IncomingMessage,
  res: NextApiResponse | ServerResponse
): Promise<void> {
  const session = await getSession(req, res);
  session.destroy();
}
