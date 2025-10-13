import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAdmin } from '@/lib/firebase/firebaseAdmin';

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

    // Buscar semanas disponíveis no rawFileArchive
    const rawSnapshot = await db.collection('rawFileArchive')
      .orderBy('weekStart', 'desc')
      .limit(50)
      .get();
    
    // Agrupar por weekId e pegar as 2 semanas mais recentes
    const weekIdsWithDates = new Map<string, string>();
    
    rawSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.weekId && data.weekStart) {
        weekIdsWithDates.set(data.weekId, data.weekStart);
      }
    });
    
    const sortedWeekIds = Array.from(weekIdsWithDates.entries())
      .sort((a, b) => b[1].localeCompare(a[1]))
      .map(entry => entry[0]);
    
    const latestWeekId = sortedWeekIds[0] || '';
    const previousWeekId = sortedWeekIds[1] || '';

    console.log('📊 Dashboard Stats - Semanas encontradas:');
    console.log('   Última semana:', latestWeekId);
    console.log('   Semana anterior:', previousWeekId);

    // Buscar dados processados usando a API weekly/data
    let statsThisWeek = { ganhos: 0, repasse: 0, lucro: 0, despesasAdm: 0, aluguel: 0, financiamento: 0 };
    let statsLastWeek = { ganhos: 0, repasse: 0, lucro: 0 };
    
    if (latestWeekId) {
      const thisWeekResponse = await fetch(`http://localhost:3000/api/admin/weekly/data?weekId=${latestWeekId}`);
      if (thisWeekResponse.ok) {
        const thisWeekData = await thisWeekResponse.json();
        if (thisWeekData.records) {
          thisWeekData.records.forEach((rec: any) => {
            statsThisWeek.ganhos += rec.ganhosTotal || 0;
            statsThisWeek.repasse += rec.repasse || 0;
            statsThisWeek.despesasAdm += rec.despesasAdm || 0;
            statsThisWeek.aluguel += rec.aluguel || 0;
            statsThisWeek.financiamento += rec.financingDetails?.installment || 0;
          });
          statsThisWeek.lucro = statsThisWeek.despesasAdm + statsThisWeek.aluguel + statsThisWeek.financiamento;
        }
      }
    }
    
    if (previousWeekId) {
      const lastWeekResponse = await fetch(`http://localhost:3000/api/admin/weekly/data?weekId=${previousWeekId}`);
      if (lastWeekResponse.ok) {
        const lastWeekData = await lastWeekResponse.json();
        if (lastWeekData.records) {
          let lastWeekDespesasAdm = 0;
          let lastWeekAluguel = 0;
          let lastWeekFinanciamento = 0;
          
          lastWeekData.records.forEach((rec: any) => {
            statsLastWeek.ganhos += rec.ganhosTotal || 0;
            statsLastWeek.repasse += rec.repasse || 0;
            lastWeekDespesasAdm += rec.despesasAdm || 0;
            lastWeekAluguel += rec.aluguel || 0;
            lastWeekFinanciamento += rec.financingDetails?.installment || 0;
          });
          statsLastWeek.lucro = lastWeekDespesasAdm + lastWeekAluguel + lastWeekFinanciamento;
        }
      }
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

