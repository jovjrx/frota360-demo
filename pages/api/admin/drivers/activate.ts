import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';
import { VerifyDriverSchema } from '@/schemas/driver';
import { getPortugalTimestamp } from '@/lib/timezone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar sessão de admin
    const session = await getSession(req, res);
    if (!session.userId || session.role !== 'admin') {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Validar dados
    const { driverId, ...updateData } = req.body;
    const validatedData = VerifyDriverSchema.parse(updateData);
    
    if (!driverId) {
      return res.status(400).json({ error: 'ID do motorista é obrigatório' });
    }

    // Obter timestamp atual em Portugal
    const now = getPortugalTimestamp();

    // Atualizar motorista
    const driverRef = adminDb.collection('drivers').doc(driverId);
    const driverDoc = await driverRef.get();
    
    if (!driverDoc.exists) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }

    const currentData = driverDoc.data();
    
    // Preparar dados de atualização
    const updateFields: any = {
      status: validatedData.status,
      statusUpdatedAt: now,
      statusUpdatedBy: session.userId,
      updatedAt: now,
    };

    // Se está sendo aprovado, marcar como aprovado
    if (validatedData.status === 'active' && currentData?.status === 'pending') {
      updateFields.isApproved = true;
      updateFields.approvedAt = now;
      updateFields.approvedBy = session.userId;
    }

    // Se está sendo desativado, marcar como inativo
    if (validatedData.status === 'inactive' || validatedData.status === 'suspended') {
      updateFields.isActive = false;
    }

    await driverRef.update(updateFields);

    // Log da ação
    await adminDb.collection('audit_logs').add({
      action: 'driver_status_update',
      driverId,
      adminId: session.userId,
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

  } catch (error) {
    console.error('Erro ao atualizar status do motorista:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
