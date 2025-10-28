/**
 * Serviço de Métricas de Performance
 * 
 * Calcula KPIs e métricas a partir dos dados semanais (dataWeekly + driverWeeklyRecords)
 * Para admin: visão agregada de todos os motoristas
 * Para motorista: visão pessoal
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export interface WeeklyMetrics {
  weekId: string;
  weekStart: string;
  weekEnd: string;
  driverId?: string;
  driverName?: string;
  
  // Ganhos
  totalEarnings: number;      // Total bruto (Uber + Bolt)
  ivaDeducted: number;        // IVA 6%
  earningsAfterIva: number;   // Ganhos menos IVA
  
  // Descontos
  adminFee: number;           // Taxa adm
  fuelCost: number;           // Combustível
  tollsCost: number;          // Portagens
  rentalCost: number;         // Aluguel
  financingCost: number;      // Financiamento total
  
  // Resultado
  totalDeductions: number;    // Soma de descontos
  netPayout: number;          // Ganhos finais (o que o motorista recebe)
  
  // Plataformas
  uberEarnings: number;
  boltEarnings: number;
  
  // Eficiência
  trips: number;
  avgEarningsPerTrip: number;
  
  // Taxa adm customizada?
  adminFeePercentage: number; // Se %
}

export interface PerformanceMetrics {
  period: 'week' | 'month' | 'total';
  startDate: string;
  endDate: string;
  
  // Agregações
  totalWeeks: number;
  totalEarnings: number;
  totalDeductions: number;
  totalNetPayout: number;
  totalTrips: number;
  
  // Por categoria
  earnings: {
    total: number;
    avg: number;
    min: number;
    max: number;
    trend: number; // % mudança última semana vs anterior
  };
  
  adminFee: {
    total: number;
    avg: number;
    percentage: number; // % do earnings
  };
  
  fuel: {
    total: number;
    avg: number;
    percentage: number;
  };
  
  tolls: {
    total: number;
    avg: number;
    percentage: number;
  };
  
  rental: {
    total: number;
    avg: number;
    percentage: number;
  };
  
  financing: {
    total: number;
    avg: number;
    percentage: number;
  };
  
  // Eficiência
  efficiency: {
    avgEarningsPerTrip: number;
    totalTrips: number;
    avgTripsPerWeek: number;
  };
  
  // Plataformas
  platforms: {
    uber: {
      total: number;
      percentage: number;
      trips: number;
    };
    bolt: {
      total: number;
      percentage: number;
      trips: number;
    };
  };
  
  // Semanas
  weeklyData: WeeklyMetrics[];
}

/**
 * Buscar semanas em um período
 */
