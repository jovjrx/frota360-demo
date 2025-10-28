import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId é obrigatório' });
  }

  try {
    if (req.method === 'GET') {
      // Buscar ganhos do motorista
      const driverDoc = adminDb.collection('drivers').doc(userId);
      const earningsSnap = await driverDoc.collection('earnings').orderBy('date', 'desc').get();
      
      const earnings = earningsSnap.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calcular totais
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const weeklyEarnings = earnings
        .filter(earning => earning.date >= startOfWeek.getTime())
        .reduce((sum, earning) => sum + (earning.amount || 0), 0);

      const monthlyEarnings = earnings
        .filter(earning => earning.date >= startOfMonth.getTime())
        .reduce((sum, earning) => sum + (earning.amount || 0), 0);

      // Atualizar totais no documento do motorista
      await driverDoc.update({
        weeklyEarnings,
        monthlyEarnings,
        totalEarnings: earnings.reduce((sum, earning) => sum + (earning.amount || 0), 0),
        lastUpdated: Date.now(),
      });

      return res.status(200).json({
        earnings,
        weeklyEarnings,
        monthlyEarnings,
        totalEarnings: earnings.reduce((sum, earning) => sum + (earning.amount || 0), 0),
      });

    } else if (req.method === 'POST') {
      // Adicionar novo ganho (admin)
      const { amount, description, tripId, adminId } = req.body;
      
      if (!amount || !description) {
        return res.status(400).json({ error: 'amount e description são obrigatórios' });
      }

      const earningRef = adminDb
        .collection('drivers')
        .doc(userId)
        .collection('earnings')
        .doc();

      await earningRef.set({
        id: earningRef.id,
        amount: parseFloat(amount),
        description,
        tripId: tripId || null,
        date: Date.now(),
        createdBy: adminId || 'admin',
        status: 'confirmed',
      });

      // Criar notificação
      await adminDb
        .collection('drivers')
        .doc(userId)
        .collection('notifications')
        .add({
          type: 'earnings_update',
          title: 'Novo Ganho',
          message: `Você recebeu €${amount} - ${description}`,
          read: false,
          createdAt: Date.now(),
          createdBy: adminId || 'admin',
        });

      return res.status(200).json({ 
        success: true, 
        earningId: earningRef.id 
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Erro com ganhos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

