import type { NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { withIronSessionApiRoute, SessionRequest } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { sendEmail } from '@/lib/email/sendEmail';
import { getApprovalEmailTemplate } from '@/lib/email/templates';

export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { requestId, adminNotes } = req.body;

  if (!requestId) {
    return res.status(400).json({ success: false, error: 'Request ID is required' });
  }

  try {
    const db = getFirestore(firebaseAdmin);
    const auth = getAuth(firebaseAdmin);
    const requestRef = db.collection('driver_requests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({ success: false, error: 'Driver request not found' });
    }

    const requestData = requestDoc.data() as any;

    if (requestData.status === 'approved') {
      return res.status(400).json({ success: false, error: 'Request already approved' });
    }

    // 1. Create Firebase Auth user
    const password = Math.random().toString(36).slice(-8) + 'Aa1!'; // Generate a random password with complexity
    const firebaseUser = await auth.createUser({
      email: requestData.email,
      password: password,
      displayName: requestData.fullName,
      emailVerified: true,
    });

    // 2. Set custom claims for 'driver' role
    await auth.setCustomUserClaims(firebaseUser.uid, { role: 'driver' });

    // 3. Save driver data to Firestore 'drivers' collection
    await db.collection('drivers').doc(firebaseUser.uid).set({
      userId: firebaseUser.uid,
      fullName: requestData.fullName,
      email: requestData.email,
      phone: requestData.phone,
      type: requestData.type, // 'affiliate' or 'renter'
      status: 'active',
      createdAt: new Date().toISOString(),
      integrations: { // Default empty integrations
        uber: { enabled: false, key: '' },
        bolt: { enabled: false, key: '' },
        myprio: { enabled: false, key: '' },
        viaverde: { enabled: false, key: '' },
        cartrack: { enabled: false, key: '' },
      },
      // Add other default driver fields as needed
    });

    // 4. Update request status to 'approved'
    await requestRef.update({
      status: 'approved',
      updatedAt: new Date().toISOString(),
      approvedBy: user.id,
      driverId: firebaseUser.uid,
      adminNotes: adminNotes || null,
    });

    // 5. Send approval email with login details
    const emailTemplate = getApprovalEmailTemplate({
      driverName: requestData.fullName,
      email: requestData.email,
      password: password,
      loginUrl: `${process.env.NEXTAUTH_URL}/login`,
    });

    await sendEmail({
      to: requestData.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return res.status(200).json({ success: true, message: 'Driver request approved and user created' });
  } catch (error: any) {
    console.error('Error approving driver request:', error);
    // If user creation fails, try to clean up the request status if it was updated
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}, sessionOptions);


