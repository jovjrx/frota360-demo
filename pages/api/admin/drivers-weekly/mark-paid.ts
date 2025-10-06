import { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@/lib/auth/helpers';
import { db } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  try {
    const { id, paymentDate } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Record ID is required' });
    }
    
    await db.collection('driver_weekly_records').doc(id).update({
      paymentStatus: 'paid',
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    });
    
    const doc = await db.collection('driver_weekly_records').doc(id).get();
    
    return res.status(200).json({
      success: true,
      record: { id: doc.id, ...doc.data() },
    });
  } catch (error: any) {
    console.error('Error marking driver weekly record as paid:', error);
    return res.status(500).json({ error: error.message });
  }
}
