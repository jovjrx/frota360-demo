import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { Query, CollectionReference } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { active } = req.query;
    
    // Get plans from Firestore
    let query: Query | CollectionReference = adminDb.collection('plans');
    
    // Filter by active status if specified
    if (active !== undefined) {
      const isActive = active === 'true';
      query = query.where('active', '==', isActive);
    }
    
    const plansSnap = await query.get();
    const plans = plansSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(plans);
  } catch (error: any) {
    console.error('List plans error:', error);
    res.status(500).json({ error: error.message || 'Failed to list plans' });
  }
}
