import { NextApiRequest, NextApiResponse } from 'next';
import { CancelSubscriptionSchema } from '@/schemas/subscription';
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

    const validatedData = CancelSubscriptionSchema.parse(req.body);

    // Get subscription details
    const subscription = await store.subscriptions.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Verify the subscription belongs to the authenticated driver
    const driver = await store.drivers.findById(subscription.driverId);
    if (!driver || driver.userId !== context.user.userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this subscription' });
    }

    // Cancel subscription with billing provider
    const cancellationResult = await billingProvider.cancelSubscription(
      subscription.provider?.subId || subscriptionId,
      validatedData.cancelAtPeriodEnd
    );

    // Update subscription status
    const updateData: any = {
      status: cancellationResult.status,
      updatedAt: Date.now(),
    };

    if (cancellationResult.canceledAt) {
      updateData.canceledAt = cancellationResult.canceledAt;
    }

    if (validatedData.cancelAtPeriodEnd) {
      updateData.cancelAt = subscription.currentPeriodEnd;
    }

    await store.subscriptions.update(subscriptionId, updateData);

    // Log audit trail
    await auditLogger.logSubscriptionUpdate(
      context.user.userId!,
      context.role,
      subscriptionId,
      {
        status: cancellationResult.status,
        cancelAtPeriodEnd: validatedData.cancelAtPeriodEnd,
        reason: validatedData.reason,
      }
    );

    res.status(200).json({ 
      success: true,
      message: 'Subscription cancelled successfully',
      cancelAtPeriodEnd: validatedData.cancelAtPeriodEnd,
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
});

export default handler;
