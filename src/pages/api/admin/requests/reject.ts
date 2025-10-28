import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { sessionOptions, SessionRequest, withIronSessionApiRoute } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { sendEmail } from '@/lib/email/sendEmail';
import { getRejectionEmailTemplate } from '@/lib/email/templates';

export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { requestId, rejectionReason } = req.body;

  if (!requestId) {
    return res.status(400).json({ success: false, error: 'Request ID is required' });
  }

  try {
    const db = getFirestore(firebaseAdmin);
    const requestRef = db.collection('driver_requests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({ success: false, error: 'Driver request not found' });
    }

    const requestData = requestDoc.data() as any;

    if (requestData.status === 'rejected') {
      return res.status(400).json({ success: false, error: 'Request already rejected' });
    }

    // Update request status to 'rejected'
    await requestRef.update({
      status: 'rejected',
      rejectionReason: rejectionReason || null,
      updatedAt: new Date().toISOString(),
      rejectedBy: user.id,
    });

    // Send rejection email
    const emailTemplate = getRejectionEmailTemplate({
      driverName: requestData.fullName,
      reason: rejectionReason || 'Não especificado',
    });

    await sendEmail({
      to: requestData.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return res.status(200).json({ success: true, message: 'Driver request rejected' });
  } catch (error: any) {
    console.error('Error rejecting driver request:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}, sessionOptions);

