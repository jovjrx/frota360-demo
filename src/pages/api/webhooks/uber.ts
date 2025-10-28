import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { store } from '@/lib/store';
import { auditLogger } from '@/lib/audit/logger';

function verifyUberWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookSecret = process.env.UBER_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.log('Uber webhook secret not configured, skipping signature verification');
    } else {
      const signature = req.headers['x-uber-signature'] as string;
      const payload = JSON.stringify(req.body);
      
      if (!signature || !verifyUberWebhookSignature(payload, signature, webhookSecret)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;
    
    // Log the webhook event
    await auditLogger.logUberIntegration(
      'system',
      'system',
      'webhook_received',
      {
        eventType: event.event_type,
        resourceHref: event.resource_href,
        eventTime: event.event_time,
      }
    );

    // Process different event types
    switch (event.event_type) {
      case 'trips.updated':
        await handleTripUpdate(event);
        break;
      case 'trips.completed':
        await handleTripCompleted(event);
        break;
      case 'trips.cancelled':
        await handleTripCancelled(event);
        break;
      default:
        console.log(`Unhandled Uber webhook event: ${event.event_type}`);
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Uber webhook error:', error);
    res.status(500).json({ error: error.message || 'Webhook processing failed' });
  }
}

async function handleTripUpdate(event: any) {
  console.log('Processing trip update:', event);
  
  // In a real implementation, you would:
  // 1. Fetch trip details from Uber API
  // 2. Update trip status in your database
  // 3. Notify relevant drivers/admins
}

async function handleTripCompleted(event: any) {
  console.log('Processing trip completed:', event);
  
  // In a real implementation, you would:
  // 1. Fetch trip details and receipt from Uber API
  // 2. Create trip revenue record
  // 3. Update driver statistics
  // 4. Trigger payout calculations if needed
}

async function handleTripCancelled(event: any) {
  console.log('Processing trip cancelled:', event);
  
  // In a real implementation, you would:
  // 1. Update trip status in your database
  // 2. Handle cancellation fees if applicable
  // 3. Notify relevant parties
}

