import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session/ironSession';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { driverId, selectedPlan, planName, planPrice } = req.body;

    if (!driverId) {
      return res.status(400).json({ error: 'Driver ID is required' });
    }

    // Verify driver ownership
    const driverSnap = await adminDb.collection('drivers').where('uid', '==', session.userId).limit(1).get();
    if (driverSnap.empty || driverSnap.docs[0].id !== driverId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update driver data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (selectedPlan) updateData.selectedPlan = selectedPlan;
    if (planName) updateData.planName = planName;
    if (planPrice) updateData.planPrice = planPrice;

    await adminDb.collection('drivers').doc(driverId).update(updateData);

    return res.status(200).json({
      success: true,
      message: 'Driver updated successfully'
    });

  } catch (error) {
    console.error('Error updating driver:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

