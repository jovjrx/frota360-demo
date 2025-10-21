import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '@/lib/firebaseAdmin';
import { getSession } from '@/lib/session/ironSession';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req, res);
    if (!session?.email) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { currentPassword, newPassword } = req.body || {};

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'Nova senha é obrigatória' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
    }

    // Buscar UID pelo email da sessão para atualizar a senha
    let uid: string | null = null;
    try {
      const userRecord = await adminAuth.getUserByEmail(session.email);
      uid = userRecord.uid;
    } catch (e) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    try {
      await adminAuth.updateUser(uid!, { password: newPassword });
    } catch (e: any) {
      return res.status(500).json({ error: 'Erro ao atualizar senha' });
    }

    return res.status(200).json({ success: true, message: 'Senha alterada com sucesso.' });
  } catch (error: any) {
    console.error('Erro em change-password (/api/painel/change-password):', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
}
