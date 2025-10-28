import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';
import { UpdateDriverStatusSchema } from '@/schemas/checkin';
import { getPortugalTimestamp, addPortugalTime } from '@/lib/timezone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar sessão
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Validar dados
    const validatedData = UpdateDriverStatusSchema.parse(req.body);
    
    // Obter timestamp atual em Portugal
    const now = getPortugalTimestamp();

    // Atualizar status do motorista
    const driverRef = adminDb.collection('drivers').doc(session.driverId);
    const driverDoc = await driverRef.get();
    
    if (!driverDoc.exists) {
      return res.status(404).json({ error: 'Motorista não encontrado' });
    }

    // Calcular próximo check-in se estiver ativo
    let nextCheckin = null;
    if (validatedData.isActive) {
      nextCheckin = addPortugalTime(5, 'minutes').toMillis();
    }

    await driverRef.update({
      isActive: validatedData.isActive,
      nextCheckin,
      updatedAt: now
    });

    return res.status(200).json({
      success: true,
      message: 'Status atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

