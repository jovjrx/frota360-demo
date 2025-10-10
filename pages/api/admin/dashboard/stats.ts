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

    // Buscar TODOS os registros semanais ordenados por weekId (mais recente primeiro)
    const allWeeklyRecordsSnapshot = await db.collection('driverWeeklyRecords').orderBy('weekId', 'desc').get();

    // Descobrir qual é a última semana disponível nos dados
    let latestWeekId = '';
    if (allWeeklyRecordsSnapshot.size > 0) {
      latestWeekId = allWeeklyRecordsSnapshot.docs[0].data().weekId;
    }

    let totalGrossEarningsThisWeek = 0; // Ganhos brutos da última semana
    let totalPaymentsPending = 0; // A Pagar (pending)
    let totalPaymentsPaid = 0; // Pagos (driverPayments)
    let companyProfitThisWeek = 0; // Lucro da empresa (despesasAdm + aluguel)
    let profitCommissions = 0; // Comissões (despesasAdm)
    let profitRentals = 0; // Aluguéis
    let profitDiscounts = 0; // Descontos aplicados
    
    // Agrupar por motorista para calcular média
    const driverPaymentsMap = new Map<string, { total: number; count: number }>();

    allWeeklyRecordsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const repasse = data.repasse || 0;
      const ganhosTotal = data.ganhosTotal || 0;
      const despesasAdm = data.despesasAdm || data.despesaAdministrativa || 0;
      const aluguel = data.aluguel || 0;
      
      // Ganhos brutos da última semana disponível
      if (data.weekId === latestWeekId) {
        totalGrossEarningsThisWeek += ganhosTotal;
        // Lucro = despesasAdm (comissão) + aluguel (carros locatários)
        profitCommissions += despesasAdm;
        profitRentals += aluguel;
      }
      
      // A Pagar - Pagamentos pendentes
      if (data.paymentStatus === 'pending') {
        totalPaymentsPending += repasse;
      }
    });

    // Buscar driverPayments para obter os valores PAGOS e descontos (outras despesas)
    const allPaymentsSnapshot = await db.collection('driverPayments').get();
    
    allPaymentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const totalAmount = data.totalAmount || 0;
      const discountAmount = data.discountAmount || 0; // Descontos = outras despesas/lucro
      const driverId = data.driverId;
      
      // Pagos - Todos os pagamentos registrados
      totalPaymentsPaid += totalAmount;
      
      // Adicionar descontos ao lucro (outras despesas da empresa)
      profitDiscounts += discountAmount;
      
      // Agrupar por motorista para média
      if (driverId) {
        const current = driverPaymentsMap.get(driverId) || { total: 0, count: 0 };
        driverPaymentsMap.set(driverId, {
          total: current.total + totalAmount,
          count: current.count + 1
        });
      }
    });

    // Calcular lucro total
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
          totalEarningsThisWeek: companyProfitThisWeek, // Lucro total da empresa
          totalGrossEarningsThisWeek, // Ganhos brutos da última semana
          totalPaymentsPending,
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

