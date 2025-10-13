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

    // Buscar TODOS os registros semanais ordenados por weekStart (mais recente primeiro)
    const allWeeklyRecordsSnapshot = await db.collection('driverWeeklyRecords').orderBy('weekStart', 'desc').get();

    // Descobrir qual é a última semana disponível nos dados e a penúltima
    let latestWeekId = '';
    let previousWeekId = '';
    const weekIdsWithDates = new Map<string, string>(); // weekId -> weekStart
    
    allWeeklyRecordsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.weekId && data.weekStart) {
        weekIdsWithDates.set(data.weekId, data.weekStart);
      }
    });
    
    // Ordenar por weekStart (data) em ordem decrescente
    const sortedWeekIds = Array.from(weekIdsWithDates.entries())
      .sort((a, b) => b[1].localeCompare(a[1])) // Ordenar por data DESC
      .map(entry => entry[0]); // Pegar só o weekId
    
    if (sortedWeekIds.length > 0) {
      latestWeekId = sortedWeekIds[0];
      if (sortedWeekIds.length > 1) {
        previousWeekId = sortedWeekIds[1];
      }
    }

    console.log('📊 Dashboard Stats - Semanas encontradas:');
    console.log('   Última semana:', latestWeekId);
    console.log('   Semana anterior:', previousWeekId);

    let totalGrossEarningsThisWeek = 0; // Ganhos brutos da última semana
    let totalGrossEarningsLastWeek = 0; // Ganhos brutos da penúltima semana
    let totalRepasseThisWeek = 0; // Repasse total (valor a ser pago aos motoristas) da última semana
    let totalRepasseLastWeek = 0; // Repasse total da penúltima semana
    let totalPaymentsPaid = 0; // Pagos (total de driverPayments)
    let companyProfitThisWeek = 0; // Lucro da empresa (despesasAdm + aluguel + financiamento) da última semana
    let companyProfitLastWeek = 0; // Lucro da empresa da penúltima semana
    let profitCommissions = 0; // Comissões (despesasAdm) da última semana
    let profitRentals = 0; // Aluguéis da última semana
    let profitDiscounts = 0; // Financiamento (parcelas semanais)
    
    // Buscar todos os pagamentos para somar total pago
    const allPaymentsSnapshot = await db.collection('driverPayments').get();
    
    allPaymentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      // Somar total pago
      totalPaymentsPaid += data.totalAmount || 0;
    });
    
    // Agrupar por motorista para calcular média
    const driverPaymentsMap = new Map<string, { total: number; count: number }>();

    allWeeklyRecordsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const repasse = data.repasse || 0;
      const ganhosTotal = data.ganhosTotal || 0;
      const despesasAdm = data.despesasAdm || data.despesaAdministrativa || 0;
      const aluguel = data.aluguel || 0;
      const financingInstallment = data.financingDetails?.installment || 0;
      
      // Ganhos brutos e lucro da última semana disponível
      if (data.weekId === latestWeekId) {
        totalGrossEarningsThisWeek += ganhosTotal;
        totalRepasseThisWeek += repasse; // Somar repasse total
        
        // Lucro = despesasAdm (comissão) + aluguel (carros locatários) + financiamento (parcelas)
        profitCommissions += despesasAdm;
        profitRentals += aluguel;
        profitDiscounts += financingInstallment; // Financiamento (parcelas semanais)
      }
      
      // Dados da penúltima semana para comparação
      if (previousWeekId && data.weekId === previousWeekId) {
        totalGrossEarningsLastWeek += ganhosTotal;
        totalRepasseLastWeek += repasse; // Somar repasse da semana anterior
        
        const lastWeekProfit = despesasAdm + aluguel + financingInstallment;
        companyProfitLastWeek += lastWeekProfit;
      }
      
      // Adicionar aos pagamentos por motorista para cálculo de média (baseado no repasse)
      if (data.driverId) {
        const current = driverPaymentsMap.get(data.driverId) || { total: 0, count: 0 };
        driverPaymentsMap.set(data.driverId, {
          total: current.total + repasse,
          count: current.count + 1
        });
      }
    });

    // Calcular lucro total (incluindo parcelas de financiamento)
    companyProfitThisWeek = profitCommissions + profitRentals + profitDiscounts;

    // Calcular média por motorista
    let totalPaidAmount = 0;
    let driversWithPayments = 0;
    
    driverPaymentsMap.forEach(({ total }) => {
      totalPaidAmount += total;
      driversWithPayments++;
    });
    
    const averageEarningsPerDriver = driversWithPayments > 0 
      ? totalPaidAmount / driversWithPayments
      : 0;

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
          totalEarningsThisWeek: companyProfitThisWeek, // Lucro total da empresa (última semana)
          totalEarningsLastWeek: companyProfitLastWeek, // Lucro total da empresa (penúltima semana)
          totalGrossEarningsThisWeek, // Ganhos brutos da última semana
          totalGrossEarningsLastWeek, // Ganhos brutos da penúltima semana
          totalRepasseThisWeek, // Repasse total da última semana
          totalRepasseLastWeek, // Repasse total da penúltima semana
          totalPaymentsPaid,
          averageEarningsPerDriver,
          // Breakdown do lucro
          profitCommissions,
          profitRentals,
          profitDiscounts,
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

