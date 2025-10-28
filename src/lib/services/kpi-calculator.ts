/**
 * SERVICE: KPI Calculator
 * Calcula KPIs de desempenho dos motoristas
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { PerformanceKPI, PerformanceKPISchema, calculateKPIScore, calculateOverallScore, getPerformanceLevel } from '@/schemas/performance-kpi';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

/**
 * Calcular KPIs de um motorista para uma semana
 */
export async function calculateWeeklyKPIs(
  driverId: string,
  weekId: string,
  weekStart: string,
  weekEnd: string
): Promise<PerformanceKPI | null> {
  try {
    // 1. Buscar dados do motorista
    const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
    if (!driverDoc.exists) {
      console.error(`[calculateWeeklyKPIs] Motorista ${driverId} não encontrado`);
      return null;
    }

    const driver = driverDoc.data();
    const driverName = driver.fullName || driver.name || 'Desconhecido';

    // 2. Buscar registro semanal em driverPayments
    const weeklyRecordDoc = await adminDb
      .collection('driverPayments')
      .where('driverId', '==', driverId)
      .where('weekId', '==', weekId)
      .limit(1)
      .get();

    if (weeklyRecordDoc.empty) {
      console.log(`[calculateWeeklyKPIs] Nenhum registro semanal para ${driverId} - ${weekId}`);
      return null;
    }

    const weeklyRecord = weeklyRecordDoc.docs[0].data() as DriverWeeklyRecord;

    // 3. KPI 1: Receita Semanal
    const weeklyRevenue = {
      value: weeklyRecord.ganhosTotal || 0,
      targetMin: 600,
      targetExcellence: 800,
      score: 0,
      weight: 0.30,
    };
    weeklyRevenue.score = calculateKPIScore(weeklyRevenue.value, weeklyRevenue.targetMin, weeklyRevenue.targetExcellence);

    // 4. KPI 2: Taxa de Aceitação (dados da Uber API - placeholder)
    const acceptanceRate = {
      value: 85, // TODO: Buscar de integração Uber
      targetMin: 85,
      targetExcellence: 95,
      score: 0,
      weight: 0.20,
    };
    acceptanceRate.score = calculateKPIScore(acceptanceRate.value, acceptanceRate.targetMin, acceptanceRate.targetExcellence);

    // 5. KPI 3: Avaliação de Passageiros (dados da Uber API - placeholder)
    const passengerRating = {
      value: 4.5, // TODO: Buscar de integração Uber
      targetMin: 4.5,
      targetExcellence: 4.8,
      score: 0,
      weight: 0.25,
    };
    passengerRating.score = calculateKPIScore(passengerRating.value, passengerRating.targetMin, passengerRating.targetExcellence);

    // 6. KPI 4: Recrutamentos Ativos (este trimestre)
    const quarterStart = getQuarterStart();
    const recruitmentsThisQuarter = await countRecruitmentsSince(driverId, quarterStart);
    const recruitmentsActive = {
      value: recruitmentsThisQuarter,
      targetMin: 1,
      targetExcellence: 2,
      score: 0,
      weight: 0.15,
    };
    recruitmentsActive.score = calculateKPIScore(recruitmentsActive.value, recruitmentsActive.targetMin, recruitmentsActive.targetExcellence);

    // 7. KPI 5: Horas Ativas por Semana (dados Cartrack/Uber - placeholder)
    const activeHoursPerWeek = {
      value: 40, // TODO: Buscar de integração Cartrack/Uber
      targetMin: 40,
      targetExcellence: 50,
      score: 0,
      weight: 0.10,
    };
    activeHoursPerWeek.score = calculateKPIScore(activeHoursPerWeek.value, activeHoursPerWeek.targetMin, activeHoursPerWeek.targetExcellence);

    // 8. Criar objeto de KPI
    const kpi: PerformanceKPI = {
      driverId,
      driverName,
      weekId,
      weekStart,
      weekEnd,
      weeklyRevenue,
      acceptanceRate,
      passengerRating,
      recruitmentsActive,
      activeHoursPerWeek,
      overallScore: 0,
      performanceLevel: 'Satisfatório',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 9. Calcular score geral
    kpi.overallScore = calculateOverallScore(kpi);
    kpi.performanceLevel = getPerformanceLevel(kpi.overallScore);

    // Validar schema
    const validated = PerformanceKPISchema.parse(kpi);
    return validated;
  } catch (error) {
    console.error(`[calculateWeeklyKPIs] Erro:`, error);
    return null;
  }
}

/**
 * Calcular KPIs para todos os motoristas de uma semana
 */
export async function calculateAllWeeklyKPIs(
  weekId: string,
  weekStart: string,
  weekEnd: string
): Promise<PerformanceKPI[]> {
  try {
    // Buscar todos os motoristas ativos
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('status', '==', 'active')
      .get();

    const kpis: PerformanceKPI[] = [];

    for (const driverDoc of driversSnapshot.docs) {
      const kpi = await calculateWeeklyKPIs(driverDoc.id, weekId, weekStart, weekEnd);
      if (kpi) {
        kpis.push(kpi);
      }
    }

    console.log(`[calculateAllWeeklyKPIs] Calculados ${kpis.length} KPIs para ${weekId}`);
    return kpis;
  } catch (error) {
    console.error(`[calculateAllWeeklyKPIs] Erro:`, error);
    return [];
  }
}

/**
 * Salvar KPIs no Firestore
 */
export async function saveWeeklyKPIs(kpis: PerformanceKPI[]): Promise<void> {
  try {
    const batch = adminDb.batch();

    for (const kpi of kpis) {
      const docRef = adminDb.collection('performanceKPIs').doc();
      batch.set(docRef, kpi);
    }

    await batch.commit();
    console.log(`[saveWeeklyKPIs] Salvos ${kpis.length} KPIs`);
  } catch (error) {
    console.error(`[saveWeeklyKPIs] Erro:`, error);
    throw error;
  }
}

/**
 * Buscar KPIs de um motorista em um período
 */
export async function getDriverKPIs(
  driverId: string,
  startDate: string,
  endDate: string
): Promise<PerformanceKPI[]> {
  try {
    const snapshot = await adminDb
      .collection('performanceKPIs')
      .where('driverId', '==', driverId)
      .where('weekStart', '>=', startDate)
      .where('weekStart', '<=', endDate)
      .orderBy('weekStart', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as PerformanceKPI);
  } catch (error) {
    console.error(`[getDriverKPIs] Erro:`, error);
    return [];
  }
}

/**
 * Buscar KPI mais recente de um motorista
 */
export async function getLatestKPI(driverId: string): Promise<PerformanceKPI | null> {
  try {
    const snapshot = await adminDb
      .collection('performanceKPIs')
      .where('driverId', '==', driverId)
      .orderBy('weekStart', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as PerformanceKPI;
  } catch (error) {
    console.error(`[getLatestKPI] Erro:`, error);
    return null;
  }
}

/**
 * Calcular ranking de motoristas por métrica
 */
export async function getRankingByMetric(
  weekId: string,
  metric: 'revenue' | 'performance' | 'recruitments'
): Promise<Array<{ rank: number; driverId: string; driverName: string; value: number }>> {
  try {
    const snapshot = await adminDb
      .collection('performanceKPIs')
      .where('weekId', '==', weekId)
      .get();

    const kpis = snapshot.docs.map(doc => doc.data() as PerformanceKPI);

    let sorted: Array<{ driverId: string; driverName: string; value: number }> = [];

    switch (metric) {
      case 'revenue':
        sorted = kpis
          .map(k => ({ driverId: k.driverId, driverName: k.driverName, value: k.weeklyRevenue.value }))
          .sort((a, b) => b.value - a.value);
        break;
      case 'performance':
        sorted = kpis
          .map(k => ({ driverId: k.driverId, driverName: k.driverName, value: k.overallScore }))
          .sort((a, b) => b.value - a.value);
        break;
      case 'recruitments':
        sorted = kpis
          .map(k => ({ driverId: k.driverId, driverName: k.driverName, value: k.recruitmentsActive.value }))
          .sort((a, b) => b.value - a.value);
        break;
    }

    return sorted.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));
  } catch (error) {
    console.error(`[getRankingByMetric] Erro:`, error);
    return [];
  }
}

/**
 * Contar recrutamentos desde uma data
 */
async function countRecruitmentsSince(driverId: string, sinceDate: string): Promise<number> {
  try {
    const snapshot = await adminDb
      .collection('drivers')
      .where('recruitedBy', '==', driverId)
      .where('recruitedAt', '>=', sinceDate)
      .where('status', '==', 'active')
      .get();

    return snapshot.size;
  } catch (error) {
    console.error(`[countRecruitmentsSince] Erro:`, error);
    return 0;
  }
}

/**
 * Obter data de início do trimestre atual
 */
function getQuarterStart(): string {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), quarter * 3, 1);
  return start.toISOString().split('T')[0];
}


