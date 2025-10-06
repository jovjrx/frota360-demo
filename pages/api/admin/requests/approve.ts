import { NextApiRequest, NextApiResponse } from 'next';
import { approveRequestSchema } from '@/schemas/request';
import { db, auth } from '@/lib/firebaseAdmin';
import { requireAdmin } from '@/lib/auth/helpers';
import { ApiResponse } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Verificar autenticação
  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { requestId } = req.query;
    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'ID da solicitação é obrigatório',
      });
    }

    // Validar dados
    const validatedData = approveRequestSchema.parse(req.body);

    // Buscar solicitação
    const requestDoc = await db.collection('requests').doc(requestId).get();
    if (!requestDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Solicitação não encontrada',
      });
    }

    const requestData = requestDoc.data();

    // Criar usuário no Firebase Auth
    const userRecord = await auth.createUser({
      email: requestData?.email,
      displayName: `${requestData?.firstName} ${requestData?.lastName}`,
      password: Math.random().toString(36).slice(-8) + 'Aa1!', // Senha temporária
    });

    // Criar documento do motorista
    const driverData = {
      uid: userRecord.uid,
      userId: userRecord.uid,
      email: requestData?.email,
      firstName: requestData?.firstName,
      lastName: requestData?.lastName,
      name: `${requestData?.firstName} ${requestData?.lastName}`,
      fullName: `${requestData?.firstName} ${requestData?.lastName}`,
      phone: requestData?.phone,
      city: requestData?.city,
      birthDate: requestData?.birthDate,
      driverType: requestData?.driverType,
      licenseNumber: requestData?.licenseNumber,
      licenseExpiry: requestData?.licenseExpiry,
      vehicle: requestData?.vehicle,
      status: 'active',
      isActive: true,
      isApproved: true,
      approvedAt: Date.now(),
      approvedBy: session.user.id,
      locale: requestData?.locale || 'pt',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.collection('drivers').doc(userRecord.uid).set(driverData);

    // Atualizar solicitação
    await db.collection('requests').doc(requestId).update({
      status: 'approved',
      adminNotes: validatedData.adminNotes,
      reviewedBy: session.user.id,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // TODO: Enviar email de boas-vindas com senha temporária

    return res.status(200).json({
      success: true,
      message: 'Solicitação aprovada com sucesso',
      data: {
        driverId: userRecord.uid,
      },
    });
  } catch (error: any) {
    console.error('Error approving request:', error);

    return res.status(500).json({
      success: false,
      error: 'Erro ao aprovar solicitação',
      message: error.message,
    });
  }
}
