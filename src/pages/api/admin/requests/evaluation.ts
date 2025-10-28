import type { NextApiResponse } from 'next';
import { SessionRequest } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';

export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { requestId, adminNotes } = req.body;

  if (!requestId) {
    return res.status(400).json({ success: false, error: 'Request ID is required' });
  }

  try {
    const db = getFirestore(firebaseAdmin);
    const requestRef = db.collection('driver_requests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({ success: false, error: 'Driver request not found' });
    }

    await requestRef.update({
      status: 'evaluation',
      adminNotes: adminNotes || null,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: 'Request status updated to evaluation' });
  } catch (error: any) {
    console.error('Error updating request status to evaluation:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}, sessionOptions);


