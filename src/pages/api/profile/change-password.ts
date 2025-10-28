import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, newPassword, adminId } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'userId e newPassword são obrigatórios' });
    }

    // Validar senha
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Atualizar senha no Firebase Auth
    await adminAuth.updateUser(userId, { password: newPassword });

    // Log de auditoria
    await adminDb.collection('audit_logs').add({
      type: 'security',
      action: 'password_changed',
      userId,
      adminId: adminId || userId,
      details: 'Senha alterada',
      timestamp: Date.now(),
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

