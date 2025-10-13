import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Queries reutilizáveis para páginas admin
 */

export interface Driver {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  type: string;
  [key: string]: any;
}

export interface Request {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  type: string;
  createdAt: any;
  [key: string]: any;
}

export interface WeekOption {
  label: string;
  value: string;
  start: string;
  end: string;
}

/**
 * Buscar todos os motoristas
 */
export async function getDrivers(options?: {
  status?: string;
  limit?: number;
}): Promise<Driver[]> {
  const db = getFirestore();
  let query = db.collection('drivers').orderBy('createdAt', 'desc');

  if (options?.status) {
    query = query.where('status', '==', options.status) as any;
  }

  if (options?.limit) {
    query = query.limit(options.limit) as any;
  }

  const snapshot = await query.get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Driver[];
}

/**
 * Buscar motorista por ID
 */
export async function getDriverById(id: string): Promise<Driver | null> {
  const db = getFirestore();
  const doc = await db.collection('drivers').doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  } as Driver;
}

/**
 * Buscar solicitações
 */
export async function getRequests(options?: {
  status?: string;
  limit?: number;
}): Promise<Request[]> {
  const db = getFirestore();
  let query = db.collection('driver_requests').orderBy('createdAt', 'desc');

  if (options?.status && options.status !== 'all') {
    query = query.where('status', '==', options.status) as any;
  }

  if (options?.limit) {
    query = query.limit(options.limit) as any;
  }

  const snapshot = await query.get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Request[];
}

/**
 * Contar solicitações por status
 */
export async function getRequestsStats(): Promise<{
  total: number;
  pending: number;
  evaluation: number;
  approved: number;
  rejected: number;
}> {
  const db = getFirestore();
  const snapshot = await db.collection('driver_requests').get();

  const stats = {
    total: snapshot.size,
    pending: 0,
    evaluation: 0,
    approved: 0,
    rejected: 0,
  };

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    const status = data.status;
    if (status in stats) {
      (stats as any)[status]++;
    }
  });

  return stats;
}

/**
 * Buscar todos os usuários (Firebase Auth + Firestore)
 */
export async function getUsers(): Promise<any[]> {
  const auth = getAuth();
  const db = getFirestore();

  try {
    // Buscar usuários do Firebase Auth
    const listUsersResult = await auth.listUsers();
    
    // Buscar dados adicionais do Firestore
    const usersWithData = await Promise.all(
      listUsersResult.users.map(async (userRecord) => {
        let userData = null;
        
        // Tentar buscar dados do motorista
        const driverDoc = await db.collection('drivers').doc(userRecord.uid).get();
        if (driverDoc.exists) {
          userData = { ...driverDoc.data(), collection: 'drivers' };
        }

        return {
          id: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          disabled: userRecord.disabled,
          emailVerified: userRecord.emailVerified,
          createdAt: userRecord.metadata.creationTime,
          lastSignIn: userRecord.metadata.lastSignInTime,
          customClaims: userRecord.customClaims,
          role: userRecord.customClaims?.role || 'user',
          ...userData,
        };
      })
    );

    return usersWithData;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

/**
 * Buscar estatísticas de usuários
 */
export async function getUsersStats(): Promise<{
  total: number;
  admins: number;
  drivers: number;
}> {
  const users = await getUsers();
  
  return {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    drivers: users.filter(u => u.role === 'driver').length,
  };
}

/**
 * Gerar opções de semanas baseado nos dados reais do Firebase
 */
export async function getWeekOptions(count: number = 12): Promise<WeekOption[]> {
  const db = getFirestore();
  
  try {
    // Buscar semanas que têm dados no rawFileArchive
    const rawSnapshot = await db.collection('rawFileArchive')
      .orderBy('weekStart', 'desc')
      .limit(count * 4) // 4 plataformas por semana
      .get();
    
    // Agrupar por weekId
    const weeksMap = new Map<string, { weekStart: string; weekEnd: string }>();
    
    rawSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.weekId && data.weekStart && data.weekEnd) {
        if (!weeksMap.has(data.weekId)) {
          weeksMap.set(data.weekId, {
            weekStart: data.weekStart,
            weekEnd: data.weekEnd,
          });
        }
      }
    });
    
    // Converter para array e ordenar
    const weeks = Array.from(weeksMap.entries()).map(([weekId, dates]) => {
      // Usar formato ISO sem conversão de timezone
      const startParts = dates.weekStart.split('-'); // YYYY-MM-DD
      const endParts = dates.weekEnd.split('-');
      
      // Formato DD/MM/YYYY
      const startFormatted = `${startParts[2]}/${startParts[1]}/${startParts[0]}`;
      const endFormatted = `${endParts[2]}/${endParts[1]}/${endParts[0]}`;
      
      return {
        label: `${startFormatted} - ${endFormatted}`,
        value: weekId,
        start: dates.weekStart,
        end: dates.weekEnd,
      };
    });
    
    // Ordenar por data de início (mais recente primeiro)
    weeks.sort((a, b) => b.start.localeCompare(a.start));
    
    // Se não houver semanas, retornar a semana atual
    if (weeks.length === 0) {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (today.getDay() || 7) + 1);
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      return [{
        label: `${weekStart.toLocaleDateString('pt-PT')} - ${weekEnd.toLocaleDateString('pt-PT')}`,
        value: getWeekId(weekStart),
        start: weekStart.toISOString().split('T')[0],
        end: weekEnd.toISOString().split('T')[0],
      }];
    }
    
    return weeks.slice(0, count);
  } catch (error) {
    console.error('Error fetching week options:', error);
    // Fallback: retornar semana atual
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (today.getDay() || 7) + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return [{
      label: `${weekStart.toLocaleDateString('pt-PT')} - ${weekEnd.toLocaleDateString('pt-PT')}`,
      value: getWeekId(weekStart),
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    }];
  }
}

