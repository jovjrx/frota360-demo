import { NextApiRequest, NextApiResponse } from 'next';
import { UpdateDriverSchema } from '@/schemas/driver';
import { store } from '@/lib/store';
import { auditLogger } from '@/lib/audit/logger';
import { requireAdmin } from '@/lib/auth/rbac';

const handler = requireAdmin(async (req: NextApiRequest, res: NextApiResponse, context) => {
  try {
    const { driverId } = req.query;
    
    if (!driverId || typeof driverId !== 'string') {
      return res.status(400).json({ error: 'Driver ID is required' });
    }

    const validatedData = UpdateDriverSchema.parse(req.body);
    
    // Check if driver exists
    const existingDriver = await store.drivers.findById(driverId);
    if (!existingDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Update driver
    await store.drivers.update(driverId, validatedData);

    // Log audit trail
    await auditLogger.logDriverUpdate(
      context.user.userId!,
      context.role,
      driverId,
      validatedData
    );

    res.status(200).json({ 
      success: true,
      message: 'Driver updated successfully' 
    });
  } catch (error: any) {
    console.error('Update driver error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to update driver' });
  }
});

export default handler;
