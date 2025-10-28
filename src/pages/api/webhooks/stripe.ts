import { NextApiRequest, NextApiResponse } from 'next';
import { billingProvider } from '@/lib/billing/adapter';
import { store } from '@/lib/store';
import { auditLogger } from '@/lib/audit/logger';
import Stripe from 'stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Log the webhook event
    await auditLogger.logBillingEvent(
      'system',
      'system',
      event.type,
      event.id,
      {
        eventId: event.id,
        created: event.created,
        livemode: event.livemode,
      }
    );

    // Process the event
    await billingProvider.webhook(event.type, event.data.object);

    // Handle specific events
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: error.message || 'Webhook processing failed' });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  try {
    // Find the invoice in our database
    const invoices = await store.invoices.findAll();
    const ourInvoice = invoices.find(inv => inv.provider?.invoiceId === invoice.id);
    
    if (ourInvoice) {
      await store.invoices.update(ourInvoice.id, {
        status: 'paid',
        paidAt: Date.now(),
      });

      // Update subscription if this is a subscription invoice
      if ('subscription' in invoice && invoice.subscription) {
        const subscriptions = await store.subscriptions.findAll();
        const subscription = subscriptions.find(sub => sub.provider?.subId === invoice.subscription);
        
        if (subscription) {
          await store.subscriptions.update(subscription.id, {
            status: 'active',
          });
        }
      }

      console.log(`Invoice ${invoice.id} marked as paid`);
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  try {
    // Find the invoice in our database
    const invoices = await store.invoices.findAll();
    const ourInvoice = invoices.find(inv => inv.provider?.invoiceId === invoice.id);
    
    if (ourInvoice) {
      await store.invoices.update(ourInvoice.id, {
        status: 'uncollectible',
      });

      // Update subscription status
      if ('subscription' in invoice && invoice.subscription) {
        const subscriptions = await store.subscriptions.findAll();
        const subscription = subscriptions.find(sub => sub.provider?.subId === invoice.subscription);
        
        if (subscription) {
          await store.subscriptions.update(subscription.id, {
            status: 'past_due',
          });
        }
      }

      // Send notification to driver
      if (ourInvoice.driverId) {
        const driver = await store.drivers.findById(ourInvoice.driverId);
        if (driver) {
          // In a real implementation, you would send an email notification
          console.log(`Payment failed notification should be sent to ${driver.email}`);
        }
      }

      console.log(`Invoice ${invoice.id} marked as uncollectible`);
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  try {
    const subscriptions = await store.subscriptions.findAll();
    const ourSubscription = subscriptions.find(sub => sub.provider?.subId === subscription.id);
    
    if (ourSubscription) {
      await store.subscriptions.update(ourSubscription.id, {
        status: subscription.status,
        currentPeriodStart: (subscription as any).current_period_start * 1000,
        currentPeriodEnd: (subscription as any).current_period_end * 1000,
        cancelAt: (subscription as any).cancel_at ? (subscription as any).cancel_at * 1000 : undefined,
        canceledAt: (subscription as any).canceled_at ? (subscription as any).canceled_at * 1000 : undefined,
      });

      console.log(`Subscription ${subscription.id} updated`);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  try {
    const subscriptions = await store.subscriptions.findAll();
    const ourSubscription = subscriptions.find(sub => sub.provider?.subId === subscription.id);
    
    if (ourSubscription) {
      await store.subscriptions.update(ourSubscription.id, {
        status: 'canceled',
        canceledAt: subscription.canceled_at ? subscription.canceled_at * 1000 : Date.now(),
      });

      console.log(`Subscription ${subscription.id} marked as canceled`);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  try {
    // This event is typically handled by our API when creating subscriptions
    // But we can use it to verify the subscription was created correctly
    console.log(`New Stripe subscription created: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

