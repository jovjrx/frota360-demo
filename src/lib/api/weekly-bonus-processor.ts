/**
 * WEEKLY BONUS PROCESSOR
 * Processa bonus meta, indicação e comissão para cada semana
 * 
 * FLUXO:
 * 1. Fase 2 (Processamento): Cria registros pending em driverPayments
 * 2. Fase 3 (Pagamento): Move pending → paid em bonusHistorico
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { getActiveRewards, computeDriverGoals } from '@/lib/goals/service';

export interface BonusMetaPending {
  rewardId: string;
  description: string;
  criteria: 'ganho' | 'viagens';
  type: 'valor' | 'percentual';
  amount: number;
  baseValue: number;
  achieved: boolean;
  createdAt: string;
}

export interface ReferralBonusPending {
  referralId: string;
  referredDriverId: string;
  referredDriverName: string;
  recruitedWeeksCompleted: number;
  minimumWeeksRequired: number;
  amount: number;
  eligible: boolean;
  createdAt: string;
}

export interface CommissionPending {
  isFleetManager: boolean;
  subordinateDrivers: Array<{
    driverId: string;
    driverName: string;
    weekEarnings: number;
    commissionRate: number;
    commissionAmount: number;
  }>;
  totalCommission: number;
  createdAt: string;
}

// ============================================================================
// 1. BONUS META
// ============================================================================

/**
 * Calcula bonus de meta para motorista na semana
 */
