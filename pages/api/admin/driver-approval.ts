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

    const { driverId, action, planId, rejectionReason } = req.body;

    if (!driverId || !action) {
      return res.status(400).json({ error: 'driverId and action are required' });
    }

    const driverRef = adminDb.collection('drivers').doc(driverId);
    const driverDoc = await driverRef.get();

    if (!driverDoc.exists) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driverData = driverDoc.data();

    if (action === 'approve') {
      // Approve driver and create subscription
      const updateData: any = {
        status: 'active',
        approvedAt: new Date(),
        approvedBy: session.userId,
        updatedAt: new Date(),
      };

      // If planId is provided, update the selected plan
      if (planId) {
        const planDoc = await adminDb.collection('plans').doc(planId).get();
        if (planDoc.exists) {
          const planData = planDoc.data();
          updateData.selectedPlan = planId;
          updateData.planName = planData?.name;
          updateData.planPrice = planData?.priceCents;
        }
      }

      await driverRef.update(updateData);

      // Create subscription if driver has a selected plan
      if (driverData?.selectedPlan || planId) {
        const subscriptionData = {
          driverId,
          planId: planId || driverData.selectedPlan,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          trialStart: new Date(),
          trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
          createdAt: new Date(),
          createdBy: session.userId,
        };

        await adminDb.collection('subscriptions').add(subscriptionData);
      }

      // Create notification for driver
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'driver_approved',
          title: 'Conta Aprovada!',
          message: 'Sua conta foi aprovada e você já pode começar a trabalhar.',
          read: false,
          createdAt: new Date(),
          createdBy: 'system',
        });

      return res.status(200).json({ 
        success: true, 
        message: 'Driver approved successfully' 
      });

    } else if (action === 'reject') {
      // Reject driver
      await driverRef.update({
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: session.userId,
        rejectionReason: rejectionReason || 'Documentos não atendem aos requisitos',
        updatedAt: new Date(),
      });

      // Create notification for driver
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'driver_rejected',
          title: 'Conta Rejeitada',
          message: rejectionReason || 'Sua conta foi rejeitada. Entre em contato com o suporte para mais informações.',
          read: false,
          createdAt: new Date(),
          createdBy: 'system',
        });

      return res.status(200).json({ 
        success: true, 
        message: 'Driver rejected successfully' 
      });

    } else if (action === 'change_plan') {
      // Change driver's plan
      if (!planId) {
        return res.status(400).json({ error: 'planId is required for plan change' });
      }

      const planDoc = await adminDb.collection('plans').doc(planId).get();
      if (!planDoc.exists) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      const planData = planDoc.data();

      await driverRef.update({
        selectedPlan: planId,
        planName: planData?.name,
        planPrice: planData?.priceCents,
        updatedAt: new Date(),
        updatedBy: session.userId,
      });

      // Update or create subscription
      const subscriptionSnap = await adminDb
        .collection('subscriptions')
        .where('driverId', '==', driverId)
        .limit(1)
        .get();

      if (subscriptionSnap.empty) {
        // Create new subscription
        await adminDb.collection('subscriptions').add({
          driverId,
          planId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          createdBy: session.userId,
        });
      } else {
        // Update existing subscription
        const subscriptionDoc = subscriptionSnap.docs[0];
        await subscriptionDoc.ref.update({
          planId,
          updatedAt: new Date(),
          updatedBy: session.userId,
        });
      }

      // Create notification for driver
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'plan_changed',
          title: 'Plano Alterado',
          message: `Seu plano foi alterado para ${planData?.name}.`,
          read: false,
          createdAt: new Date(),
          createdBy: 'system',
        });

      return res.status(200).json({ 
        success: true, 
        message: 'Plan changed successfully' 
      });

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (error) {
    console.error('Error in driver approval:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
