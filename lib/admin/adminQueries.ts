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
 * Gerar opções de semanas
 */
export function getWeekOptions(count: number = 12): WeekOption[] {
  const options: WeekOption[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (today.getDay() || 7) + 1 - (i * 7));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    options.push({
      label: `${weekStart.toLocaleDateString('pt-PT')} - ${weekEnd.toLocaleDateString('pt-PT')}`,
      value: `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`,
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    });
  }

  return options;
}

/**
 * Buscar estatísticas do dashboard
 */
export async function getDashboardStats(): Promise<{
  totalDrivers: number;
  activeDrivers: number;
  pendingRequests: number;
  totalEarningsThisWeek: number;
}> {
  const db = getFirestore();

  // Contar motoristas
  const driversSnapshot = await db.collection('drivers').get();
  const totalDrivers = driversSnapshot.size;
  const activeDrivers = driversSnapshot.docs.filter(
    doc => doc.data().status === 'active'
  ).length;

  // Contar solicitações pendentes
  const requestsSnapshot = await db.collection('requests')
    .where('status', '==', 'pending')
    .get();
  const pendingRequests = requestsSnapshot.size;

  // TODO: Calcular ganhos da semana (quando implementar weekly_records)
  const totalEarningsThisWeek = 0;

  return {
    totalDrivers,
    activeDrivers,
    pendingRequests,
    totalEarningsThisWeek,
  };
}
