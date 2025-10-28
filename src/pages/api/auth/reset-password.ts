import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

/**
 * API para confirmar reset de senha
 * POST /api/auth/reset-password
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    // Validar senha
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    // Hash do token recebido
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar motorista com este token
    const driversSnap = await adminDb
      .collection('drivers')
      .where('resetPasswordToken', '==', resetTokenHash)
      .limit(1)
      .get();

    if (driversSnap.empty) {
      return res.status(400).json({ 
        error: 'Token inválido ou expirado' 
      });
    }

    const driverDoc = driversSnap.docs[0];
    const driverData = driverDoc.data();
    const driverId = driverDoc.id;

    // Verificar se token expirou
    const tokenExpiry = new Date(driverData.resetPasswordExpiry);
    if (tokenExpiry < new Date()) {
      return res.status(400).json({ 
        error: 'Token expirado. Solicite um novo link de recuperação.' 
      });
    }

    // Atualizar senha no Firebase Auth
    if (!driverData.firebaseUid) {
      return res.status(400).json({ 
        error: 'Conta Firebase Auth não encontrada' 
      });
    }

    try {
      await adminAuth.updateUser(driverData.firebaseUid, {
        password: newPassword,
      });
      console.log(`✅ Senha atualizada para ${driverData.email}`);
    } catch (authError: any) {
      console.error('Erro ao atualizar senha no Firebase Auth:', authError);
      return res.status(500).json({ 
        error: 'Erro ao atualizar senha' 
      });
    }

    // Limpar token de reset
    await adminDb.collection('drivers').doc(driverId).update({
      resetPasswordToken: null,
      resetPasswordExpiry: null,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ 
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode fazer login.'
    });

  } catch (error: any) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar solicitação',
      details: error.message 
    });
  }
}

