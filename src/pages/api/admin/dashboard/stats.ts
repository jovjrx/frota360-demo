import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';
import { getProcessedWeeklyRecords, getAvailableWeekIds } from '@/lib/api/weekly-data-processor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const db = getFirestore(firebaseAdmin);

    // Get total number of drivers
    const driversSnapshot = await db.collection('drivers').get();
    const totalDrivers = driversSnapshot.size;
    const activeDrivers = driversSnapshot.docs.filter(doc => doc.data().status === 'active').length;

    // Get total number of requests by status
    const requestsSnapshot = await db.collection('driver_requests').get();
    const totalRequests = requestsSnapshot.size;
    const pendingRequests = requestsSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
    const evaluationRequests = requestsSnapshot.docs.filter(doc => doc.data().status === 'evaluation').length;

    // Buscar semanas disponíveis
    const weekIds = await getAvailableWeekIds(2);
    const latestWeekId = weekIds[0] || '';
    const previousWeekId = weekIds[1] || '';

    console.log('📊 Dashboard Stats - Semanas encontradas:');
    console.log('   Última semana:', latestWeekId);
    console.log('   Semana anterior:', previousWeekId);

    // Buscar dados processados diretamente do Firestore
  let statsThisWeek = { ganhos: 0, repasse: 0, lucro: 0, despesasAdm: 0, aluguel: 0, financiamento: 0, comissoesPagas: 0 };
    let statsLastWeek = { ganhos: 0, repasse: 0, lucro: 0 };
    
    if (latestWeekId) {
      const thisWeekRecords = await getProcessedWeeklyRecords(latestWeekId);
      thisWeekRecords.forEach((rec) => {
        statsThisWeek.ganhos += rec.ganhosTotal || 0;
        statsThisWeek.repasse += rec.repasse || 0;
        statsThisWeek.despesasAdm += rec.despesasAdm || 0;
        statsThisWeek.aluguel += rec.aluguel || 0;
        statsThisWeek.financiamento += (rec as any).financingDetails?.installment || 0;
        statsThisWeek.comissoesPagas += (rec as any).commissionAmount || 0;
      });
      // Comissão é paga ao motorista (custo para a empresa). Não soma no lucro.
      statsThisWeek.lucro = statsThisWeek.despesasAdm + statsThisWeek.aluguel + statsThisWeek.financiamento;
    }
    
    if (previousWeekId) {
      const lastWeekRecords = await getProcessedWeeklyRecords(previousWeekId);
      lastWeekRecords.forEach((rec) => {
        statsLastWeek.ganhos += rec.ganhosTotal || 0;
        statsLastWeek.repasse += rec.repasse || 0;
      });
      // Lucro da empresa = ganhos - repasse (o que sobra para a empresa)
      statsLastWeek.lucro = statsLastWeek.ganhos - statsLastWeek.repasse;
    }

    // Buscar pagamentos totais
    const allPaymentsSnapshot = await db.collection('driverPayments').get();
    let totalPaymentsPaid = 0;
    
    allPaymentsSnapshot.docs.forEach(doc => {
      totalPaymentsPaid += doc.data().totalAmount || 0;
    });

    // Calcular média por motorista
    const averageEarningsPerDriver = activeDrivers > 0 ? statsThisWeek.repasse / activeDrivers : 0;

    // Get recent drivers (e.g., last 5 added)
    const recentDriversSnapshot = await db.collection('drivers').orderBy('createdAt', 'desc').limit(5).get();
    const recentDrivers = recentDriversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Get recent requests (e.g., last 5 added)
    const recentRequestsSnapshot = await db.collection('driver_requests').orderBy('createdAt', 'desc').limit(5).get();
    const recentRequests = recentRequestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalDrivers,
          activeDrivers,
          totalRequests,
          pendingRequests,
          evaluationRequests,
          totalEarningsThisWeek: statsThisWeek.lucro,
          totalEarningsLastWeek: statsLastWeek.lucro,
          totalGrossEarningsThisWeek: statsThisWeek.ganhos,
          totalGrossEarningsLastWeek: statsLastWeek.ganhos,
          totalRepasseThisWeek: statsThisWeek.repasse,
          totalRepasseLastWeek: statsLastWeek.repasse,
          totalPaymentsPaid,
          averageEarningsPerDriver,
          profitCommissions: statsThisWeek.despesasAdm,
          profitRentals: statsThisWeek.aluguel,
          profitDiscounts: statsThisWeek.financiamento,
          commissionsPaid: statsThisWeek.comissoesPagas,
        },
        recentDrivers,
        recentRequests,
      },
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}


