/**
 * Serviço Universal de Dados Admin
 * 
 * Centraliza e unifica todos os dados do sistema numa estrutura consistente
 * para uso em dashboards, relatórios e análises.
 */

import { adminDb } from '@/lib/firebaseAdmin';

// ==================== INTERFACES ====================

export interface UnifiedDriver {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  type: 'affiliate' | 'renter';
  status: 'active' | 'inactive' | 'suspended';
  vehicle?: string | null;
  vehicleName?: string | null;
  joinDate?: string | null;
  metrics?: DriverMetrics;
}

export interface DriverMetrics {
  totalTrips: number;
  totalEarnings: number;
  totalExpenses: number;
  netProfit: number;
  avgFare: number;
  totalDistance: number;
  hoursWorked: number;
  rating: number;
}

export interface UnifiedVehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  status: 'active' | 'inactive' | 'maintenance';
  type?: string | null;
  currentDriver?: string | null;
  currentDriverName?: string | null;
}

export interface UnifiedFleetRecord {
  id: string;
  date: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  totalTrips: number;
  totalEarnings: number;
  totalExpenses: number;
  netProfit: number;
  totalDistance?: number | null;
  hoursWorked?: number | null;
}

export interface UnifiedIntegration {
  id: string;
  name: string;
  platform: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string | null;
  lastError?: string | null;
  config?: Record<string, any>;
}

export interface UnifiedRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string | null;
}

export interface UnifiedWeeklyRecord {
  driverId: string;
  driverName: string;
  weekStart: string;
  weekEnd: string;
  metrics: DriverMetrics;
}

// ==================== SUMMARY STATS ====================

export interface SummaryStats {
  financial: {
    totalEarnings: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    avgTripValue: number;
  };
  operations: {
    totalTrips: number;
    totalDistance: number;
    totalHours: number;
    avgTripsPerDay: number;
  };
  fleet: {
    totalVehicles: number;
    activeVehicles: number;
    inactiveVehicles: number;
    maintenanceVehicles: number;
    utilizationRate: number;
  };
  drivers: {
    totalDrivers: number;
    activeDrivers: number;
    affiliates: number;
    renters: number;
    avgRating: number;
  };
  integrations: {
    total: number;
    connected: number;
    disconnected: number;
    errors: number;
  };
  requests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

// ==================== UNIFIED DATA STRUCTURE ====================

export interface UnifiedAdminData {
  summary: SummaryStats;
  drivers: UnifiedDriver[];
  vehicles: UnifiedVehicle[];
  fleetRecords: UnifiedFleetRecord[];
  integrations: UnifiedIntegration[];
  requests: UnifiedRequest[];
  weeklyRecords: UnifiedWeeklyRecord[];
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  errors: string[];
  fetchedAt: string;
}

// ==================== OPTIONS ====================

export interface FetchOptions {
  startDate?: Date;
  endDate?: Date;
  includeDrivers?: boolean;
  includeVehicles?: boolean;
  includeFleetRecords?: boolean;
  includeIntegrations?: boolean;
  includeRequests?: boolean;
  includeWeeklyRecords?: boolean;
  driverStatus?: 'active' | 'inactive' | 'all';
  vehicleStatus?: 'active' | 'inactive' | 'maintenance' | 'all';
}

// ==================== MAIN FETCH FUNCTION ====================

/**
 * Busca e unifica todos os dados do admin em uma estrutura consistente
 */
export async function fetchUnifiedAdminData(
  options: FetchOptions = {}
): Promise<UnifiedAdminData> {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 dias atrás
    endDate = new Date(),
    includeDrivers = true,
    includeVehicles = true,
    includeFleetRecords = true,
    includeIntegrations = true,
    includeRequests = true,
    includeWeeklyRecords = false,
    driverStatus = 'active',
    vehicleStatus = 'all',
  } = options;

  const errors: string[] = [];
  const data: Partial<UnifiedAdminData> = {
    drivers: [],
    vehicles: [],
    fleetRecords: [],
    integrations: [],
    requests: [],
    weeklyRecords: [],
    errors: [],
  };

