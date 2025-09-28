import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check admin authentication
    const session = await getSession(req, res);
    if (!session.userId || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { driverId, action, planId, monthsToAdd } = req.body;

    if (!driverId || !action) {
      return res.status(400).json({ error: 'driverId and action are required' });
    }

    const driverRef = adminDb.collection('drivers').doc(driverId);
    const driverDoc = await driverRef.get();

    if (!driverDoc.exists) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driverData = driverDoc.data();

    if (action === 'create_subscription') {
      // Create subscription for approved driver
      if (!planId) {
        return res.status(400).json({ error: 'planId is required for subscription creation' });
      }

      const planDoc = await adminDb.collection('plans').doc(planId).get();
      if (!planDoc.exists) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const planData = planDoc.data();

      // Check if subscription already exists
      const existingSubscriptionSnap = await adminDb
        .collection('subscriptions')
        .where('driverId', '==', driverId)
        .limit(1)
        .get();

      if (!existingSubscriptionSnap.empty) {
        return res.status(400).json({ error: 'Driver already has a subscription' });
      }

      // Create subscription
      const subscriptionData = {
        driverId,
        planId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        trialStart: new Date(),
        trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
        createdAt: new Date(),
        createdBy: session.userId,
        planName: planData?.name,
        planPrice: planData?.priceCents,
      };

      const subscriptionRef = await adminDb.collection('subscriptions').add(subscriptionData);

      // Update driver with subscription info
      await driverRef.update({
        subscriptionId: subscriptionRef.id,
        subscriptionStatus: 'active',
        updatedAt: new Date(),
        updatedBy: session.userId,
      });

      // Create notification for driver
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'subscription_created',
          title: 'Assinatura Criada!',
          message: `Sua assinatura do plano ${planData?.name} foi criada com sucesso.`,
          read: false,
          createdAt: new Date(),
          createdBy: 'system',
        });

      return res.status(200).json({ 
        success: true, 
        subscriptionId: subscriptionRef.id,
        message: 'Subscription created successfully' 
      });

    } else if (action === 'renew_subscription') {
      // Renew subscription
      const subscriptionSnap = await adminDb
        .collection('subscriptions')
        .where('driverId', '==', driverId)
        .limit(1)
        .get();

      if (subscriptionSnap.empty) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      const subscriptionDoc = subscriptionSnap.docs[0];
      const subscriptionData = subscriptionDoc.data();
      
      const months = monthsToAdd || 1;
      const newEndDate = new Date(subscriptionData.currentPeriodEnd);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      await subscriptionDoc.ref.update({
        currentPeriodEnd: newEndDate,
        renewedAt: new Date(),
        renewedBy: session.userId,
        renewalMonths: months,
      });

      // Create notification for driver
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'subscription_renewed',
          title: 'Assinatura Renovada!',
          message: `Sua assinatura foi renovada por ${months} mês(es).`,
          read: false,
          createdAt: new Date(),
          createdBy: 'system',
        });

      return res.status(200).json({ 
        success: true, 
        message: 'Subscription renewed successfully' 
      });

    } else if (action === 'cancel_subscription') {
      // Cancel subscription
      const subscriptionSnap = await adminDb
        .collection('subscriptions')
        .where('driverId', '==', driverId)
        .limit(1)
        .get();

      if (subscriptionSnap.empty) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      const subscriptionDoc = subscriptionSnap.docs[0];

      await subscriptionDoc.ref.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: session.userId,
      });

      // Update driver status
      await driverRef.update({
        subscriptionStatus: 'cancelled',
        updatedAt: new Date(),
        updatedBy: session.userId,
      });

      // Create notification for driver
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'subscription_cancelled',
          title: 'Assinatura Cancelada',
          message: 'Sua assinatura foi cancelada. Entre em contato com o suporte para mais informações.',
          read: false,
          createdAt: new Date(),
          createdBy: 'system',
        });

      return res.status(200).json({ 
        success: true, 
        message: 'Subscription cancelled successfully' 
      });

    } else if (action === 'reactivate_subscription') {
      // Reactivate subscription
      const subscriptionSnap = await adminDb
        .collection('subscriptions')
        .where('driverId', '==', driverId)
        .limit(1)
        .get();

      if (subscriptionSnap.empty) {
        return res.status(404).json({ error: 'Subscription not found' });
      }

      const subscriptionDoc = subscriptionSnap.docs[0];
      const subscriptionData = subscriptionDoc.data();

      // Calculate new end date
      const newEndDate = new Date();
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      await subscriptionDoc.ref.update({
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: newEndDate,
        reactivatedAt: new Date(),
        reactivatedBy: session.userId,
      });

      // Update driver status
      await driverRef.update({
        subscriptionStatus: 'active',
        updatedAt: new Date(),
        updatedBy: session.userId,
      });

      // Create notification for driver
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'subscription_reactivated',
          title: 'Assinatura Reativada!',
          message: 'Sua assinatura foi reativada com sucesso.',
          read: false,
          createdAt: new Date(),
          createdBy: 'system',
        });

      return res.status(200).json({ 
        success: true, 
        message: 'Subscription reactivated successfully' 
      });

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Error in subscription management:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
