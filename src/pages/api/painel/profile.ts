import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const session = await getSession(req, res);

    if (!session.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { firstName, lastName, phone, birthDate, city, licenseNumber, licenseExpiry, vehicleType } = req.body;

    // Basic validation
    if (!firstName || !lastName || !phone || !birthDate || !city || !licenseNumber || !licenseExpiry || !vehicleType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Find the driver associated with the user
    const driverSnap = await adminDb.collection('drivers').where('uid', '==', session.userId).limit(1).get();

    if (driverSnap.empty) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    const driverDocRef = driverSnap.docs[0].ref;

    await driverDocRef.update({
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      phone,
      birthDate,
      city,
      licenseNumber,
      licenseExpiry,
      vehicleType,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({ message: 'Profile updated successfully' });

  } catch (error: any) {
    console.error('Error updating driver profile:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

