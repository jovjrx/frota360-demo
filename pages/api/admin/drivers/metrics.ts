import { NextApiResponse } from 'next';
import { SessionRequest } from '@/lib/session/ironSession';
import { getFirestore } from 'firebase-admin/firestore';
import { withIronSessionApiRoute } from '@/lib/session/ironSession';
import { sessionOptions } from '@/lib/session/ironSession';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { ApiResponse } from '@/types';

export default withIronSessionApiRoute(async function handler(
  req: SessionRequest,
  res: NextApiResponse<ApiResponse>
) {
  const user = req.session.user;

  if (!user || user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const db = getFirestore(firebaseAdmin);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate e endDate são obrigatórios',
      });
    }

    // Buscar todos os motoristas ativos
    const driversSnapshot = await db
      .collection('drivers')
      .where('status', '==', 'active') // Alterado de 'approved' para 'active'
      .get();

    const driversMetrics = [];

    for (const driverDoc of driversSnapshot.docs) {
      const driverData = driverDoc.data();

      // Mock data - Em produção, buscar das integrações reais ou de 'driverWeeklyRecords'
      // Para um sistema mais robusto, esta API deveria agregar dados das collections raw_*
      // ou de uma collection de métricas pré-calculadas (ex: driverWeeklyRecords).
      // Por enquanto, mantemos o mock para a estrutura funcionar.
      const metrics = {
        id: driverDoc.id,
        name: `${driverData.firstName || ''} ${driverData.lastName || ''}`.trim(),
        email: driverData.email,
        type: driverData.type || 'affiliate', // Alterado de driverType para type
        status: driverData.status || 'active',
        vehicle: driverData.vehicle?.plate || null,
        metrics: {
          totalTrips: Math.floor(Math.random() * 200) + 50,
          totalEarnings: Math.floor(Math.random() * 5000) + 1000,
          totalExpenses: Math.floor(Math.random() * 2000) + 500,
          netProfit: 0, // Calculado abaixo
          avgFare: 0, // Calculado abaixo
          totalDistance: Math.floor(Math.random() * 3000) + 500,
          hoursWorked: Math.floor(Math.random() * 200) + 50,
          rating: 4.0 + Math.random() * 1.0, // 4.0 a 5.0
        },
      };

      // Calcular valores derivados
      metrics.metrics.netProfit = metrics.metrics.totalEarnings - metrics.metrics.totalExpenses;
      metrics.metrics.avgFare = metrics.metrics.totalTrips > 0 
        ? metrics.metrics.totalEarnings / metrics.metrics.totalTrips 
        : 0;

      driversMetrics.push(metrics);
    }

    // Ordenar por lucro (maior para menor)
    driversMetrics.sort((a, b) => b.metrics.netProfit - a.metrics.netProfit);

    return res.status(200).json({
      success: true,
      data: driversMetrics,
      message: `${driversMetrics.length} motoristas encontrados`,
    });
  } catch (error: any) {
    console.error('Error fetching driver metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar métricas',
      message: error.message,
    });
  }
}, sessionOptions);

