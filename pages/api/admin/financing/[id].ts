import { NextApiRequest, NextApiResponse } from 'next';
import { SessionRequest } from '@/lib/session/ironSession';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { z } from 'zod';
import { getPortugalTimestamp } from '@/lib/timezone';

export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const db = getFirestore(firebaseAdmin);
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: 'Financing ID is required' });
    }

    // Schema flexível para atualização de financiamento
    const FinancingUpdateSchema = z.object({
      driverId: z.string().optional(),
      type: z.enum(['loan', 'discount']).optional(),
      amount: z.number().optional(),
      weeks: z.number().nullable().optional(),
      weeklyInterest: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().nullable().optional(),
      status: z.enum(['active', 'completed']).optional(),
      notes: z.string().nullable().optional(),
    });

    const validationResult = FinancingUpdateSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.error('❌ Erro de validação:', validationResult.error.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: validationResult.error.errors
      });
    }

    const validatedData = validationResult.data;
    const now = getPortugalTimestamp();

    // Check if financing exists
    const financingRef = db.collection('financing').doc(id);
    const existingFinancingDoc = await financingRef.get();
    if (!existingFinancingDoc.exists) {
      return res.status(404).json({ success: false, error: 'Financing not found' });
    }

    const existingFinancing = existingFinancingDoc.data();

    // Prepare update data
    const updateFields: any = {
      ...validatedData,
      updatedAt: now,
    };

    // Update status related fields only if status is being changed
    if (validatedData.status && validatedData.status !== existingFinancing?.status) {
      updateFields.statusUpdatedAt = now;
      updateFields.statusUpdatedBy = user.id;
    }

    await financingRef.update(updateFields);

    // Log audit trail
    await db.collection('audit_logs').add({
      action: 'financing_update',
      financingId: id,
      adminId: user.id,
      oldData: existingFinancing,
      newData: updateFields,
      timestamp: now,
      createdAt: now,
    });

    res.status(200).json({
      success: true,
      message: 'Financing updated successfully'
    });
  } catch (error: any) {
    console.error('Update financing error:', error);

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({ success: false, error: error.message || 'Failed to update financing' });
  }
}, sessionOptions);
