/**
 * API para enviar eventos do Facebook via servidor
 * 
 * POST /api/tracking/facebook
 * Body: {
 *   eventName: string,
 *   eventSourceUrl: string,
 *   userData?: { email, phone, firstName, lastName, city, country, externalId },
 *   customData?: Record<string, any>
 * }
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { sendServerEvent, getClientIp, getClientUserAgent } from '@/lib/facebook/server-events';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventName, eventSourceUrl, userData, customData } = req.body;

    if (!eventName || !eventSourceUrl) {
      return res.status(400).json({ error: 'eventName and eventSourceUrl are required' });
    }

    // Extrair informações do cliente
    const ip = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    // Enviar evento
    const success = await sendServerEvent({
      eventName,
      eventSourceUrl,
      userData,
      customData,
      userAgent,
      ip,
    });

    if (success) {
      return res.status(200).json({ success: true, message: 'Event sent successfully' });
    } else {
      return res.status(500).json({ success: false, error: 'Failed to send event' });
    }
  } catch (error: any) {
    console.error('[Facebook API] Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}


