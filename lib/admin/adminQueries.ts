/**
 * QUERIES ADMIN - SSR
 * Funções para buscar dados no lado do servidor (getServerSideProps)
 * 
 * USA FUNÇÃO CENTRALIZADA: getDriverWeekData
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { getAllDriversWeekData } from '@/lib/api/driver-week-data';
import { getAuth } from 'firebase-admin/auth';

// ============================================================================
// INTERFACES
// ============================================================================

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

export interface DashboardData {
  // Semana atual
  totalGrossEarningsThisWeek: number;
  totalRepasseThisWeek: number;
  totalEarningsThisWeek: number; // Receita (despesasAdm + aluguel + financiamento)
  totalPaymentsPending: number;
  
  // Semana anterior (para comparação)
  totalGrossEarningsLastWeek: number;
  totalRepasseLastWeek: number;
  totalEarningsLastWeek: number;
  
  // Metadados
  latestWeekId: string;
  previousWeekId: string;
}

// ============================================================================
// DASHBOARD STATS (usa função centralizada)
// ============================================================================

/**
 * Busca dados do dashboard admin (SSR)
 * Usa função centralizada getDriverWeekData
 */
export async function getDashboardStats(cookies?: string): Promise<DashboardData> {
  try {
    console.log('[getDashboardStats] Iniciando busca de dados do dashboard...');
    
    // Buscar últimas 2 semanas do dataWeekly
    const dataWeeklySnapshot = await adminDb
      .collection('dataWeekly')
      .orderBy('weekId', 'desc')
      .limit(100) // Pegar mais docs para garantir 2 semanas diferentes
      .get();
    
    if (dataWeeklySnapshot.empty) {
      console.log('[getDashboardStats] Nenhum dado encontrado');
      return getEmptyDashboardData();
    }
    
    // Extrair weekIds únicos e pegar os 2 mais recentes
    const weekIds = Array.from(new Set(
      dataWeeklySnapshot.docs.map(doc => doc.data().weekId)
    ))
    .filter(id => id)
    .sort()
    .reverse()
    .slice(0, 2);
    
    const latestWeekId = weekIds[0] || '';
    const previousWeekId = weekIds[1] || '';
    
    console.log(`[getDashboardStats] Semanas: ${latestWeekId} (atual) e ${previousWeekId} (anterior)`);
    
    // Inicializar totais
    let totalGrossEarningsThisWeek = 0;
    let totalRepasseThisWeek = 0;
    let totalPaymentsPending = 0;
    let profitCommissions = 0;
    let profitRentals = 0;
    let profitFinancing = 0;
    
    let totalGrossEarningsLastWeek = 0;
    let totalRepasseLastWeek = 0;
    let profitCommissionsLastWeek = 0;
    let profitRentalsLastWeek = 0;
    let profitFinancingLastWeek = 0;
    
    // Buscar dados da semana atual usando função centralizada
    if (latestWeekId) {
      console.log(`[getDashboardStats] Processando semana atual: ${latestWeekId}`);
      const records = await getAllDriversWeekData(latestWeekId, false);
      
      console.log(`[getDashboardStats] ${records.length} registros na semana atual`);
      
      records.forEach(rec => {
        totalGrossEarningsThisWeek += rec.ganhosTotal || 0;
        totalRepasseThisWeek += rec.repasse || 0;
        profitCommissions += rec.despesasAdm || 0;
        profitRentals += rec.aluguel || 0;
        profitFinancing += rec.financingDetails?.totalCost || rec.financingDetails?.installment || 0;
        
        if (rec.paymentStatus === 'pending') {
          totalPaymentsPending += rec.repasse || 0;
        }
      });
      
      console.log(`   Ganhos: €${totalGrossEarningsThisWeek.toFixed(2)}`);
      console.log(`   Repasse: €${totalRepasseThisWeek.toFixed(2)}`);
      console.log(`   DespesasAdm: €${profitCommissions.toFixed(2)}`);
      console.log(`   Aluguel: €${profitRentals.toFixed(2)}`);
      console.log(`   Financiamento: €${profitFinancing.toFixed(2)}`);
    }
    
    // Buscar dados da semana anterior
    if (previousWeekId) {
      console.log(`[getDashboardStats] Processando semana anterior: ${previousWeekId}`);
      const records = await getAllDriversWeekData(previousWeekId, false);
      
      console.log(`[getDashboardStats] ${records.length} registros na semana anterior`);
      
      records.forEach(rec => {
        totalGrossEarningsLastWeek += rec.ganhosTotal || 0;
        totalRepasseLastWeek += rec.repasse || 0;
        profitCommissionsLastWeek += rec.despesasAdm || 0;
        profitRentalsLastWeek += rec.aluguel || 0;
        profitFinancingLastWeek += rec.financingDetails?.totalCost || rec.financingDetails?.installment || 0;
      });
      
      console.log(`   Ganhos: €${totalGrossEarningsLastWeek.toFixed(2)}`);
      console.log(`   Repasse: €${totalRepasseLastWeek.toFixed(2)}`);
    }
    
    // Calcular receita da empresa (despesasAdm + aluguel + financiamento)
    const totalEarningsThisWeek = profitCommissions + profitRentals + profitFinancing;
    const totalEarningsLastWeek = profitCommissionsLastWeek + profitRentalsLastWeek + profitFinancingLastWeek;
    
    console.log(`[getDashboardStats] Receita semana atual: €${totalEarningsThisWeek.toFixed(2)}`);
    console.log(`[getDashboardStats] Receita semana anterior: €${totalEarningsLastWeek.toFixed(2)}`);
    
    return {
      totalGrossEarningsThisWeek,
      totalRepasseThisWeek,
      totalEarningsThisWeek,
      totalPaymentsPending,
      
      totalGrossEarningsLastWeek,
      totalRepasseLastWeek,
      totalEarningsLastWeek,
      
      latestWeekId,
      previousWeekId,
    };
    
  } catch (error) {
    console.error('[getDashboardStats] Erro:', error);
    return getEmptyDashboardData();
  }
}

