/**
 * QUERIES ADMIN - SSR
 * Funções para buscar dados no lado do servidor (getServerSideProps)
 * 
 * USA FUNÇÃO ÚNICA E CENTRALIZADA: getProcessedWeeklyRecords(weekId, driverId?)
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { getProcessedWeeklyRecords } from '@/lib/api/weekly-data-processor';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// DEMO MODE FUNCTIONS
// ============================================================================

/**
 * Verifica se está em modo demo
 */
function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

/**
 * Carrega dados JSON para modo demo
 */
function loadDemoData(folder: string): any[] {
  try {
    const demoPath = path.join(process.cwd(), 'src/demo', folder);
    const files = fs.readdirSync(demoPath);
    
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(demoPath, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
      });
  } catch (error) {
    console.error(`Erro ao carregar dados demo de ${folder}:`, error);
    return [];
  }
}

/**
 * Carrega drivers do modo demo
 */
function getDemoDrivers(): Driver[] {
  const drivers = loadDemoData('drivers');
  return drivers.map(driver => ({
    id: driver.id,
    fullName: driver.fullName || driver.name || 'Nome não informado',
    email: driver.email || `${driver.id}@demo.com`,
    phone: driver.phone || '',
    status: driver.isActive ? 'active' : 'inactive',
    type: driver.type || 'affiliate',
    ...driver
  }));
}

/**
 * Carrega dados semanais do modo demo
 */
function getDemoWeeklyData(): any[] {
  return loadDemoData('dataWeekly');
}

/**
 * Carrega solicitações do modo demo
 */
function getDemoRequests(): Request[] {
  const requests = loadDemoData('driver_requests');
  return requests.map(request => ({
    id: request.id,
    fullName: request.fullName || request.name || 'Nome não informado',
    email: request.email || `${request.id}@demo.com`,
    phone: request.phone || '',
    status: request.status || 'pending',
    type: request.type || 'driver',
    createdAt: request.createdAt || new Date().toISOString(),
    ...request
  }));
}

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
  totalPaymentsPaid: number;
  
  // Semana anterior (para comparação)
  totalGrossEarningsLastWeek: number;
  totalRepasseLastWeek: number;
  totalEarningsLastWeek: number;
  
  // Metadados
  latestWeekId: string;
  previousWeekId: string;

  // Contagens e métricas complementares
  totalDrivers: number;
  activeDrivers: number;
  pendingRequests: number;
  averageEarningsPerDriver: number;
  profitCommissions: number;
  profitRentals: number;
  profitDiscounts: number;
}

// ============================================================================
// DASHBOARD STATS (usa função centralizada)
// ============================================================================

/**
 * Carrega dados do dashboard para modo demo
 */
