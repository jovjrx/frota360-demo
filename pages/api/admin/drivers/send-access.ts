import { NextApiResponse } from 'next';
import { withIronSessionApiRoute, sessionOptions, SessionRequest } from '@/lib/session/ironSession';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import { generateTemporaryPassword } from '@/lib/utils/password';
import { emailService } from '@/lib/email/mailer';

interface SendAccessRequestBody {
  driverId?: string;
}

export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { driverId } = (req.body as SendAccessRequestBody) || {};

  if (!driverId) {
    return res.status(400).json({ success: false, error: 'Driver ID is required' });
  }

  try {
    const driverRef = adminDb.collection('drivers').doc(driverId);
    const driverSnap = await driverRef.get();

    if (!driverSnap.exists) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }

    const driverData = driverSnap.data() || {};
    const driverEmail: string | undefined = driverData.email;
    const driverName: string = driverData.fullName || driverData.name || 'Motorista';

    if (!driverEmail) {
      return res.status(400).json({ success: false, error: 'Driver has no email on file' });
    }

    let firebaseUid: string | undefined = driverData.firebaseUid;

    if (!firebaseUid) {
      try {
        const existingUser = await adminAuth.getUserByEmail(driverEmail);
        firebaseUid = existingUser.uid;
      } catch (lookupError) {
        console.warn(`Driver ${driverId} not found in Firebase Auth. A new user will be created.`);
      }
    }

    const temporaryPassword = generateTemporaryPassword();

    if (firebaseUid) {
      await adminAuth.updateUser(firebaseUid, { password: temporaryPassword });
    } else {
      const newUser = await adminAuth.createUser({
        email: driverEmail,
        password: temporaryPassword,
        emailVerified: false,
        displayName: driverName,
      });
      firebaseUid = newUser.uid;
    }

    if (firebaseUid) {
      await adminAuth.setCustomUserClaims(firebaseUid, {
        role: 'driver',
        driverId,
      });
    }

    const nowIso = new Date().toISOString();

    await driverRef.set(
      {
        firebaseUid,
        updatedAt: nowIso,
        lastAccessEmailAt: nowIso,
      },
      { merge: true }
    );

    await emailService.sendDriverCredentialsEmail(driverEmail, driverName, temporaryPassword);

    return res.status(200).json({
      success: true,
      message: 'Access email sent',
      temporaryPassword,
    });
  } catch (error: any) {
    console.error('Failed to send driver access email:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to send driver access email',
    });
  }
}, sessionOptions);