function getEmptyDashboardData(): DashboardData {
  return {
    totalGrossEarningsThisWeek: 0,
    totalRepasseThisWeek: 0,
    totalEarningsThisWeek: 0,
    totalPaymentsPending: 0,
    totalGrossEarningsLastWeek: 0,
    totalRepasseLastWeek: 0,
    totalEarningsLastWeek: 0,
    latestWeekId: '',
    previousWeekId: '',
  };
}

// ============================================================================
// DRIVERS
// ============================================================================

/**
 * Buscar todos os motoristas
 */
export async function getDrivers(options?: {
  status?: string;
  limit?: number;
}): Promise<Driver[]> {
  let query = adminDb.collection('drivers').orderBy('createdAt', 'desc');

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
  const doc = await adminDb.collection('drivers').doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
  } as Driver;
}

// ============================================================================
// REQUESTS
// ============================================================================

/**
 * Buscar solicitações
 */
export async function getRequests(options?: {
  status?: string;
  limit?: number;
}): Promise<Request[]> {
  let query = adminDb.collection('driver_requests').orderBy('createdAt', 'desc');

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
  const snapshot = await adminDb.collection('driver_requests').get();

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

// ============================================================================
// USERS
// ============================================================================

/**
 * Buscar todos os usuários (Firebase Auth + Firestore)
 */
export async function getUsers(): Promise<any[]> {
  const auth = getAuth();

  try {
    // Buscar usuários do Firebase Auth
    const listUsersResult = await auth.listUsers();
    
    // Buscar dados adicionais do Firestore
    const usersWithData = await Promise.all(
      listUsersResult.users.map(async (userRecord) => {
        let userData = null;
        
        // Tentar buscar dados do motorista
        const driverDoc = await adminDb.collection('drivers').doc(userRecord.uid).get();
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

// ============================================================================
// WEEK OPTIONS
// ============================================================================

/**
 * Gerar opções de semanas baseado nos dados reais do dataWeekly
 */
export async function getWeekOptions(count: number = 12): Promise<WeekOption[]> {
  try {
    // Buscar semanas que têm dados no dataWeekly
    const snapshot = await adminDb.collection('dataWeekly')
      .orderBy('weekStart', 'desc')
      .limit(count * 10) // Várias entradas por semana
      .get();
    
    // Agrupar por weekId
    const weeksMap = new Map<string, { weekStart: string; weekEnd: string }>();
    
    snapshot.docs.forEach(doc => {
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
    
    // Converter para array e formatar
    const weeks = Array.from(weeksMap.entries()).map(([weekId, dates]) => {
      const startParts = dates.weekStart.split('-'); // YYYY-MM-DD
      const endParts = dates.weekEnd.split('-');
      
      const startFormatted = `${startParts[2]}/${startParts[1]}/${startParts[0]}`;
      const endFormatted = `${endParts[2]}/${endParts[1]}/${endParts[0]}`;
      
      return {
        label: `${startFormatted} - ${endFormatted}`,
        value: weekId,
        start: dates.weekStart,
        end: dates.weekEnd,
      };
    });
    
    // Ordenar por data (mais recente primeiro)
    weeks.sort((a, b) => b.start.localeCompare(a.start));
    
    return weeks.slice(0, count);
    
  } catch (error) {
    console.error('[getWeekOptions] Erro:', error);
    return [];
  }
}
