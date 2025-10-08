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
      const startDate = new Date(dates.weekStart);
      const endDate = new Date(dates.weekEnd);
      
      return {
        label: `${startDate.toLocaleDateString('pt-PT')} - ${endDate.toLocaleDateString('pt-PT')}`,
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
  totalPaymentsPending: number;
  totalPaymentsPaid: number;
  averageEarningsPerDriver: number;
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

  // Calcular ganhos da semana atual
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - (today.getDay() || 7) + 1);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const currentWeekId = getWeekId(weekStart);

  // Buscar registros semanais da semana atual
  const weeklyRecordsSnapshot = await db.collection('driverWeeklyRecords')
    .where('weekId', '==', currentWeekId)
    .get();

  let totalEarningsThisWeek = 0;
  let totalPaymentsPending = 0;
  let totalPaymentsPaid = 0;

  weeklyRecordsSnapshot.docs.forEach(doc => {
    const data = doc.data();
    totalEarningsThisWeek += data.repasse || 0;
    
    if (data.paymentStatus === 'pending') {
      totalPaymentsPending += data.repasse || 0;
    } else if (data.paymentStatus === 'paid') {
      totalPaymentsPaid += data.repasse || 0;
    }
  });

  const averageEarningsPerDriver = weeklyRecordsSnapshot.size > 0 
    ? totalEarningsThisWeek / weeklyRecordsSnapshot.size 
    : 0;

  return {
    totalDrivers,
    activeDrivers,
    pendingRequests,
    totalEarningsThisWeek,
    totalPaymentsPending,
    totalPaymentsPaid,
    averageEarningsPerDriver,
  };
}