export async function calculateBonusMetaForWeek(
  driverId: string,
  driverName: string,
  weekId: string,
  weekStart: string,
  ganhosTotal: number,
  totalTrips: number
): Promise<BonusMetaPending[]> {
  try {
    const weekStartDate = new Date(weekStart).getTime();
    const rewards = await getActiveRewards();

    const metaBonuses: BonusMetaPending[] = [];

    for (const reward of rewards) {
      // Verifica se meta está ativa
      if (reward.dataInicio && weekStartDate < reward.dataInicio) {
        continue;
      }

      let baseValue = 0;
      let achieved = false;
      let bonusAmount = 0;

      if (reward.criterio === 'ganho') {
        baseValue = ganhosTotal;
        achieved = ganhosTotal >= reward.valor;
      } else if (reward.criterio === 'viagens') {
        baseValue = totalTrips;
        achieved = totalTrips >= reward.valor;
      }

      if (achieved) {
        bonusAmount =
          reward.tipo === 'valor'
            ? reward.valor
            : reward.tipo === 'percentual'
            ? ganhosTotal * (reward.valor / 100)
            : 0;
      }

      if (bonusAmount > 0) {
        metaBonuses.push({
          rewardId: `${reward.nivel}-${reward.criterio}`,
          description: reward.descricao || `Meta ${reward.criterio}`,
          criteria: reward.criterio,
          type: reward.tipo,
          amount: bonusAmount,
          baseValue,
          achieved,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (metaBonuses.length > 0) {
      console.log(`✅ Bonus meta para ${driverName} (${weekId}): ${metaBonuses.length} meta(s) atingida(s)`);
    }

    return metaBonuses;
  } catch (error) {
    console.error(`❌ Erro ao calcular bonus meta para ${driverId}:`, error);
    return [];
  }
}

// ============================================================================
// 2. BONUS INDICAÇÃO
// ============================================================================

/**
 * Calcula bonus de indicação para motorista
 * Verifica se motoristas indicados completaram semanas mínimas
 */
export async function calculateReferralBonusForWeek(
  driverId: string,
  driverName: string,
  weekId: string
): Promise<ReferralBonusPending[]> {
  try {
    const referralBonuses: ReferralBonusPending[] = [];

    // Buscar configuração de semanas mínimas
    const settingsDoc = await adminDb.doc('settings/referral').get();
    const settings = settingsDoc.data() as any;
    const minimumWeeksRequired = settings?.minimumWeeksForBonus || 4;
    const bonusAmountPerReferral = settings?.bonusPerReferral || 50; // €50

    // Buscar rede de afiliação
    const networkDoc = await adminDb
      .collection('affiliateNetwork')
      .where('recruitedBy', '==', driverId)
      .where('status', '==', 'active')
      .get();

    if (networkDoc.empty) {
      return [];
    }

    // Para cada motorista indicado
    for (const doc of networkDoc.docs) {
      const referredDriver = doc.data() as any;
      const referredDriverId = referredDriver.driverId;
      const referredDriverName = referredDriver.driverName;

      // Contar semanas completadas pelo indicado
      const weeksCount = await adminDb
        .collection('driverPayments')
        .where('driverId', '==', referredDriverId)
        .where('status', '==', 'paid')
        .get();

      const recruitedWeeksCompleted = weeksCount.size;
      const eligible = recruitedWeeksCompleted >= minimumWeeksRequired;

      if (eligible) {
        referralBonuses.push({
          referralId: `ref-${referredDriverId}`,
          referredDriverId,
          referredDriverName,
          recruitedWeeksCompleted,
          minimumWeeksRequired,
          amount: bonusAmountPerReferral,
          eligible: true,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Também registra não-elegível para auditoria
        referralBonuses.push({
          referralId: `ref-${referredDriverId}`,
          referredDriverId,
          referredDriverName,
          recruitedWeeksCompleted,
          minimumWeeksRequired,
          amount: 0,
          eligible: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (referralBonuses.filter(b => b.eligible).length > 0) {
      console.log(
        `✅ Bonus indicação para ${driverName}: ${referralBonuses.filter(b => b.eligible).length} indicado(s) elegível(is)`
      );
    }

    return referralBonuses;
  } catch (error) {
    console.error(`❌ Erro ao calcular bonus indicação para ${driverId}:`, error);
    return [];
  }
}

// ============================================================================
// 3. COMISSÃO
// ============================================================================

/**
 * Calcula comissão para gestor de frota
 * Verifica subordinados e calcula comissão sobre ganhos deles
 */
export async function calculateCommissionForWeek(
  driverId: string,
  driverName: string,
  weekId: string
): Promise<CommissionPending | null> {
  try {
    // Verificar se é gestor de frota
    const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
    const driverData = driverDoc.data() as any;
    const isFleetManager = driverData?.type === 'fleet_manager';

    if (!isFleetManager) {
      return null;
    }

    // Buscar configuração de comissão
    const settingsDoc = await adminDb.doc('settings/commission').get();
    const settings = settingsDoc.data() as any;
    const commissionRate = settings?.rate || 0.05; // 5% default

    // Buscar subordinados (motoristas nessa frota)
    const hierarchyDoc = await adminDb
      .collection('affiliateHierarchy')
      .where('ancestorIds', 'array-contains', driverId)
      .get();

    if (hierarchyDoc.empty) {
      return null;
    }

    const subordinateDrivers: CommissionPending['subordinateDrivers'] = [];
    let totalCommission = 0;

    for (const doc of hierarchyDoc.docs) {
      const hierarchyData = doc.data() as any;
      const subordinateId = hierarchyData.driverId;

      // Buscar pagamento desta semana do subordinado
      const paymentSnap = await adminDb
        .collection('driverPayments')
        .where('driverId', '==', subordinateId)
        .where('weekId', '==', weekId)
        .limit(1)
        .get();

      if (!paymentSnap.empty) {
        const payment = paymentSnap.docs[0].data() as any;
        const weekEarnings = payment.totalAmount || 0;
        const commission = weekEarnings * commissionRate;

        subordinateDrivers.push({
          driverId: subordinateId,
          driverName: payment.driverName || 'Desconhecido',
          weekEarnings,
          commissionRate,
          commissionAmount: commission,
        });

        totalCommission += commission;
      }
    }

    if (totalCommission > 0) {
      console.log(`✅ Comissão para ${driverName}: €${totalCommission.toFixed(2)} sobre ${subordinateDrivers.length} motorista(s)`);

      return {
        isFleetManager: true,
        subordinateDrivers,
        totalCommission,
        createdAt: new Date().toISOString(),
      };
    }

    return null;
  } catch (error) {
    console.error(`❌ Erro ao calcular comissão para ${driverId}:`, error);
    return null;
  }
}

// ============================================================================
// 4. CONSOLIDAÇÃO (usado em getProcessedWeeklyRecords fase 2)
// ============================================================================

export interface WeeklyBonusBundle {
  bonusMetaPending: BonusMetaPending[];
  referralBonusPending: ReferralBonusPending[];
  commissionPending: CommissionPending | null;
  bonusMetaAmount: number; // Valor total de bônus meta
  bonusReferralAmount: number; // Valor total de bônus referência
  commissionAmount: number; // Valor total de comissão
  totalBonusAmount: number; // Soma de todos os bonus elegíveis
}

/**
 * Processa todos os 3 tipos de bonus para um motorista em uma semana
 */
export async function calculateAllBonusesForWeek(
  driverId: string,
  driverName: string,
  weekId: string,
  weekStart: string,
  ganhosTotal: number,
  totalTrips: number
): Promise<WeeklyBonusBundle> {
  const [bonusMetaPending, referralBonusPending, commissionPending] = await Promise.all([
    calculateBonusMetaForWeek(driverId, driverName, weekId, weekStart, ganhosTotal, totalTrips),
    calculateReferralBonusForWeek(driverId, driverName, weekId),
    calculateCommissionForWeek(driverId, driverName, weekId),
  ]);

  // Calcular total de bonus elegíveis
  const metaTotal = bonusMetaPending.reduce((sum, b) => sum + b.amount, 0);
  const referralTotal = referralBonusPending
    .filter(b => b.eligible)
    .reduce((sum, b) => sum + b.amount, 0);
  const commissionTotal = commissionPending?.totalCommission || 0;
  const totalBonusAmount = metaTotal + referralTotal + commissionTotal;

  return {
    bonusMetaPending,
    referralBonusPending,
    commissionPending,
    bonusMetaAmount: metaTotal,
    bonusReferralAmount: referralTotal,
    commissionAmount: commissionTotal,
    totalBonusAmount,
  };
}

// ============================================================================
// 5. HISTÓRICO (usado em fase 3, quando marca como pago)
// ============================================================================

/**
 * Cria registros históricos em bonusMetaHistorico quando pagamento é confirmado
 */
export async function saveBonusMetaHistory(
  driverId: string,
  weekId: string,
  bonuses: BonusMetaPending[],
  paymentId: string
): Promise<string[]> {
  const createdIds: string[] = [];

  for (const bonus of bonuses.filter(b => b.achieved)) {
    const docRef = adminDb.collection('bonusMetaHistorico').doc();
    await docRef.set({
      id: docRef.id,
      driverId,
      weekId,
      rewardId: bonus.rewardId,
      description: bonus.description,
      amount: bonus.amount,
      status: 'paid',
      paymentId,
      createdAt: bonus.createdAt,
      paidAt: new Date().toISOString(),
    });
    createdIds.push(docRef.id);
  }

  return createdIds;
}

/**
 * Cria registros históricos em referralBonusHistorico quando pagamento é confirmado
 */
export async function saveReferralBonusHistory(
  driverId: string,
  weekId: string,
  bonuses: ReferralBonusPending[],
  paymentId: string
): Promise<string[]> {
  const createdIds: string[] = [];

  for (const bonus of bonuses.filter(b => b.eligible)) {
    const docRef = adminDb.collection('referralBonusHistorico').doc();
    await docRef.set({
      id: docRef.id,
      driverId,
      referredDriverId: bonus.referredDriverId,
      referredDriverName: bonus.referredDriverName,
      weekId,
      amount: bonus.amount,
      recruitedWeeksCompleted: bonus.recruitedWeeksCompleted,
      status: 'paid',
      paymentId,
      createdAt: bonus.createdAt,
      paidAt: new Date().toISOString(),
    });
    createdIds.push(docRef.id);
  }

  return createdIds;
}

/**
 * Cria registros históricos em commissionHistorico quando pagamento é confirmado
 */
export async function saveCommissionHistory(
  driverId: string,
  weekId: string,
  commission: CommissionPending,
  paymentId: string
): Promise<string | null> {
  if (!commission || commission.totalCommission <= 0) {
    return null;
  }

  const docRef = adminDb.collection('commissionHistorico').doc();
  await docRef.set({
    id: docRef.id,
    gestorId: driverId,
    weekId,
    subordinateDrivers: commission.subordinateDrivers,
    totalCommission: commission.totalCommission,
    status: 'paid',
    paymentId,
    createdAt: commission.createdAt,
    paidAt: new Date().toISOString(),
  });

  return docRef.id;
}
