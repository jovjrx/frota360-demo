import { NextApiRequest, NextApiResponse } from 'next';
import { VerifyDriverSchema } from '@/schemas/driver';
import { store } from '@/lib/store';
import { auditLogger } from '@/lib/audit/logger';
import { emailService } from '@/lib/email/mailer';
import { requireAdmin } from '@/lib/auth/rbac';

const handler = requireAdmin(async (req: NextApiRequest, res: NextApiResponse, context) => {
  try {
    const { driverId } = req.query;
    
    if (!driverId || typeof driverId !== 'string') {
      return res.status(400).json({ error: 'Driver ID is required' });
    }

    const validatedData = VerifyDriverSchema.parse(req.body);
    
    // Check if driver exists
    const existingDriver = await store.drivers.findById(driverId);
    if (!existingDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Update driver status
    await store.drivers.update(driverId, {
      status: validatedData.status,
      updatedAt: Date.now(),
    });

    // Log audit trail
    await auditLogger.logDriverVerification(
      context.user.userId!,
      context.role,
      driverId,
      validatedData.status,
      validatedData.reason
    );

    // Send appropriate email notification
    try {
      if (validatedData.status === 'approved') {
        await emailService.sendDriverApprovalEmail(
          existingDriver.email,
          existingDriver.name
        );
      } else if (validatedData.status === 'rejected') {
        await emailService.sendDriverRejectionEmail(
          existingDriver.email,
          existingDriver.name,
          validatedData.reason
        );
      }
    } catch (emailError) {
      console.error('Failed to send status email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({ 
      success: true,
      message: `Driver ${validatedData.status} successfully` 
    });
  } catch (error: any) {
    console.error('Verify driver error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to verify driver' });
  }
});

export default handler;
