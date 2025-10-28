import { NextApiResponse } from 'next';
import { SessionRequest } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { VerifyDriverSchema } from '@/schemas/driver';
import { getPortugalTimestamp } from '@/lib/timezone';

export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const db = getFirestore(firebaseAdmin);
    const { driverId, ...updateData } = req.body;

    if (!driverId) {
      return res.status(400).json({ success: false, error: 'ID do motorista é obrigatório' });
    }

    // Validar dados
    const validatedData = VerifyDriverSchema.parse(updateData);
    
    // Obter timestamp atual em Portugal
    const now = getPortugalTimestamp();

    // Atualizar motorista
    const driverRef = db.collection('drivers').doc(driverId);
    const driverDoc = await driverRef.get();
    
    if (!driverDoc.exists) {
      return res.status(404).json({ success: false, error: 'Motorista não encontrado' });
    }

    const currentData = driverDoc.data();
    
    // Preparar dados de atualização
    const updateFields: any = {
      status: validatedData.status,
      statusUpdatedAt: now,
      statusUpdatedBy: user.id,
      updatedAt: now,
    };

    // Se está sendo aprovado, marcar como aprovado
    if (validatedData.status === 'active' && currentData?.status === 'pending') {
      updateFields.isApproved = true;
      updateFields.approvedAt = now;
      updateFields.approvedBy = user.id;
    }

    // Se está sendo desativado, marcar como inativo
    if (validatedData.status === 'inactive' || validatedData.status === 'suspended') {
      updateFields.isActive = false;
    }

    await driverRef.update(updateFields);

    // Log da ação
    await db.collection('audit_logs').add({
      action: 'driver_status_update',
      driverId,
      adminId: user.id,
      oldStatus: currentData?.status,
      newStatus: validatedData.status,
      reason: validatedData.reason || '',
      timestamp: now,
      createdAt: now,
    });

    return res.status(200).json({
      success: true,
      message: 'Status do motorista atualizado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao atualizar status do motorista:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}, sessionOptions);