  try {
    // ========== FETCH DRIVERS ==========
    if (includeDrivers) {
      try {
        let driversQuery = adminDb.collection('drivers');
        
        if (driverStatus !== 'all') {
          driversQuery = driversQuery.where('status', '==', driverStatus) as any;
        }

        const driversSnapshot = await driversQuery.get();
        
        data.drivers = driversSnapshot.docs.map(doc => {
          const driverData = doc.data();
          return {
            id: doc.id,
            name: driverData.name || '',
            email: driverData.email || '',
            phone: driverData.phone || null,
            type: driverData.type || 'renter',
            status: driverData.status || 'active',
            vehicle: driverData.vehicle || null,
            vehicleName: driverData.vehicleName || null,
            joinDate: driverData.joinDate || driverData.createdAt || null,
          };
        });
      } catch (error: any) {
        errors.push(`Drivers: ${error.message}`);
      }
    }

    // ========== FETCH VEHICLES ==========
    if (includeVehicles) {
      try {
        let vehiclesQuery = adminDb.collection('vehicles');
        
        if (vehicleStatus !== 'all') {
          vehiclesQuery = vehiclesQuery.where('status', '==', vehicleStatus) as any;
        }

        const vehiclesSnapshot = await vehiclesQuery.get();
        
        data.vehicles = vehiclesSnapshot.docs.map(doc => {
          const vehicleData = doc.data();
          return {
            id: doc.id,
            plate: vehicleData.plate || '',
            brand: vehicleData.brand || '',
            model: vehicleData.model || '',
            year: vehicleData.year || 0,
            status: vehicleData.status || 'active',
            type: vehicleData.type || null,
            currentDriver: vehicleData.currentDriver || null,
            currentDriverName: vehicleData.currentDriverName || null,
          };
        });
      } catch (error: any) {
        errors.push(`Vehicles: ${error.message}`);
      }
    }

    // ========== FETCH FLEET RECORDS ==========
    if (includeFleetRecords) {
      try {
        const fleetSnapshot = await adminDb
          .collection('fleetRecords')
          .where('date', '>=', startDate.toISOString().split('T')[0])
          .where('date', '<=', endDate.toISOString().split('T')[0])
          .get();

        data.fleetRecords = fleetSnapshot.docs.map(doc => {
          const record = doc.data();
          return {
            id: doc.id,
            date: record.date || '',
            driverId: record.driverId || '',
            driverName: record.driverName || '',
            vehicleId: record.vehicleId || '',
            vehiclePlate: record.vehiclePlate || '',
            totalTrips: record.totalTrips || 0,
            totalEarnings: record.totalEarnings || 0,
            totalExpenses: record.totalExpenses || 0,
            netProfit: record.netProfit || 0,
            totalDistance: record.totalDistance || null,
            hoursWorked: record.hoursWorked || null,
          };
        });
      } catch (error: any) {
        errors.push(`Fleet Records: ${error.message}`);
      }
    }

    // ========== FETCH INTEGRATIONS ==========
    if (includeIntegrations) {
      try {
        const integrationsSnapshot = await adminDb.collection('integrations').get();
        
        data.integrations = integrationsSnapshot.docs.map(doc => {
          const integration = doc.data();
          return {
            id: doc.id,
            name: integration.name || '',
            platform: integration.platform || doc.id,
            status: integration.status || 'disconnected',
            lastSync: integration.lastSync || null,
            lastError: integration.lastError || null,
            config: integration.config || {},
          };
        });
      } catch (error: any) {
        errors.push(`Integrations: ${error.message}`);
      }
    }

    // ========== FETCH REQUESTS ==========
    if (includeRequests) {
      try {
        const requestsSnapshot = await adminDb
          .collection('requests')
          .orderBy('createdAt', 'desc')
          .get();

        data.requests = requestsSnapshot.docs.map(doc => {
          const request = doc.data();
          return {
            id: doc.id,
            name: request.name || '',
            email: request.email || '',
            phone: request.phone || '',
            service: request.service || '',
            message: request.message || null,
            status: request.status || 'pending',
            createdAt: request.createdAt || '',
            updatedAt: request.updatedAt || null,
          };
        });
      } catch (error: any) {
        errors.push(`Requests: ${error.message}`);
      }
    }

    // ========== FETCH WEEKLY RECORDS ==========
    if (includeWeeklyRecords) {
      try {
        const weeklySnapshot = await adminDb
          .collection('driverWeeklyRecords')
          .where('weekStart', '>=', startDate.toISOString())
          .where('weekStart', '<=', endDate.toISOString())
          .get();

        const weeklyMap = new Map<string, UnifiedWeeklyRecord>();

        weeklySnapshot.docs.forEach(doc => {
          const record = doc.data();
          const key = `${record.driverId}-${record.weekStart}`;
          
          if (!weeklyMap.has(key)) {
            weeklyMap.set(key, {
              driverId: record.driverId || '',
              driverName: record.driverName || '',
              weekStart: record.weekStart || '',
              weekEnd: record.weekEnd || '',
              metrics: {
                totalTrips: 0,
                totalEarnings: 0,
                totalExpenses: 0,
                netProfit: 0,
                avgFare: 0,
                totalDistance: 0,
                hoursWorked: 0,
                rating: 0,
              },
            });
          }

          const weekly = weeklyMap.get(key)!;
          weekly.metrics.totalTrips += record.totalTrips || 0;
          weekly.metrics.totalEarnings += record.totalEarnings || 0;
          weekly.metrics.totalExpenses += record.totalExpenses || 0;
          weekly.metrics.netProfit += record.netProfit || 0;
          weekly.metrics.totalDistance += record.totalDistance || 0;
          weekly.metrics.hoursWorked += record.hoursWorked || 0;
          weekly.metrics.rating = record.rating || 0;
        });

        data.weeklyRecords = Array.from(weeklyMap.values());
      } catch (error: any) {
        errors.push(`Weekly Records: ${error.message}`);
      }
    }

    // ========== CALCULATE SUMMARY STATS ==========
    const summary = calculateSummaryStats(data as UnifiedAdminData, startDate, endDate);

    // ========== RETURN UNIFIED DATA ==========
    return {
      summary,
      drivers: data.drivers || [],
      vehicles: data.vehicles || [],
      fleetRecords: data.fleetRecords || [],
      integrations: data.integrations || [],
      requests: data.requests || [],
      weeklyRecords: data.weeklyRecords || [],
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      },
      errors,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    errors.push(`Critical: ${error.message}`);
    
    // Return empty structure on critical error
    return {
      summary: getEmptySummary(),
      drivers: [],
      vehicles: [],
      fleetRecords: [],
      integrations: [],
      requests: [],
      weeklyRecords: [],
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
      },
      errors,
      fetchedAt: new Date().toISOString(),
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

function calculateSummaryStats(
  data: UnifiedAdminData,
  startDate: Date,
  endDate: Date
): SummaryStats {
  const { drivers, vehicles, fleetRecords, integrations, requests } = data;

  // Financial metrics
  const totalEarnings = fleetRecords.reduce((sum, r) => sum + r.totalEarnings, 0);
  const totalExpenses = fleetRecords.reduce((sum, r) => sum + r.totalExpenses, 0);
  const netProfit = totalEarnings - totalExpenses;
  const profitMargin = totalEarnings > 0 ? (netProfit / totalEarnings) * 100 : 0;
  
  // Operations metrics
  const totalTrips = fleetRecords.reduce((sum, r) => sum + r.totalTrips, 0);
  const avgTripValue = totalTrips > 0 ? totalEarnings / totalTrips : 0;
  const totalDistance = fleetRecords.reduce((sum, r) => sum + (r.totalDistance || 0), 0);
  const totalHours = fleetRecords.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
  const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const avgTripsPerDay = totalTrips / days;

  // Fleet metrics
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const inactiveVehicles = vehicles.filter(v => v.status === 'inactive').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const vehiclesWithTrips = new Set(fleetRecords.map(r => r.vehicleId));
  const utilizationRate = activeVehicles > 0 ? (vehiclesWithTrips.size / activeVehicles) * 100 : 0;

  // Driver metrics
  const activeDrivers = drivers.filter(d => d.status === 'active').length;
  const affiliates = drivers.filter(d => d.type === 'affiliate' && d.status === 'active').length;
  const renters = drivers.filter(d => d.type === 'renter' && d.status === 'active').length;
  const driversWithMetrics = drivers.filter(d => d.metrics);
  const avgRating = driversWithMetrics.length > 0
    ? driversWithMetrics.reduce((sum, d) => sum + (d.metrics?.rating || 0), 0) / driversWithMetrics.length
    : 0;

  // Integration metrics
  const connectedIntegrations = integrations.filter(i => i.status === 'connected').length;
  const disconnectedIntegrations = integrations.filter(i => i.status === 'disconnected').length;
  const errorIntegrations = integrations.filter(i => i.status === 'error').length;

  // Request metrics
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const rejectedRequests = requests.filter(r => r.status === 'rejected').length;

  return {
    financial: {
      totalEarnings,
      totalExpenses,
      netProfit,
      profitMargin,
      avgTripValue,
    },
    operations: {
      totalTrips,
      totalDistance,
      totalHours,
      avgTripsPerDay,
    },
    fleet: {
      totalVehicles: vehicles.length,
      activeVehicles,
      inactiveVehicles,
      maintenanceVehicles,
      utilizationRate,
    },
    drivers: {
      totalDrivers: drivers.length,
      activeDrivers,
      affiliates,
      renters,
      avgRating,
    },
    integrations: {
      total: integrations.length,
      connected: connectedIntegrations,
      disconnected: disconnectedIntegrations,
      errors: errorIntegrations,
    },
    requests: {
      total: requests.length,
      pending: pendingRequests,
      approved: approvedRequests,
      rejected: rejectedRequests,
    },
  };
}

function getEmptySummary(): SummaryStats {
  return {
    financial: {
      totalEarnings: 0,
      totalExpenses: 0,
      netProfit: 0,
      profitMargin: 0,
      avgTripValue: 0,
    },
    operations: {
      totalTrips: 0,
      totalDistance: 0,
      totalHours: 0,
      avgTripsPerDay: 0,
    },
    fleet: {
      totalVehicles: 0,
      activeVehicles: 0,
      inactiveVehicles: 0,
      maintenanceVehicles: 0,
      utilizationRate: 0,
    },
    drivers: {
      totalDrivers: 0,
      activeDrivers: 0,
      affiliates: 0,
      renters: 0,
      avgRating: 0,
    },
    integrations: {
      total: 0,
      connected: 0,
      disconnected: 0,
      errors: 0,
    },
    requests: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    },
  };
}

// ==================== CONVENIENCE FUNCTIONS ====================

/**
 * Busca apenas dados do dashboard (leve e rápido)
 */
export async function fetchDashboardData(days: number = 30): Promise<UnifiedAdminData> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return fetchUnifiedAdminData({
    startDate,
    endDate,
    includeDrivers: true,
    includeVehicles: true,
    includeFleetRecords: true,
    includeIntegrations: true,
    includeRequests: false,
    includeWeeklyRecords: false,
  });
}

/**
 * Busca dados completos para relatórios
 */
export async function fetchFullReportData(
  startDate: Date,
  endDate: Date
): Promise<UnifiedAdminData> {
  return fetchUnifiedAdminData({
    startDate,
    endDate,
    includeDrivers: true,
    includeVehicles: true,
    includeFleetRecords: true,
    includeIntegrations: true,
    includeRequests: true,
    includeWeeklyRecords: true,
  });
}

/**
 * Busca apenas métricas de motoristas
 */
export async function fetchDriverMetricsData(days: number = 30): Promise<UnifiedAdminData> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return fetchUnifiedAdminData({
    startDate,
    endDate,
    includeDrivers: true,
    includeVehicles: false,
    includeFleetRecords: true,
    includeIntegrations: false,
    includeRequests: false,
    includeWeeklyRecords: true,
    driverStatus: 'active',
  });
}
