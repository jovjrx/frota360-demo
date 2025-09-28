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

    if (req.method === 'GET') {
      // Get all plans
      const plansSnap = await adminDb.collection('plans').get();
      const plans = plansSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ plans });

    } else if (req.method === 'POST') {
      // Create new plan
      const { name, description, price, interval, trialDays, features, active, featured } = req.body;

      if (!name || !price) {
        return res.status(400).json({ error: 'name and price are required' });
      }

      const planData = {
        name,
        description: description || '',
        priceCents: Math.round(price * 100), // Convert to cents
        interval: interval || 'month',
        trialDays: trialDays || 0,
        features: features || [],
        active: active !== false,
        featured: featured || false,
        createdAt: new Date(),
        createdBy: session.userId,
        updatedAt: new Date(),
        updatedBy: session.userId,
      };

      const planRef = await adminDb.collection('plans').add(planData);

      return res.status(200).json({ 
        success: true, 
        planId: planRef.id,
        message: 'Plan created successfully' 
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in plans API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