// Função auxiliar para gerar weekId
function getWeekId(date: Date): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Buscar estatísticas do dashboard
 */
export async function getDashboardStats(): Promise<{
  totalDrivers: number;
  activeDrivers: number;
  pendingRequests: number;
  totalEarningsThisWeek: number;
  totalGrossEarningsThisWeek: number; // Ganhos brutos da semana
  totalPaymentsPending: number;
  totalPaymentsPaid: number;
  averageEarningsPerDriver: number;
  profitCommissions: number;
  profitRentals: number;
  profitDiscounts: number;
  totalRepasseThisWeek: number; // Total de repasse da semana
  totalEarningsLastWeek?: number; // Receita da semana anterior para comparação
  totalGrossEarningsLastWeek?: number; // Ganhos brutos da semana anterior
  totalRepasseLastWeek?: number; // Repasse da semana anterior
}> {
  const db = getFirestore();

  // Contar motoristas
  const driversSnapshot = await db.collection('drivers').get();
  const totalDrivers = driversSnapshot.size;
  const activeDrivers = driversSnapshot.docs.filter(
    doc => doc.data().status === 'active'
  ).length;

  // Contar solicitações pendentes
  const requestsSnapshot = await db.collection('driver_requests')
    .where('status', '==', 'pending')
    .get();
  const pendingRequests = requestsSnapshot.size;

  // Buscar semanas disponíveis do dataWeekly
  const dataWeeklySnapshot = await db.collection('dataWeekly')
    .orderBy('weekId', 'desc')
    .limit(100)
    .get();

  const weekIds = Array.from(new Set(dataWeeklySnapshot.docs.map(doc => doc.data().weekId)))
    .sort()
    .reverse()
    .slice(0, 2);

  const latestWeekId = weekIds[0] || '';
  const previousWeekId = weekIds[1] || '';

  console.log(`📊 Semanas encontradas: ${latestWeekId}, ${previousWeekId}`);

  let totalGrossEarningsThisWeek = 0;
  let totalRepasseThisWeek = 0;
  let totalGrossEarningsLastWeek = 0;
  let totalRepasseLastWeek = 0;
  let totalPaymentsPending = 0;
  let totalPaymentsPaid = 0;
  let profitCommissions = 0;
  let profitRentals = 0;
  let profitDiscounts = 0;
  let profitFinancing = 0; // Parcelas de financiamento
  let profitFinancingLastWeek = 0;

  // Buscar dados da semana atual via endpoint (que já processa tudo corretamente)
  if (latestWeekId) {
    try {
      const { processWeeklyData } = await import('../api/process-weekly-data');
      const data = await processWeeklyData(latestWeekId);
      
      console.log(`📊 Semana atual (${latestWeekId}): ${data.records?.length || 0} registros`);
      
      data.records?.forEach((rec: any) => {
        totalGrossEarningsThisWeek += rec.ganhosTotal || 0;
        totalRepasseThisWeek += rec.repasse || 0;
        profitCommissions += rec.despesasAdm || 0;
        profitRentals += rec.aluguel || 0;
        profitFinancing += rec.financingDetails?.installment || 0;
        
        if (rec.paymentStatus === 'pending') {
          totalPaymentsPending += rec.repasse || 0;
        }
      });
      
      console.log(`   Ganhos: €${totalGrossEarningsThisWeek.toFixed(2)}`);
      console.log(`   Repasse: €${totalRepasseThisWeek.toFixed(2)}`);
      console.log(`   DespesasAdm: €${profitCommissions.toFixed(2)}`);
      console.log(`   Aluguel: €${profitRentals.toFixed(2)}`);
      console.log(`   Financiamento: €${profitFinancing.toFixed(2)}`);
    } catch (error) {
      console.error('Erro ao buscar dados da semana atual:', error);
    }
  }

  // Buscar dados da semana anterior
  if (previousWeekId) {
    try {
      const { processWeeklyData } = await import('../api/process-weekly-data');
      const data = await processWeeklyData(previousWeekId);
      
      console.log(`📊 Semana anterior (${previousWeekId}): ${data.records?.length || 0} registros`);
      
      let lastWeekDespesasAdm = 0;
      let lastWeekAluguel = 0;
      
      data.records?.forEach((rec: any) => {
        totalGrossEarningsLastWeek += rec.ganhosTotal || 0;
        totalRepasseLastWeek += rec.repasse || 0;
        lastWeekDespesasAdm += rec.despesasAdm || 0;
        lastWeekAluguel += rec.aluguel || 0;
        profitFinancingLastWeek += rec.financingDetails?.installment || 0;
      });
      
      console.log(`   Ganhos: €${totalGrossEarningsLastWeek.toFixed(2)}`);
      console.log(`   Repasse: €${totalRepasseLastWeek.toFixed(2)}`);
      console.log(`   DespesasAdm: €${lastWeekDespesasAdm.toFixed(2)}`);
      console.log(`   Aluguel: €${lastWeekAluguel.toFixed(2)}`);
      console.log(`   Financiamento: €${profitFinancingLastWeek.toFixed(2)}`);
      
      // Calcular receita da semana anterior
      totalGrossEarningsLastWeek = lastWeekDespesasAdm + lastWeekAluguel + profitFinancingLastWeek;
    } catch (error) {
      console.error('Erro ao buscar dados da semana anterior:', error);
    }
  }

  // Buscar pagamentos realizados
  const allPaymentsSnapshot = await db.collection('driverPayments').get();
  const driverPaymentsMap = new Map<string, { total: number; count: number }>();

  allPaymentsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    const totalAmount = data.totalAmount || 0;
    const discountAmount = data.discountAmount || 0;
    const driverId = data.driverId;
    
    totalPaymentsPaid += totalAmount;
    profitDiscounts += discountAmount;
    
    if (driverId) {
      const current = driverPaymentsMap.get(driverId) || { total: 0, count: 0 };
      driverPaymentsMap.set(driverId, {
        total: current.total + totalAmount,
        count: current.count + 1
      });
    }
  });

  // Calcular lucro da empresa = despesasAdm + aluguel + financiamento
  const companyProfitThisWeek = profitCommissions + profitRentals + profitFinancing;
  const companyProfitLastWeek = totalGrossEarningsLastWeek; // Já foi calculado acima

  console.log(`💰 Receita empresa:`);
  console.log(`   Esta semana: €${companyProfitThisWeek.toFixed(2)} (Adm: ${profitCommissions.toFixed(2)} + Aluguel: ${profitRentals.toFixed(2)} + Financ: ${profitFinancing.toFixed(2)})`);
  console.log(`   Semana anterior: €${companyProfitLastWeek.toFixed(2)}`);

  // Média por motorista
  let totalPaidAmount = 0;
  let driversWithPayments = 0;
  
  driverPaymentsMap.forEach(({ total }) => {
    totalPaidAmount += total;
    driversWithPayments++;
  });
  
  const averageEarningsPerDriver = driversWithPayments > 0 
    ? totalPaidAmount / driversWithPayments
    : 0;

  return {
    totalDrivers,
    activeDrivers,
    pendingRequests,
    totalEarningsThisWeek: companyProfitThisWeek,
    totalGrossEarningsThisWeek,
    totalRepasseThisWeek,
    totalPaymentsPending,
    totalPaymentsPaid,
    averageEarningsPerDriver,
    profitCommissions,
    profitRentals,
    profitDiscounts,
    totalEarningsLastWeek: companyProfitLastWeek,
    totalGrossEarningsLastWeek,
    totalRepasseLastWeek,
  };
}