function getWeeksInRange(startDate: Date, endDate: Date): string[] {
  const weeks: string[] = [];
  let current = new Date(startDate);
  
  while (current <= endDate) {
    // Calcular semana ISO (2025-W40, 2025-W41, etc)
    const date = new Date(current);
    const thursday = new Date(date);
    thursday.setDate(thursday.getDate() + (4 - date.getDay()));
    
    const year = thursday.getFullYear();
    const jan4 = new Date(year, 0, 4);
    const weekStart = new Date(jan4);
    weekStart.setDate(weekStart.getDate() - jan4.getDay());
    
    const weekNumber = Math.floor((thursday.getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    const weekId = `${year}-W${String(weekNumber).padStart(2, '0')}`;
    
    if (!weeks.includes(weekId)) {
      weeks.push(weekId);
    }
    
    current.setDate(current.getDate() + 7);
  }
  
  return weeks;
}

/**
 * Buscar métricas para motorista em um período
 */
export async function getDriverPerformanceMetrics(
  driverId: string,
  period: 'week' | 'month' | 'total' = 'month'
): Promise<PerformanceMetrics | null> {
  const db = adminDb;
  
  // Primeiro, buscar TODOS os dados do driver para entender que semanas têm dados
  const allRecordsSnapshot = await db
    .collection('driverPayments')
    .where('driverId', '==', driverId)
    .get();
  
  if (allRecordsSnapshot.empty) {
    return null;
  }

  const allWeekIds = Array.from(new Set(allRecordsSnapshot.docs.map(doc => doc.data().weekId))).sort();
  
  // Determinar que semanas incluir baseado no período
  let weeks: string[];
  
  if (period === 'week') {
    // Última semana com dados
    weeks = allWeekIds.length > 0 ? [allWeekIds[allWeekIds.length - 1]] : [];
  } else if (period === 'month') {
    // Mês atual (outubro 2025) - incluir semanas que tocam outubro
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 10 para outubro
    const currentYear = now.getFullYear(); // 2025
    
    weeks = allWeekIds.filter(w => {
      const year = parseInt(w.split('-')[0]);
      const weekNum = parseInt(w.split('-')[1].substring(1)); // Remove 'W' prefix
      
      // Apenas para 2025 - mês é outubro
      if (year !== currentYear) return false;
      
      // W40: Sep 29 - Oct 5 (toca outubro)
      // W41: Oct 6 - Oct 12 (totalmente outubro)
      // W42: Oct 13 - Oct 19 (totalmente outubro)
      // W43: Oct 20 - Oct 26 (totalmente outubro - sem dados ainda)
      // Incluir semanas 40-42 que têm dados
      return weekNum >= 40 && weekNum <= 42;
    });
  } else {
    // Total: todas as semanas com dados
    weeks = allWeekIds;
  }
  
  if (weeks.length === 0) {
    return null;
  }
  
  // Buscar registros do motorista em driverPayments
  const recordsSnapshot = await db
    .collection('driverPayments')
    .where('driverId', '==', driverId)
    .where('weekId', 'in', weeks.length > 0 ? weeks : ['dummy'])
    .get();
  
  if (recordsSnapshot.empty) {
    return null;
  }

  const records = recordsSnapshot.docs.map(doc => doc.data());
  
  // Processar métricas por semana
  const weeklyMetrics: WeeklyMetrics[] = records.map(record => {
    // Usar recordSnapshot que contém os dados originais, ou fallback para campos diretos
    const snapshot = record.recordSnapshot || record;
    
    return {
      weekId: snapshot.weekId || record.weekId,
      weekStart: snapshot.weekStart || record.weekStart,
      weekEnd: snapshot.weekEnd || record.weekEnd,
      driverId: snapshot.driverId || record.driverId,
      driverName: snapshot.driverName || record.driverName,
      
      totalEarnings: snapshot.ganhosTotal || record.baseAmount || 0,
      ivaDeducted: snapshot.ivaValor || 0,
      earningsAfterIva: snapshot.ganhosMenosIVA || record.baseAmount || 0,
      
      adminFee: snapshot.despesasAdm || record.adminFeeValue || 0,
      fuelCost: snapshot.combustivel || 0,
      tollsCost: snapshot.viaverde || 0,
      rentalCost: snapshot.aluguel || 0,
      financingCost: snapshot.financingDetails?.totalCost || 0,
      
      totalDeductions:
        (snapshot.despesasAdm || record.adminFeeValue || 0) +
        (snapshot.combustivel || 0) +
        (snapshot.viaverde || 0) +
        (snapshot.aluguel || 0) +
        (snapshot.financingDetails?.totalCost || 0),
      
      netPayout: snapshot.repasse || record.totalAmount || 0,
      
      uberEarnings: snapshot.uberTotal || 0,
      boltEarnings: snapshot.boltTotal || 0,
      
      trips: (snapshot.uberTrips || 0) + (snapshot.boltTrips || 0),
      avgEarningsPerTrip: ((snapshot.uberTotal || 0) + (snapshot.boltTotal || 0)) / ((snapshot.uberTrips || 0) + (snapshot.boltTrips || 0) || 1),
      
      adminFeePercentage: (snapshot.ganhosTotal || record.baseAmount) ? 
        (((snapshot.despesasAdm || record.adminFeeValue || 0) / (snapshot.ganhosTotal || record.baseAmount)) * 100) : 0,
    };
  });
  
  // Calcular agregações
  const totalEarnings = weeklyMetrics.reduce((sum, w) => sum + w.totalEarnings, 0);
  const totalDeductions = weeklyMetrics.reduce((sum, w) => sum + w.totalDeductions, 0);
  const totalNetPayout = weeklyMetrics.reduce((sum, w) => sum + w.netPayout, 0);
  const totalTrips = weeklyMetrics.reduce((sum, w) => sum + w.trips, 0);
  const totalAdminFee = weeklyMetrics.reduce((sum, w) => sum + w.adminFee, 0);
  const totalFuel = weeklyMetrics.reduce((sum, w) => sum + w.fuelCost, 0);
  const totalTolls = weeklyMetrics.reduce((sum, w) => sum + w.tollsCost, 0);
  const totalRental = weeklyMetrics.reduce((sum, w) => sum + w.rentalCost, 0);
  const totalFinancing = weeklyMetrics.reduce((sum, w) => sum + w.financingCost, 0);
  const totalUber = weeklyMetrics.reduce((sum, w) => sum + w.uberEarnings, 0);
  const totalBolt = weeklyMetrics.reduce((sum, w) => sum + w.boltEarnings, 0);
  
  const weekCount = weeklyMetrics.length || 1;
  
  // Tendência: última semana vs média anterior
  let trend = 0;
  if (weeklyMetrics.length > 1) {
    const lastWeek = weeklyMetrics[weeklyMetrics.length - 1].totalEarnings;
    const avgPrevious = weeklyMetrics.slice(0, -1).reduce((sum, w) => sum + w.totalEarnings, 0) / (weeklyMetrics.length - 1);
    trend = avgPrevious > 0 ? ((lastWeek - avgPrevious) / avgPrevious) * 100 : 0;
  }
  
  return {
    period,
    startDate: weeklyMetrics.length > 0 ? weeklyMetrics[0].weekStart : new Date().toISOString(),
    endDate: weeklyMetrics.length > 0 ? weeklyMetrics[weeklyMetrics.length - 1].weekEnd : new Date().toISOString(),
    
    totalWeeks: weekCount,
    totalEarnings,
    totalDeductions,
    totalNetPayout,
    totalTrips,
    
    earnings: {
      total: totalEarnings,
      avg: totalEarnings / weekCount,
      min: Math.min(...weeklyMetrics.map(w => w.totalEarnings)),
      max: Math.max(...weeklyMetrics.map(w => w.totalEarnings)),
      trend,
    },
    
    adminFee: {
      total: totalAdminFee,
      avg: totalAdminFee / weekCount,
      percentage: totalEarnings > 0 ? (totalAdminFee / totalEarnings) * 100 : 0,
    },
    
    fuel: {
      total: totalFuel,
      avg: totalFuel / weekCount,
      percentage: totalEarnings > 0 ? (totalFuel / totalEarnings) * 100 : 0,
    },
    
    tolls: {
      total: totalTolls,
      avg: totalTolls / weekCount,
      percentage: totalEarnings > 0 ? (totalTolls / totalEarnings) * 100 : 0,
    },
    
    rental: {
      total: totalRental,
      avg: totalRental / weekCount,
      percentage: totalEarnings > 0 ? (totalRental / totalEarnings) * 100 : 0,
    },
    
    financing: {
      total: totalFinancing,
      avg: totalFinancing / weekCount,
      percentage: totalEarnings > 0 ? (totalFinancing / totalEarnings) * 100 : 0,
    },
    
    efficiency: {
      avgEarningsPerTrip: totalTrips > 0 ? totalEarnings / totalTrips : 0,
      totalTrips,
      avgTripsPerWeek: totalTrips / weekCount,
    },
    
    platforms: {
      uber: {
        total: totalUber,
        percentage: totalEarnings > 0 ? (totalUber / totalEarnings) * 100 : 0,
        trips: weeklyMetrics.reduce((sum, w) => sum + (w.uberEarnings > 0 ? 1 : 0), 0),
      },
      bolt: {
        total: totalBolt,
        percentage: totalEarnings > 0 ? (totalBolt / totalEarnings) * 100 : 0,
        trips: weeklyMetrics.reduce((sum, w) => sum + (w.boltEarnings > 0 ? 1 : 0), 0),
      },
    },
    
    weeklyData: weeklyMetrics.sort((a, b) => 
      new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
    ),
  };
}

/**
 * Buscar performance para todos os motoristas (admin)
 */
export async function getAllDriversPerformanceMetrics(
  period: 'week' | 'month' | 'total' = 'month'
): Promise<Map<string, PerformanceMetrics>> {
  const db = adminDb;
  
  // Buscar todos os motoristas únicos
  const driversSnapshot = await db
    .collection('drivers')
    .select('id')
    .get();
  
  const results = new Map<string, PerformanceMetrics>();
  
  for (const driverDoc of driversSnapshot.docs) {
    const driverId = driverDoc.id;
    const metrics = await getDriverPerformanceMetrics(driverId, period);
    if (metrics) {
      results.set(driverId, metrics);
    }
  }
  
  return results;
}

/**
 * Agregação total para admin (todos os drivers)
 */
export async function getAggregatedPerformanceMetrics(
  period: 'week' | 'month' | 'total' = 'month'
): Promise<PerformanceMetrics | null> {
  const allMetrics = await getAllDriversPerformanceMetrics(period);
  
  if (allMetrics.size === 0) {
    return null;
  }
  
  const metricsArray = Array.from(allMetrics.values());
  
  // Agregar tudo
  const totalEarnings = metricsArray.reduce((sum, m) => sum + m.totalEarnings, 0);
  const totalDeductions = metricsArray.reduce((sum, m) => sum + m.totalDeductions, 0);
  const totalNetPayout = metricsArray.reduce((sum, m) => sum + m.totalNetPayout, 0);
  const totalTrips = metricsArray.reduce((sum, m) => sum + m.totalTrips, 0);
  const totalWeeks = metricsArray.reduce((sum, m) => sum + m.totalWeeks, 0);
  
  const totalAdminFee = metricsArray.reduce((sum, m) => sum + m.adminFee.total, 0);
  const totalFuel = metricsArray.reduce((sum, m) => sum + m.fuel.total, 0);
  const totalTolls = metricsArray.reduce((sum, m) => sum + m.tolls.total, 0);
  const totalRental = metricsArray.reduce((sum, m) => sum + m.rental.total, 0);
  const totalFinancing = metricsArray.reduce((sum, m) => sum + m.financing.total, 0);
  
  const totalUber = metricsArray.reduce((sum, m) => sum + m.platforms.uber.total, 0);
  const totalBolt = metricsArray.reduce((sum, m) => sum + m.platforms.bolt.total, 0);
  
  // Todas as semanas concatenadas e ordenadas
  let allWeeklyData: WeeklyMetrics[] = [];
  metricsArray.forEach(m => allWeeklyData.push(...m.weeklyData));
  allWeeklyData = allWeeklyData.sort((a, b) => 
    new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
  );
  
  // Remover duplicatas por weekId
  const uniqueWeeks = new Map<string, WeeklyMetrics>();
  allWeeklyData.forEach(w => {
    if (!uniqueWeeks.has(w.weekId)) {
      const { driverId, driverName, ...rest } = w;
      uniqueWeeks.set(w.weekId, rest as WeeklyMetrics);
    } else {
      // Agregar com o existente
      const existing = uniqueWeeks.get(w.weekId)!;
      existing.totalEarnings += w.totalEarnings;
      existing.ivaDeducted += w.ivaDeducted;
      existing.earningsAfterIva += w.earningsAfterIva;
      existing.adminFee += w.adminFee;
      existing.fuelCost += w.fuelCost;
      existing.tollsCost += w.tollsCost;
      existing.rentalCost += w.rentalCost;
      existing.financingCost += w.financingCost;
      existing.totalDeductions += w.totalDeductions;
      existing.netPayout += w.netPayout;
      existing.uberEarnings += w.uberEarnings;
      existing.boltEarnings += w.boltEarnings;
      existing.trips += w.trips;
    }
  });
  
  return {
    period,
    startDate: metricsArray[0]?.startDate || new Date().toISOString(),
    endDate: metricsArray[0]?.endDate || new Date().toISOString(),
    
    totalWeeks: uniqueWeeks.size,
    totalEarnings,
    totalDeductions,
    totalNetPayout,
    totalTrips,
    
    earnings: {
      total: totalEarnings,
      avg: totalWeeks > 0 ? totalEarnings / totalWeeks : 0,
      min: Math.min(...metricsArray.map(m => m.earnings.min)),
      max: Math.max(...metricsArray.map(m => m.earnings.max)),
      trend: metricsArray[metricsArray.length - 1]?.earnings.trend || 0,
    },
    
    adminFee: {
      total: totalAdminFee,
      avg: totalWeeks > 0 ? totalAdminFee / totalWeeks : 0,
      percentage: totalEarnings > 0 ? (totalAdminFee / totalEarnings) * 100 : 0,
    },
    
    fuel: {
      total: totalFuel,
      avg: totalWeeks > 0 ? totalFuel / totalWeeks : 0,
      percentage: totalEarnings > 0 ? (totalFuel / totalEarnings) * 100 : 0,
    },
    
    tolls: {
      total: totalTolls,
      avg: totalWeeks > 0 ? totalTolls / totalWeeks : 0,
      percentage: totalEarnings > 0 ? (totalTolls / totalEarnings) * 100 : 0,
    },
    
    rental: {
      total: totalRental,
      avg: totalWeeks > 0 ? totalRental / totalWeeks : 0,
      percentage: totalEarnings > 0 ? (totalRental / totalEarnings) * 100 : 0,
    },
    
    financing: {
      total: totalFinancing,
      avg: totalWeeks > 0 ? totalFinancing / totalWeeks : 0,
      percentage: totalEarnings > 0 ? (totalFinancing / totalEarnings) * 100 : 0,
    },
    
    efficiency: {
      avgEarningsPerTrip: totalTrips > 0 ? totalEarnings / totalTrips : 0,
      totalTrips,
      avgTripsPerWeek: totalWeeks > 0 ? totalTrips / totalWeeks : 0,
    },
    
    platforms: {
      uber: {
        total: totalUber,
        percentage: totalEarnings > 0 ? (totalUber / totalEarnings) * 100 : 0,
        trips: metricsArray.reduce((sum, m) => sum + m.platforms.uber.trips, 0),
      },
      bolt: {
        total: totalBolt,
        percentage: totalEarnings > 0 ? (totalBolt / totalEarnings) * 100 : 0,
        trips: metricsArray.reduce((sum, m) => sum + m.platforms.bolt.trips, 0),
      },
    },
    
    weeklyData: Array.from(uniqueWeeks.values()),
  };
}

/**
 * Buscar ranking de top drivers por ganhos
 */
export async function getTopDriversRanking(period: 'week' | 'month' | 'total' = 'month') {
  const allMetrics = await getAllDriversPerformanceMetrics(period);
  
  const driversData = Array.from(allMetrics.entries())
    .map(([driverId, metric]) => ({
      driverId,
      driverName: metric.weeklyData[0]?.driverName || 'Unknown',
      totalEarnings: metric.totalEarnings,
      totalRepasse: metric.totalNetPayout,
      weeks: metric.totalWeeks,
      avgWeekly: metric.totalEarnings / metric.totalWeeks,
      trips: metric.totalTrips,
      adminFeePercentage: metric.adminFee.percentage,
    }))
    .filter(d => d.driverId && d.totalEarnings > 0)
    .sort((a, b) => b.totalEarnings - a.totalEarnings);

  return driversData;
}

