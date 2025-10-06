import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

/**
 * API para solicitar reset de senha
 * POST /api/auth/request-password-reset
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }

    // Verificar se motorista existe
    const driversSnap = await adminDb
      .collection('drivers')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (driversSnap.empty) {
      // Por segurança, não revelar se o email existe ou não
      return res.status(200).json({ 
        success: true,
        message: 'Se o email existir, você receberá instruções para redefinir sua senha.'
      });
    }

    const driverDoc = driversSnap.docs[0];
    const driverData = driverDoc.data();
    const driverId = driverDoc.id;

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no Firestore
    await adminDb.collection('drivers').doc(driverId).update({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpiry: resetTokenExpiry.toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Enviar email com link de reset
    try {
      const { emailService } = await import('@/lib/email/mailer');
      await emailService.sendPasswordResetEmail(
        email,
        driverData.fullName || `${driverData.firstName} ${driverData.lastName}`,
        resetToken // Enviar token não-hash no email
      );
      console.log(`✅ Email de reset de senha enviado para ${email}`);
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      return res.status(500).json({ 
        error: 'Erro ao enviar email de recuperação' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Se o email existir, você receberá instruções para redefinir sua senha.'
    });

  } catch (error: any) {
    console.error('Erro ao solicitar reset de senha:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar solicitação',
      details: error.message 
    });
  }
}
