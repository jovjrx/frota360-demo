import { NextApiResponse } from 'next';
import { SessionRequest } from '@/lib/session/ironSession';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { UpdateDriverAdminSchema } from '@/schemas/driver';
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
    const { driverId } = req.query;
    
    if (!driverId || typeof driverId !== 'string') {
      return res.status(400).json({ success: false, error: 'Driver ID is required' });
    }

    const validatedData = UpdateDriverAdminSchema.parse(req.body);
    const now = getPortugalTimestamp();

    // Check if driver exists
    const driverRef = db.collection('drivers').doc(driverId);
    const existingDriverDoc = await driverRef.get();
    if (!existingDriverDoc.exists) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    const existingDriver = existingDriverDoc.data();

    // Prepare update data
    const updateFields: any = {
      ...validatedData,
      updatedAt: now,
    };

    // Update status related fields only if status is being changed
    if (validatedData.status && validatedData.status !== existingDriver?.status) {
      updateFields.statusUpdatedAt = now;
      updateFields.statusUpdatedBy = user.id;
    }

    await driverRef.update(updateFields);

    // Log audit trail
    await db.collection('audit_logs').add({
      action: 'driver_update',
      driverId,
      adminId: user.id,
      oldData: existingDriver,
      newData: updateFields,
      timestamp: now,
      createdAt: now,
    });

    res.status(200).json({ 
      success: true,
      message: 'Driver updated successfully' 
    });
  } catch (error: any) {
    console.error('Update driver admin fields error:', error);
    
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        success: false,
        error: 'Validation error',
        details: error.errors 
      });
    }
    
    res.status(500).json({ success: false, error: error.message || 'Failed to update driver' });
  }
}, sessionOptions);

