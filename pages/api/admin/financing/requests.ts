import type { NextApiResponse } from 'next';
import { SessionRequest, withIronSessionApiRoute, sessionOptions } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { FinancingRequestSchema, FinancingSchema } from '@/schemas/financing';

/**
 * API para gerenciar solicitações de financiamento.
 * GET: listar todas solicitações pendentes.
 * POST: aprovar ou rejeitar uma solicitação.
 */
export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const db = getFirestore(firebaseAdmin);

  if (req.method === 'GET') {
    try {
      const snapshot = await db.collection('financing_requests').where('status', '==', 'pending').get();
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ success: true, requests });
    } catch (error: any) {
      console.error('Erro ao listar solicitações de financiamento:', error);
      return res.status(500).json({ success: false, error: error.message || 'Erro interno' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { requestId, action, weeklyInterest } = req.body;
      if (!requestId || !action) {
        return res.status(400).json({ success: false, error: 'requestId e action são obrigatórios' });
      }
      const reqRef = db.collection('financing_requests').doc(requestId);
      const reqSnap = await reqRef.get();
      if (!reqSnap.exists) {
        return res.status(404).json({ success: false, error: 'Solicitação não encontrada' });
      }
      const requestData = FinancingRequestSchema.parse({ id: requestId, ...reqSnap.data() });
      const now = new Date().toISOString();
      if (action === 'approve') {
        // Atualizar solicitação para aprovada
        await reqRef.update({ status: 'approved', updatedAt: now });
        // Criar financiamento com base na solicitação
        const financing = FinancingSchema.parse({
          driverId: requestData.driverId,
          type: 'loan',
          amount: requestData.amount,
          weeks: requestData.weeks,
          weeklyInterest: typeof weeklyInterest === 'number' ? weeklyInterest : 0,
          startDate: now,
          endDate: null,
          status: 'active',
          remainingWeeks: requestData.weeks,
          // Campos de comprovante (serão adicionados depois via upload)
          proofUrl: null,
          proofFileName: null,
          proofUploadedAt: null,
          // Campos de auditoria
          notes: null,
          createdBy: user.email || user.id,
          approvedBy: user.email || user.id,
          approvedAt: now,
          createdAt: now,
          updatedAt: now,
        });
        const finRef = await db.collection('financing').add(financing);
        return res.status(200).json({ success: true, financingId: finRef.id });
      }
      if (action === 'reject') {
        await reqRef.update({ status: 'rejected', updatedAt: now });
        return res.status(200).json({ success: true });
      }
      return res.status(400).json({ success: false, error: 'Ação inválida' });
    } catch (error: any) {
      console.error('Erro ao atualizar solicitação de financiamento:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ success: false, error: 'Erro de validação', details: error.errors });
      }
      return res.status(500).json({ success: false, error: error.message || 'Erro interno' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}, sessionOptions);