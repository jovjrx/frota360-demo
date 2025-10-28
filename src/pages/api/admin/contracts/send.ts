import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { SessionRequest, withIronSessionApiRoute } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { serializeDatasets } from '@/lib/utils/serializeFirestore';
import type { DriverContract } from '@/schemas/driver-contract';

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { driverId, templateId } = req.body;

    if (!driverId || !templateId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getFirestore(firebaseAdmin);

    // Get template to determine type
    const templateDoc = await db.collection('contractTemplates').doc(templateId).get();
    if (!templateDoc.exists) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = templateDoc.data();
    const contractType = template?.type || 'affiliate';

    // Get driver info
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    if (!driverDoc.exists) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driverData = driverDoc.data();
    const driverName = driverData?.fullName || driverData?.name || driverId;
    const driverEmail = driverData?.email || '';

    // Create new contract
    const docRef = await db.collection('driverContracts').add({
      driverId,
      driverName,
      driverEmail,
      contractType,
      category: template?.category,
      templateVersion: template?.version,
      signedDocumentUrl: null,
      signedDocumentFileName: null,
      submittedAt: null,
      status: 'pending_signature',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      emailSentAt: Timestamp.now().toDate().toISOString(),
      createdAt: Timestamp.now().toDate().toISOString(),
      updatedAt: Timestamp.now().toDate().toISOString(),
    } as Omit<DriverContract, 'id'>);

    const newContract = await docRef.get();
    const contract = {
      id: docRef.id,
      ...(newContract.data() as Omit<DriverContract, 'id'>),
    };

    const serialized = serializeDatasets({ contract });

    return res.json({
      id: docRef.id,
      data: serialized.contract,
      message: 'Contract sent successfully',
    });
  } catch (error: any) {
    console.error('[POST /api/admin/contracts]', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
