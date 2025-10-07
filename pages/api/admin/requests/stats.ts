import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';

interface DriverRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'evaluation' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export default withIronSessionApiRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const db = getFirestore(firebaseAdmin);
    const requestsRef = db.collection('driver_requests');
    const snapshot = await requestsRef.get();

    const requests: DriverRequest[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<DriverRequest, 'id'>,
    }));

    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      evaluation: requests.filter(r => r.status === 'evaluation').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    };

    return res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching requests stats:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}, sessionOptions);

