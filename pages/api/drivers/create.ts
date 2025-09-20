import { NextApiRequest, NextApiResponse } from 'next';
import { CreateDriverSchema } from '@/schemas/driver';
import { store } from '@/lib/store';
import { auditLogger } from '@/lib/audit/logger';
import { emailService } from '@/lib/email/mailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = CreateDriverSchema.parse(req.body);
    
    // Check if driver already exists
    const existingDriver = await store.drivers.findByUserId(validatedData.userId);
    if (existingDriver) {
      return res.status(400).json({ error: 'Driver already exists for this user' });
    }

    // Create driver
    const driverId = await store.drivers.create({
      ...validatedData,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log audit trail
    await auditLogger.logDriverCreation(
      validatedData.userId,
      'system',
      driverId,
      validatedData.email
    );

    // Send welcome email
    try {
      await emailService.sendDriverWelcomeEmail(validatedData.email, validatedData.name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({ 
      success: true, 
      driverId,
      message: 'Driver created successfully' 
    });
  } catch (error: any) {
    console.error('Create driver error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }
    
    res.status(500).json({ error: error.message || 'Failed to create driver' });
  }
}
