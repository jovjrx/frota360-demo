import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchCartrackMonitorData, CartrackMonitorData } from '@/lib/integrations/cartrack/monitor';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    data?: CartrackMonitorData;
    error?: string;
  }> ,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = await fetchCartrackMonitorData();

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Error in Cartrack data handler:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const lower = message.toLowerCase();
    let statusCode = 500;

    if (lower.includes('not configured')) {
      statusCode = 404;
    } else if (lower.includes('disabled')) {
      statusCode = 400;
    }

    return res.status(statusCode).json({ error: message });
  }
}
