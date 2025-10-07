import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';

interface DriverRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  type: 'affiliate' | 'renter';
  status: 'pending' | 'evaluation' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export default withIronSessionApiRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const db = getFirestore(firebaseAdmin);
      let requestsRef: FirebaseFirestore.Query = db.collection('driver_requests');

      const { status, page = '1', limit = '10' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Filtrar por status se fornecido
      if (status && status !== 'all') {
        requestsRef = requestsRef.where('status', '==', status);
      }

      // Contar total (sem paginação ainda)
      const totalSnapshot = await requestsRef.get();
      const total = totalSnapshot.size;

      // Aplicar paginação
      const snapshot = await requestsRef
        .orderBy('createdAt', 'desc')
        .limit(limitNum)
        .offset(offset)
        .get();

      const requests: DriverRequest[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<DriverRequest, 'id'>,
      }));

      return res.status(200).json({
        success: true,
        data: requests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error('Error fetching driver requests:', error);
      return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
}, sessionOptions);
