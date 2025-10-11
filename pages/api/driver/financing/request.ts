import type { NextApiResponse } from 'next';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions, SessionRequest } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { FinancingRequestSchema } from '@/schemas/financing';

/**
 * API para que o motorista solicite um financiamento.
 * Cria um documento em `financing_requests` com status 'pending'.
 */
export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;

  if (!user || user.role !== 'driver') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { amount, weeks } = req.body;

    if (typeof amount !== 'number' || amount <= 0 || typeof weeks !== 'number' || weeks <= 0) {
      return res.status(400).json({ success: false, error: 'amount e weeks são obrigatórios e devem ser positivos' });
    }

    const now = new Date().toISOString();
    const newRequest = FinancingRequestSchema.parse({
      driverId: user.id,
      amount: amount,
      weeks: weeks,
      createdAt: now,
      updatedAt: now,
      status: 'pending',
    });

    const db = getFirestore(firebaseAdmin);
    const docRef = await db.collection('financing_requests').add(newRequest);

    return res.status(201).json({ success: true, requestId: docRef.id });
  } catch (error: any) {
    console.error('Error creating financing request:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    return res.status(500).json({ success: false, error: error.message || 'Failed to create financing request' });
  }
}, sessionOptions);