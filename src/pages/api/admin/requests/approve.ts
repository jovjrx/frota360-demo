import type { NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { withIronSessionApiRoute, SessionRequest } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { sendEmail } from '@/lib/email/sendEmail';
import { getApprovalEmailTemplate } from '@/lib/email/templates';
import { initializeNewDriver } from '@/lib/services/driver-initialization';
// import { acceptReferralInvite } from '@/lib/services/referral-manager';

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
    // Garantir taxa administrativa padrão: €25 fixo
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
      adminFee: {
        mode: 'fixed',
        fixedValue: 25,
      },
      // Add other default driver fields as needed
      // Se existir referrerId na solicitação, já vincula a cadeia de comissões
      referredBy: requestData.referrerId || undefined,
    });

    // 3.2. Se existir referralInviteCode, marcar convite como aceito (atualiza rede e contadores)
    try {
      if (requestData.referralInviteCode) {
        await acceptReferralInvite(
          requestData.referralInviteCode,
          firebaseUser.uid,
          requestData.fullName,
          requestData.email
        );
      }
    } catch (err) {
      console.error('[approve] Falha ao aceitar convite de referência:', err);
      // Não falhar aprovação por isso
    }

    // 3.5. Initialize driver structures (commissions, referral, KPIs, goals, technical reserve)
    const initResult = await initializeNewDriver(
      firebaseUser.uid,
      requestData.fullName,
      requestData.type,
      requestData.email
    );

    if (!initResult.success) {
      console.warn('Warning: Some driver structures failed to initialize:', initResult);
      // Don't fail the request if initialization partially fails
    }

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

    return res.status(200).json({
      success: true,
      message: 'Driver request approved and user created',
      driverId: firebaseUser.uid,
      initializationResult: initResult,
    });
  } catch (error: any) {
    console.error('Error approving driver request:', error);
    // If user creation fails, try to clean up the request status if it was updated
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error',
      details: error.toString(),
    });
  }
}, sessionOptions);



