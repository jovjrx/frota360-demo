import { NextApiRequest, NextApiResponse } from 'next';
import { CreatePlanSchema, UpdatePlanSchema } from '@/schemas/plan';
import { store } from '@/lib/store';
import { auditLogger } from '@/lib/audit/logger';
import { requireAdmin } from '@/lib/auth/rbac';

const handler = requireAdmin(async (req: NextApiRequest, res: NextApiResponse, context) => {
  try {
    if (req.method === 'POST') {
      // Create new plan
      const validatedData = CreatePlanSchema.parse(req.body);
      
      const planId = await store.plans.create(validatedData);

      // Log audit trail
      await auditLogger.log(
        {
          actorId: context.user.userId!,
          actorRole: context.role,
        },
        {
          action: 'create',
          subjectType: 'plan',
          subjectId: planId,
          details: { planName: validatedData.name },
        }
      );

      res.status(201).json({ 
        success: true, 
        planId,
        message: 'Plan created successfully' 
      });
    } else if (req.method === 'PUT') {
      // Update existing plan
      const { planId } = req.query;
      
      if (!planId || typeof planId !== 'string') {
        return res.status(400).json({ error: 'Plan ID is required' });
      }

      const validatedData = UpdatePlanSchema.parse(req.body);
      
      // Check if plan exists
      const existingPlan = await store.plans.findById(planId);
      if (!existingPlan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      await store.plans.update(planId, validatedData);

      // Log audit trail
      await auditLogger.log(
        {
          actorId: context.user.userId!,
          actorRole: context.role,
        },
        {
          action: 'update',
          subjectType: 'plan',
          subjectId: planId,
          details: validatedData,
        }
      );

      res.status(200).json({ 
        success: true,
        message: 'Plan updated successfully' 
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Upsert plan error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to upsert plan' });
  }
});

export default handler;

