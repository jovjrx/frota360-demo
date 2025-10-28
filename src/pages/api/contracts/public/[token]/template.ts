import type { NextApiRequest, NextApiResponse } from 'next';

type TemplateResponse =
  | { success: true; url: string; fileName: string; version: string }
  | { success: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<TemplateResponse>) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
  }

  return res.status(410).json({ success: false, error: 'Public contract upload flow disabled' });
}
