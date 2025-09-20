import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, name, phone, email, adminId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    const updates: any = {
      updatedAt: Date.now(),
      updatedBy: adminId || userId,
    };

    // Atualizar dados básicos
    if (name) updates.name = name;
    if (phone) updates.phone = phone;

    // Atualizar email se fornecido
    if (email) {
      // Verificar se email já existe
      const existingUser = await adminAuth.getUserByEmail(email);
      if (existingUser && existingUser.uid !== userId) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }

      // Atualizar no Firebase Auth
      await adminAuth.updateUser(userId, { email });
      updates.email = email;
    }

    // Atualizar no Firestore
    await adminDb.collection('drivers').doc(userId).update(updates);

    // Criar notificação se atualizado por admin
    if (adminId && adminId !== userId) {
      await adminDb
        .collection('drivers')
        .doc(userId)
        .collection('notifications')
        .add({
          type: 'profile_updated',
          title: 'Perfil Atualizado',
          message: 'Seus dados pessoais foram atualizados pelo administrador.',
          read: false,
          createdAt: Date.now(),
          createdBy: adminId,
        });
    }

    // Log de auditoria
    await adminDb.collection('audit_logs').add({
      type: 'profile',
      action: 'updated',
      userId,
      adminId: adminId || userId,
      details: 'Perfil atualizado',
      metadata: updates,
      timestamp: Date.now(),
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
