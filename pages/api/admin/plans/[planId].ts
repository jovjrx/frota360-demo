import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check admin authentication
    const session = await getSession(req, res);
    if (!session.userId || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { planId } = req.query;

    if (!planId || typeof planId !== 'string') {
      return res.status(400).json({ error: 'planId is required' });
    }

    const planRef = adminDb.collection('plans').doc(planId);
    const planDoc = await planRef.get();

    if (!planDoc.exists) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (req.method === 'GET') {
      // Get specific plan
      const planData = planDoc.data();
      return res.status(200).json({ 
        id: planDoc.id,
        ...planData 
      });

    } else if (req.method === 'PUT') {
      // Update plan
      const { name, description, price, interval, trialDays, features, active, featured } = req.body;

      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: session.userId,
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.priceCents = Math.round(price * 100);
      if (interval !== undefined) updateData.interval = interval;
      if (trialDays !== undefined) updateData.trialDays = trialDays;
      if (features !== undefined) updateData.features = features;
      if (active !== undefined) updateData.active = active;
      if (featured !== undefined) updateData.featured = featured;

      await planRef.update(updateData);

      return res.status(200).json({ 
        success: true, 
        message: 'Plan updated successfully' 
      });

    } else if (req.method === 'DELETE') {
      // Delete plan
      // Check if plan has active subscriptions
      const subscriptionsSnap = await adminDb
        .collection('subscriptions')
        .where('planId', '==', planId)
        .where('status', '==', 'active')
        .get();

      if (!subscriptionsSnap.empty) {
        return res.status(400).json({ 
          error: 'Cannot delete plan with active subscriptions' 
        });
      }

      await planRef.delete();

      return res.status(200).json({ 
        success: true, 
        message: 'Plan deleted successfully' 
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in plan API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
