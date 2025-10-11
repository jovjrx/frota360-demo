import type { NextApiRequest, NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { FinancingSchema } from '@/schemas/financing';

export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const db = getFirestore(firebaseAdmin);

  if (req.method === 'GET') {
    try {
      let query: any = db.collection('financing');
      const { driverId } = req.query as { driverId?: string };
      if (driverId) {
        query = query.where('driverId', '==', driverId);
      }
      const snapshot = await query.get();
      const financing = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ success: true, financing });
    } catch (error: any) {
      console.error('Erro ao listar financiamentos:', error);
      return res.status(500).json({ success: false, error: error.message || 'Erro interno' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { driverId, type, amount, weeks, weeklyInterest, notes } = req.body;
      if (!driverId || !type) {
        return res.status(400).json({ success: false, error: 'driverId e type são obrigatórios' });
      }
      const now = new Date().toISOString();
      const financing = FinancingSchema.parse({
        driverId,
        type,
        amount: typeof amount === 'number' ? amount : 0,
        weeks: type === 'loan' ? (typeof weeks === 'number' ? weeks : null) : null,
        weeklyInterest: typeof weeklyInterest === 'number' ? weeklyInterest : 0,
        startDate: now,
        endDate: null,
        status: 'active',
        remainingWeeks: type === 'loan' ? (typeof weeks === 'number' ? weeks : null) : null,
        // Campos de comprovante (serão adicionados depois via upload)
        proofUrl: null,
        proofFileName: null,
        proofUploadedAt: null,
        // Campos de auditoria
        notes: notes || null,
        createdBy: user.email || user.id,
        approvedBy: null,
        approvedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      const docRef = await db.collection('financing').add(financing);
      return res.status(201).json({ success: true, id: docRef.id });
    } catch (error: any) {
      console.error('Erro ao criar financiamento:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Erro de validação', details: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message || 'Erro interno' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}, sessionOptions);