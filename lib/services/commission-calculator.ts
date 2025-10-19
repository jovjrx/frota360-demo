/**
 * SERVICE: Commission Calculator
 * Calcula comissões de afiliados (base + recrutamento)
 * Segue o padrão SSR do projeto
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { DriverWeeklyCommissionSchema, getCommissionRateForLevel, DriverWeeklyCommission } from '@/schemas/commission';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

/**
 * Calcular comissões semanais para um afiliado
 */
export async function calculateWeeklyCommissions(
  driverId: string,
  weekId: string,
  weekStart: string,
  weekEnd: string
): Promise<DriverWeeklyCommission | null> {
  try {
    // 1. Buscar dados do motorista
    const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
    if (!driverDoc.exists) {
      console.error(`[calculateWeeklyCommissions] Motorista ${driverId} não encontrado`);
      return null;
    }

    const driver = driverDoc.data();
    
    // Apenas afiliados têm comissões
    if (driver.type !== 'affiliate') {
      return null;
    }

    const affiliateLevel = driver.affiliateLevel || 1;
    const driverName = driver.fullName || driver.name || 'Desconhecido';

    // 2. Buscar receita semanal do motorista
    const weeklyRecordDoc = await adminDb
      .collection('weeklyRecords')
      .where('driverId', '==', driverId)
      .where('weekId', '==', weekId)
      .limit(1)
      .get();

    if (weeklyRecordDoc.empty) {
      console.log(`[calculateWeeklyCommissions] Nenhum registro semanal para ${driverId} - ${weekId}`);
      return null;
    }

    const weeklyRecord = weeklyRecordDoc.docs[0].data() as DriverWeeklyRecord;
    const driverRevenue = weeklyRecord.ganhosTotal || 0;

    // 3. Obter taxas de comissão
    const rates = getCommissionRateForLevel(affiliateLevel as 1 | 2 | 3);
    const baseCommission = driverRevenue * rates.base;

    // 4. Buscar motoristas recrutados ativos
    const recruitedSnapshot = await adminDb
      .collection('drivers')
      .where('recruitedBy', '==', driverId)
      .where('status', '==', 'active')
      .get();

    let recruitmentCommission = 0;
    const recruitmentBreakdown = [];

    // 5. Calcular comissões de recrutamento
    for (const recruitedDoc of recruitedSnapshot.docs) {
      const recruited = recruitedDoc.data();
      const recruitedId = recruitedDoc.id;
      const recruitedName = recruited.fullName || recruited.name || 'Desconhecido';

      // Buscar receita do recrutado na mesma semana
      const recruitedWeeklyDoc = await adminDb
        .collection('weeklyRecords')
        .where('driverId', '==', recruitedId)
        .where('weekId', '==', weekId)
        .limit(1)
        .get();

      if (!recruitedWeeklyDoc.empty) {
        const recruitedWeekly = recruitedWeeklyDoc.docs[0].data() as DriverWeeklyRecord;
        const recruitedRevenue = recruitedWeekly.ganhosTotal || 0;
        const commissionAmount = recruitedRevenue * rates.recruitment;

        recruitmentCommission += commissionAmount;
        recruitmentBreakdown.push({
          recruitedDriverId: recruitedId,
          recruitedDriverName: recruitedName,
          recruitedDriverRevenue: recruitedRevenue,
          commissionRate: rates.recruitment,
          commissionAmount: commissionAmount,
        });
      }
    }

    const totalCommission = baseCommission + recruitmentCommission;

    // 6. Criar objeto de comissão
    const commission: DriverWeeklyCommission = {
      driverId,
      driverName,
      weekId,
      weekStart,
      weekEnd,
      affiliateLevel: affiliateLevel as 1 | 2 | 3,
      driverRevenue,
      baseCommissionRate: rates.base,
      baseCommission,
      recruitmentCommissionRate: rates.recruitment,
      recruitmentCommission,
      recruitmentBreakdown,
      totalCommission,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Validar schema
    const validated = DriverWeeklyCommissionSchema.parse(commission);
    return validated;
  } catch (error) {
    console.error(`[calculateWeeklyCommissions] Erro:`, error);
    return null;
  }
}

/**
 * Calcular comissões para todos os afiliados de uma semana
 */
export async function calculateAllWeeklyCommissions(
  weekId: string,
  weekStart: string,
  weekEnd: string
): Promise<DriverWeeklyCommission[]> {
  try {
    // Buscar todos os afiliados ativos
    const affiliatesSnapshot = await adminDb
      .collection('drivers')
      .where('type', '==', 'affiliate')
      .where('status', '==', 'active')
      .get();

    const commissions: DriverWeeklyCommission[] = [];

    for (const affiliateDoc of affiliatesSnapshot.docs) {
      const commission = await calculateWeeklyCommissions(
        affiliateDoc.id,
        weekId,
        weekStart,
        weekEnd
      );

      if (commission) {
        commissions.push(commission);
      }
    }

    console.log(`[calculateAllWeeklyCommissions] Calculadas ${commissions.length} comissões para ${weekId}`);
    return commissions;
  } catch (error) {
    console.error(`[calculateAllWeeklyCommissions] Erro:`, error);
    return [];
  }
}

/**
 * Salvar comissões calculadas no Firestore
 */
export async function saveWeeklyCommissions(commissions: DriverWeeklyCommission[]): Promise<void> {
  try {
    const batch = adminDb.batch();

    for (const commission of commissions) {
      const docRef = adminDb.collection('commissions').doc();
      batch.set(docRef, commission);
    }

    await batch.commit();
    console.log(`[saveWeeklyCommissions] Salvas ${commissions.length} comissões`);
  } catch (error) {
    console.error(`[saveWeeklyCommissions] Erro:`, error);
    throw error;
  }
}

/**
 * Buscar comissões de um motorista em um período
 */
export async function getDriverCommissions(
  driverId: string,
  startDate: string,
  endDate: string
): Promise<DriverWeeklyCommission[]> {
  try {
    const snapshot = await adminDb
      .collection('commissions')
      .where('driverId', '==', driverId)
      .where('weekStart', '>=', startDate)
      .where('weekStart', '<=', endDate)
      .orderBy('weekStart', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as DriverWeeklyCommission);
  } catch (error) {
    console.error(`[getDriverCommissions] Erro:`, error);
    return [];
  }
}

/**
 * Calcular comissões totais acumuladas de um motorista
 */
export async function getTotalCommissionsEarned(driverId: string): Promise<number> {
  try {
    const snapshot = await adminDb
      .collection('commissions')
      .where('driverId', '==', driverId)
      .get();

    let total = 0;
    snapshot.docs.forEach(doc => {
      const commission = doc.data() as DriverWeeklyCommission;
      total += commission.totalCommission || 0;
    });

    return total;
  } catch (error) {
    console.error(`[getTotalCommissionsEarned] Erro:`, error);
    return 0;
  }
}

