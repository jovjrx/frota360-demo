import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Buscar todos os motoristas com detalhes
      const driversSnap = await adminDb.collection('drivers').get();
      
      const motorists = await Promise.all(
        driversSnap.docs.map(async (doc: any) => {
          const data = doc.data();
          
          // Buscar documentos
          const docsSnap = await doc.ref.collection('documents').get();
          const documents = docsSnap.docs.map((d: any) => ({
            id: d.id,
            ...d.data()
          }));

          // Buscar ganhos recentes
          const earningsSnap = await doc.ref.collection('earnings')
            .orderBy('date', 'desc')
            .limit(5)
            .get();
          const recentEarnings = earningsSnap.docs.map((e: any) => ({
            id: e.id,
            ...e.data()
          }));

          // Buscar notificações não lidas
          const notificationsSnap = await doc.ref.collection('notifications')
            .where('read', '==', false)
            .get();
          const unreadNotifications = notificationsSnap.docs.length;

          return {
            id: doc.id,
            name: data?.name || 'Nome não informado',
            email: data?.email || '—',
            phone: data?.phone || '—',
            active: data?.active !== false,
            weeklyEarnings: data?.weeklyEarnings || 0,
            monthlyEarnings: data?.monthlyEarnings || 0,
            totalEarnings: data?.totalEarnings || 0,
            documentsCount: documents.length,
            documents,
            recentEarnings,
            unreadNotifications,
            statusUpdatedAt: data?.statusUpdatedAt,
            statusUpdatedBy: data?.statusUpdatedBy,
            createdAt: data?.createdAt,
            lastLogin: data?.lastLogin,
          };
        })
      );

      return res.status(200).json(motorists);

    } else if (req.method === 'POST') {
      // Criar novo motorista
      const { email, password, name, phone, adminId } = req.body;
      
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'email, password e name são obrigatórios' });
      }

      // Criar usuário no Firebase Auth
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });

      // Criar documento no Firestore
      await adminDb.collection('drivers').doc(userRecord.uid).set({
        name,
        email,
        phone: phone || '',
        active: true,
        weeklyEarnings: 0,
        monthlyEarnings: 0,
        totalEarnings: 0,
        createdAt: Date.now(),
        createdBy: adminId || 'admin',
        lastLogin: null,
      });

      // Criar notificação de boas-vindas
      await adminDb
        .collection('drivers')
        .doc(userRecord.uid)
        .collection('notifications')
        .add({
          type: 'welcome',
          title: 'Bem-vindo à Conduz.pt!',
          message: 'Sua conta foi criada com sucesso. Faça login para começar.',
          read: false,
          createdAt: Date.now(),
          createdBy: 'system',
        });

      return res.status(200).json({ 
        success: true, 
        userId: userRecord.uid,
        message: 'Motorista criado com sucesso' 
      });

    } else if (req.method === 'PUT') {
      // Atualizar dados do motorista
      const { driverId, name, phone, email, adminId } = req.body;
      
      if (!driverId) {
        return res.status(400).json({ error: 'driverId é obrigatório' });
      }

      const updates: any = {
        updatedAt: Date.now(),
        updatedBy: adminId || 'admin',
      };

      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (email) updates.email = email;

      await adminDb.collection('drivers').doc(driverId).update(updates);

      // Criar notificação
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'profile_updated',
          title: 'Perfil Atualizado',
          message: 'Seus dados pessoais foram atualizados pelo administrador.',
          read: false,
          createdAt: Date.now(),
          createdBy: adminId || 'admin',
        });

      return res.status(200).json({ success: true });

    } else if (req.method === 'DELETE') {
      // Desativar motorista (soft delete)
      const { driverId, adminId } = req.body;
      
      if (!driverId) {
        return res.status(400).json({ error: 'driverId é obrigatório' });
      }

      await adminDb.collection('drivers').doc(driverId).update({
        active: false,
        deactivatedAt: Date.now(),
        deactivatedBy: adminId || 'admin',
      });

      // Criar notificação
      await adminDb
        .collection('drivers')
        .doc(driverId)
        .collection('notifications')
        .add({
          type: 'account_deactivated',
          title: 'Conta Desativada',
          message: 'Sua conta foi desativada pelo administrador. Entre em contato para mais informações.',
          read: false,
          createdAt: Date.now(),
          createdBy: adminId || 'admin',
        });

      return res.status(200).json({ success: true });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Erro com motoristas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