function getDemoDashboardStats(): DashboardData {
  try {
    console.log('[getDemoDashboardStats] Carregando dados demo do dashboard...');
    
    const weeklyData = getDemoWeeklyData();
    const drivers = getDemoDrivers();
    const requests = getDemoRequests();
    
    // Agrupar dados por semana
    const weeklyGroups = weeklyData.reduce((acc, item) => {
      const weekId = item.weekId;
      if (!acc[weekId]) {
        acc[weekId] = [];
      }
      acc[weekId].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Pegar as semanas mais recentes
    const weekIds = Object.keys(weeklyGroups).sort().reverse();
    const latestWeekId = weekIds[0] || '2025-W43';
    const previousWeekId = weekIds[1] || '2025-W42';
    
    // Calcular totais da semana atual
    const currentWeekData = weeklyGroups[latestWeekId] || [];
    const totalGrossEarningsThisWeek = currentWeekData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    
    // Calcular totais da semana anterior
    const previousWeekData = weeklyGroups[previousWeekId] || [];
    const totalGrossEarningsLastWeek = previousWeekData.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    
    // Calcular métricas
    const activeDrivers = drivers.filter(d => d.status === 'active').length;
    const pendingRequests = requests.filter(r => r.status === 'pending').length;
    
    // Simular cálculos de repasse e lucros (valores demo)
    const totalRepasseThisWeek = totalGrossEarningsThisWeek * 0.85; // 85% repasse
    const totalEarningsThisWeek = totalGrossEarningsThisWeek * 0.15; // 15% lucro
    
    const totalRepasseLastWeek = totalGrossEarningsLastWeek * 0.85;
    const totalEarningsLastWeek = totalGrossEarningsLastWeek * 0.15;
    
    return {
      totalGrossEarningsThisWeek,
      totalRepasseThisWeek,
      totalEarningsThisWeek,
      totalPaymentsPending: Math.floor(totalRepasseThisWeek * 0.3), // 30% pendente
      totalPaymentsPaid: Math.floor(totalRepasseThisWeek * 0.7), // 70% pago
      
      totalGrossEarningsLastWeek,
      totalRepasseLastWeek,
      totalEarningsLastWeek,
      
      latestWeekId,
      previousWeekId,
      
      totalDrivers: drivers.length,
      activeDrivers,
      pendingRequests,
      averageEarningsPerDriver: activeDrivers > 0 ? totalGrossEarningsThisWeek / activeDrivers : 0,
      profitCommissions: totalEarningsThisWeek * 0.4,
      profitRentals: totalEarningsThisWeek * 0.3,
      profitDiscounts: totalEarningsThisWeek * 0.3,
    };
  } catch (error) {
    console.error('[getDemoDashboardStats] Erro:', error);
    return getEmptyDashboardData();
  }
}

/**
 * Busca dados do dashboard admin (SSR)
 * Usa função centralizada getDriverWeekData
 */
export async function getDashboardStats(cookies?: string): Promise<DashboardData> {
  try {
    console.log('[getDashboardStats] Iniciando busca de dados do dashboard...');
    
    // Verificar se está em modo demo
    if (isDemoMode()) {
      console.log('[getDashboardStats] Modo demo detectado, carregando dados JSON...');
      return getDemoDashboardStats();
    }
    
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
    .filter((id): id is string => typeof id === 'string' && id !== '')
    .sort()
    .reverse()
    .slice(0, 2);
    
    const latestWeekId = weekIds[0] || '';
    const previousWeekId = weekIds[1] || '';
    
    console.log(`[getDashboardStats] Semanas: ${latestWeekId} (atual) e ${previousWeekId} (anterior)`);

    // Buscar contagens auxiliares em paralelo
    const [driversSnapshot, pendingRequestsSnapshot, paymentsSnapshot] = await Promise.all([
      adminDb.collection('drivers').get(),
      adminDb.collection('driver_requests').where('status', '==', 'pending').get(),
      adminDb.collection('driverPayments').get(),
    ]);

    const totalDrivers = driversSnapshot.size;
    const activeDrivers = driversSnapshot.docs.filter(doc => (doc.data().status || '').toLowerCase() === 'active').length;
    const pendingRequests = pendingRequestsSnapshot.size;
    const totalPaymentsPaid = paymentsSnapshot.docs.reduce((acc, doc) => acc + (doc.data().totalAmount || 0), 0);
    
    // Inicializar totais
    let totalGrossEarningsThisWeek = 0;
    let totalRepasseThisWeek = 0;
    let totalPaymentsPending = 0;
    let profitCommissions = 0;
    let profitRentals = 0;
    let profitFinancing = 0;
    let driversWithRecords = 0;
    
    let totalGrossEarningsLastWeek = 0;
    let totalRepasseLastWeek = 0;
    let profitCommissionsLastWeek = 0;
    let profitRentalsLastWeek = 0;
    let profitFinancingLastWeek = 0;
    
    // ✅ Buscar dados da semana atual usando função ÚNICA (sem driverId → todos)
    if (latestWeekId) {
      console.log(`[getDashboardStats] Processando semana atual: ${latestWeekId}`);
      const records = await getProcessedWeeklyRecords(latestWeekId, undefined, false);
      
      console.log(`[getDashboardStats] ${records.length} registros na semana atual`);
  driversWithRecords = new Set(records.map(rec => rec.driverId)).size;
      
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
    
    // ✅ Buscar dados da semana anterior usando função ÚNICA (sem driverId → todos)
    if (previousWeekId) {
      console.log(`[getDashboardStats] Processando semana anterior: ${previousWeekId}`);
      const records = await getProcessedWeeklyRecords(previousWeekId, undefined, false);
      
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
    const averageEarningsPerDriver = driversWithRecords > 0 ? totalRepasseThisWeek / driversWithRecords : 0;
    
    console.log(`[getDashboardStats] Receita semana atual: €${totalEarningsThisWeek.toFixed(2)}`);
    console.log(`[getDashboardStats] Receita semana anterior: €${totalEarningsLastWeek.toFixed(2)}`);
    
    return {
      totalGrossEarningsThisWeek,
      totalRepasseThisWeek,
      totalEarningsThisWeek,
      totalPaymentsPending,
      totalPaymentsPaid,
      
      totalGrossEarningsLastWeek,
      totalRepasseLastWeek,
      totalEarningsLastWeek,
      
      latestWeekId,
      previousWeekId,
      totalDrivers,
      activeDrivers,
      pendingRequests,
      averageEarningsPerDriver,
      profitCommissions,
      profitRentals,
      profitDiscounts: profitFinancing,
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
    totalPaymentsPaid: 0,
    totalGrossEarningsLastWeek: 0,
    totalRepasseLastWeek: 0,
    totalEarningsLastWeek: 0,
    latestWeekId: '',
    previousWeekId: '',
    totalDrivers: 0,
    activeDrivers: 0,
    pendingRequests: 0,
    averageEarningsPerDriver: 0,
    profitCommissions: 0,
    profitRentals: 0,
    profitDiscounts: 0,
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
  // Verificar se está em modo demo
  if (isDemoMode()) {
    console.log('[getDrivers] Modo demo detectado, carregando drivers JSON...');
    let drivers = getDemoDrivers();
    
    // Aplicar filtros
    if (options?.status) {
      drivers = drivers.filter(d => d.status === options.status);
    }
    
    if (options?.limit) {
      drivers = drivers.slice(0, options.limit);
    }
    
    return drivers;
  }

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
  // Verificar se está em modo demo
  if (isDemoMode()) {
    console.log('[getRequests] Modo demo detectado, carregando requests JSON...');
    let requests = getDemoRequests();
    
    // Aplicar filtros
    if (options?.status && options.status !== 'all') {
      requests = requests.filter(r => r.status === options.status);
    }
    
    if (options?.limit) {
      requests = requests.slice(0, options.limit);
    }
    
    return requests;
  }

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

// ============================================================================
// WEEKLY DATA (para página /admin/weekly)
// ============================================================================

export interface WeeklyDataInitial {
  weeks: Array<{ weekId: string; label: string; status?: string }>;
  records: any[];
  weeklyData: any[];
  weeklyMaestro?: any;
  stats: {
    total: number;
    pending: number;
    paid: number;
    bonusCount: number;
    totalAmount: number;
    totalBonus: number;
  };
}

/**
 * Busca lista de semanas disponíveis (SSR)
 */
export async function getWeeklyWeeks(): Promise<Array<{ weekId: string; label: string; weekStart: string; weekEnd: string; status?: string }>> {
  try {
    const weeksSnapshot = await adminDb.collection('weekly').limit(50).get();
    const weeks = weeksSnapshot.docs
      .map((doc) => {
        const data = doc.data() as any;
        return { 
          weekId: data.weekId, 
          label: `Semana ${(data.weekId).split('-')[1] || data.weekId}`, 
          weekStart: data.weekStart || '',
          weekEnd: data.weekEnd || '',
          status: data.status 
        };
      })
      .sort((a, b) => b.weekId.localeCompare(a.weekId))
      .slice(0, 12);

    return weeks;
  } catch (error) {
    console.error('[getWeeklyWeeks] Erro:', error);
    return [];
  }
}

/**
 * Busca dados de uma semana específica (SSR)
 */
export async function getWeeklyData(weekId: string): Promise<WeeklyDataInitial | null> {
  try {
    // Get payments for week
    const snap = await adminDb.collection('driverPayments').where('weekId', '==', weekId).get();
    const records = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.driverName || '').localeCompare(b.driverName || ''));
    
    // Get raw data
    const dataWeeklySnap = await adminDb.collection('dataWeekly').where('weekId', '==', weekId).get();
    const weeklyData = dataWeeklySnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.driverName || '').localeCompare(b.driverName || ''));
    
    // Get maestro
    const weeklyMaestroDoc = await adminDb.collection('weekly').doc(weekId).get();
    const weeklyMaestro = weeklyMaestroDoc.exists ? weeklyMaestroDoc.data() : undefined;
    
    // Calculate stats
    const pending = records.filter((r: any) => (r as any).status === 'pending' || r.paymentStatus === 'pending').length;
    const paid = records.filter((r: any) => (r as any).status === 'paid' || r.paymentStatus === 'paid').length;
    const bonusCount = records.filter((r: any) => (r.totalBonusAmount || 0) > 0).length;
    const totalAmount = records.reduce((sum: number, r: any) => sum + (r.repasse || 0), 0);
    const totalBonus = records.reduce((sum: number, r: any) => sum + (r.totalBonusAmount || 0), 0);
    
    // Get weeks list
    const weeks = await getWeeklyWeeks();
    
    return {
      weeks,
      records,
      weeklyData,
      weeklyMaestro,
      stats: { total: records.length, pending, paid, bonusCount, totalAmount, totalBonus },
    };
  } catch (error) {
    console.error('[getWeeklyData] Erro:', error);
    return null;
  }
}

/**
 * Busca dados iniciais para página /admin/weekly (SSR)
 * Retorna lista de semanas + dados da primeira semana
 */
export async function getWeeklyInitialData(): Promise<WeeklyDataInitial | null> {
  try {
    const weeks = await getWeeklyWeeks();
    
    if (weeks.length === 0) {
      return {
        weeks: [],
        records: [],
        weeklyData: [],
        stats: { total: 0, pending: 0, paid: 0, bonusCount: 0, totalAmount: 0, totalBonus: 0 },
      };
    }
    
    // Load data from first week
    const weekData = await getWeeklyData(weeks[0].weekId);
    return weekData;
  } catch (error) {
    console.error('[getWeeklyInitialData] Erro:', error);
    return null;
  }
}

