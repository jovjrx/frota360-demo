import { NextApiRequest, NextApiResponse } from 'next';
import { CreateSubscriptionSchema } from '@/schemas/subscription';
import { store } from '@/lib/store';
import { billingProvider } from '@/lib/billing/adapter';
import { auditLogger } from '@/lib/audit/logger';
import { emailService } from '@/lib/email/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, planId, paymentMethodId } = req.body;
    
    if (!userId || !planId) {
      return res.status(400).json({ error: 'User ID and Plan ID are required' });
    }

    // Get driver and plan details
    const [driver, plan] = await Promise.all([
      store.drivers.findByUserId(userId),
      store.plans.findById(planId),
    ]);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (!plan.active) {
      return res.status(400).json({ error: 'Plan is not active' });
    }

    // Check if driver already has an active subscription
    const existingSubscription = await store.subscriptions.findByDriverId(driver.id);
    if (existingSubscription && existingSubscription.status === 'active') {
      return res.status(400).json({ error: 'Driver already has an active subscription' });
    }

    // Create billing customer if needed
    let customerId: string;
    const customers = await store.invoices.findAll(); // This should be a customers collection
    const existingCustomer = customers.find(c => c.driverId === driver.id);
    
    if (existingCustomer?.provider?.customerId) {
      customerId = existingCustomer.provider.customerId;
    } else {
      const customer = await billingProvider.createCustomer({
        email: driver.email,
        name: driver.name,
        phone: driver.phone,
        metadata: {
          driverId: driver.id,
          userId: driver.userId,
        },
      });
      customerId = customer.customerId;
    }

    // Create Stripe price if needed (this would be done during plan creation in a real app)
    // For now, we'll assume the plan has a priceId
    const priceId = `price_${planId}`; // This should come from the plan

    // Create subscription
    const subscriptionData = await billingProvider.createSubscription({
      customerId,
      priceId,
      trialDays: plan.trialDays,
      metadata: {
        driverId: driver.id,
        planId: plan.id,
      },
    });

    // Create subscription record
    const validatedData = CreateSubscriptionSchema.parse({
      driverId: driver.id,
      planId: plan.id,
      status: subscriptionData.status,
      currentPeriodStart: subscriptionData.currentPeriodStart,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      trialStart: plan.trialDays ? Date.now() : undefined,
      trialEnd: plan.trialDays ? Date.now() + (plan.trialDays * 24 * 60 * 60 * 1000) : undefined,
      provider: {
        customerId,
        subId: subscriptionData.subscriptionId,
        paymentMethodId,
      },
    });

    const subscriptionId = await store.subscriptions.create(validatedData);

    // Create initial invoice
    await store.invoices.create({
      driverId: driver.id,
      subscriptionId,
      amountCents: plan.priceCents,
      currency: plan.currency,
      status: 'open',
      dueDate: subscriptionData.currentPeriodEnd,
      description: `Assinatura ${plan.interval} - ${plan.name}`,
      provider: {
        invoiceId: `inv_${subscriptionId}`,
      },
    });

    // Log audit trail
    await auditLogger.logSubscriptionCreation(
      userId,
      'driver',
      subscriptionId,
      driver.id,
      plan.id
    );

    // Send confirmation email
    try {
      await emailService.sendSubscriptionRenewalReminder(
        driver.email,
        driver.name,
        plan.name,
        new Date(subscriptionData.currentPeriodEnd)
      );
    } catch (emailError) {
      console.error('Failed to send subscription email:', emailError);
    }

    res.status(201).json({ 
      success: true, 
      subscriptionId,
      message: 'Subscription created successfully' 
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to create subscription' });
  }
}

