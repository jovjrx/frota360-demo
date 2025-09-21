import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';
import { CreateCheckInSchema, UpdateDriverStatusSchema } from '@/schemas/checkin';
import { getClientIP } from '@/lib/location';
import { getPortugalTimestamp, addPortugalTime } from '@/lib/timezone';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar sessão
    const session = await getSession(req, res);
    if (!session.userId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    // Validar dados
    const validatedData = CreateCheckInSchema.parse(req.body);
    
    // Obter IP do cliente
    const clientIP = getClientIP(req);
    
    // Atualizar IP na localização
    validatedData.location.ip = clientIP;
    
    // Obter timestamp atual em Portugal
    const now = getPortugalTimestamp();
    validatedData.timestamp = now;

    // Criar documento de check-in
    const checkInRef = await adminDb.collection('driver_checkins').add({
      ...validatedData,
      createdAt: now,
      updatedAt: now
    });

    // Atualizar status do motorista
    const driverRef = adminDb.collection('drivers').doc(validatedData.driverId);
    const driverDoc = await driverRef.get();
    
    if (driverDoc.exists) {
      const currentData = driverDoc.data();
      const checkinCount = (currentData?.checkinCount || 0) + 1;
      
      // Calcular próximo check-in se estiver ativo
      let nextCheckin = null;
      if (validatedData.status === 'active') {
        nextCheckin = addPortugalTime(5, 'minutes').toMillis();
      }

      await driverRef.update({
        isActive: validatedData.status === 'active',
        lastCheckin: now,
        nextCheckin,
        checkinCount,
        updatedAt: now
      });
    }

    return res.status(200).json({
      success: true,
      checkInId: checkInRef.id,
      message: 'Check-in registrado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao registrar check-in:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
