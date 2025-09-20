import { NextApiRequest, NextApiResponse } from 'next';
import { SwitchSubscriptionSchema } from '@/schemas/subscription';
import { store } from '@/lib/store';
import { billingProvider } from '@/lib/billing/adapter';
import { auditLogger } from '@/lib/audit/logger';
import { requireDriver } from '@/lib/auth/rbac';

const handler = requireDriver(async (req: NextApiRequest, res: NextApiResponse, context) => {
  try {
    const { subscriptionId } = req.query;
    
    if (!subscriptionId || typeof subscriptionId !== 'string') {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }

    const validatedData = SwitchSubscriptionSchema.parse(req.body);

    // Get subscription and new plan details
    const [subscription, newPlan] = await Promise.all([
      store.subscriptions.findById(subscriptionId),
      store.plans.findById(validatedData.newPlanId),
    ]);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (!newPlan) {
      return res.status(404).json({ error: 'New plan not found' });
    }

    if (!newPlan.active) {
      return res.status(400).json({ error: 'New plan is not active' });
    }

    // Verify the subscription belongs to the authenticated driver
    const driver = await store.drivers.findById(subscription.driverId);
    if (!driver || driver.userId !== context.user.userId) {
      return res.status(403).json({ error: 'Not authorized to modify this subscription' });
    }

    // Create new price ID for the new plan
    const newPriceId = `price_${validatedData.newPlanId}`; // This should come from the plan

    // Update subscription with billing provider
    const updateResult = await billingProvider.updateSubscription(
      subscription.provider?.subId || subscriptionId,
      {
        priceId: newPriceId,
        metadata: {
          driverId: subscription.driverId,
          planId: validatedData.newPlanId,
          switchedAt: Date.now().toString(),
        },
      }
    );

    // Update subscription record
    await store.subscriptions.update(subscriptionId, {
      planId: validatedData.newPlanId,
      status: updateResult.status,
      currentPeriodStart: updateResult.currentPeriodStart,
      currentPeriodEnd: updateResult.currentPeriodEnd,
      updatedAt: Date.now(),
    });

    // Log audit trail
    await auditLogger.logSubscriptionUpdate(
      context.user.userId!,
      context.role,
      subscriptionId,
      {
        oldPlanId: subscription.planId,
        newPlanId: validatedData.newPlanId,
        prorate: validatedData.prorate,
      }
    );

    res.status(200).json({ 
      success: true,
      message: 'Subscription switched successfully',
      newPlanId: validatedData.newPlanId,
    });
  } catch (error: any) {
    console.error('Switch subscription error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to switch subscription' });
  }
});

export default handler;
