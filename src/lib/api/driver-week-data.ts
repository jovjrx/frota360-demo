/**
 * FUNÇÃO CENTRALIZADA PARA DADOS SEMANAIS DE MOTORISTA
 * 
 * ARQUITETURA:
 * - Dados de plataformas (uber, bolt, combustível, portagens) → sempre do dataWeekly
 * - Dados fixos (aluguel, financiamento, pagamento) → salvos em driverWeeklyRecords
 * - Junta tudo na hora de retornar
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { APP_CONFIG } from '@/lib/config';
import { getFinancialConfig, isWeekEligibleByStart } from '@/lib/finance/config';
import { getBonusForDriverWeek, markBonusAsPaid } from '@/lib/referral/bonus-calculator';
import { calculateExtraCommission } from '@/lib/commission/extra-calculator';
import { computeDriverGoals } from '@/lib/goals/service';
import { isDriverAdminFeeExempt } from '@/lib/finance/admin-fee-exemption';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import type { DriverPayment } from '@/schemas/driver-payment';

interface DataWeeklyEntry {
  driverId: string | null;
  driverName: string | null;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  platform: 'uber' | 'bolt' | 'myprio' | 'viaverde';
  totalValue: number; // Campo correto no Firestore
  amount?: number; // Compatibilidade
  importedAt?: string;
}

interface FinancingEntry {
  type: 'loan' | 'discount';
  amount: number;
  weeks?: number;
  weeklyInterest: number;
  remainingWeeks?: number;
}

interface DataWeeklyValues {
  uberTotal: number;
  boltTotal: number;
  combustivel: number;
  viaverde: number;
  ganhosTotal: number;
  ivaValor: number;
  ganhosMenosIVA: number;
  despesasAdm: number;
}

/**
 * Buscar valores do dataWeekly (sempre atualizados)
 */
async function getDataWeeklyValues(driverId: string, weekId: string): Promise<DataWeeklyValues | null> {
  const snapshot = await adminDb
    .collection('dataWeekly')
    .where('driverId', '==', driverId)
    .where('weekId', '==', weekId)
    .get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const entries = snapshot.docs.map(doc => doc.data() as DataWeeklyEntry);
  
  console.log(`[getDataWeeklyValues] ${driverId} - ${weekId}: Encontrados ${entries.length} registros`, 
    entries.map(e => ({ platform: e.platform, totalValue: e.totalValue }))
  );
  
  // Agregar por plataforma
  const totals = entries.reduce((acc, entry) => {
    const value = entry.totalValue || entry.amount || 0; // Suporta ambos os campos
    switch (entry.platform) {
      case 'uber':
        acc.uber += value;
        break;
      case 'bolt':
        acc.bolt += value;
        break;
      case 'myprio':
        acc.myprio += value;
        break;
      case 'viaverde':
        acc.viaverde += value;
        break;
    }
    return acc;
  }, { uber: 0, bolt: 0, myprio: 0, viaverde: 0 });
  
  const ganhosTotal = totals.uber + totals.bolt;
  const ivaValor = ganhosTotal * 0.06;
  const ganhosMenosIVA = ganhosTotal - ivaValor;
  const despesasAdm = ganhosMenosIVA * 0.07;
  
  console.log(`[getDataWeeklyValues] ${driverId} - ${weekId}:`, totals);
  
  return {
    uberTotal: totals.uber,
    boltTotal: totals.bolt,
    combustivel: totals.myprio,
    viaverde: totals.viaverde,
    ganhosTotal,
    ivaValor,
    ganhosMenosIVA,
    despesasAdm,
  };
}

/**
 * Buscar financiamentos ativos
 */
async function getActiveFinancing(driverId: string): Promise<FinancingEntry[]> {
  const snapshot = await adminDb
    .collection('financing')
    .where('driverId', '==', driverId)
    .where('status', '==', 'active')
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      type: data.type,
      amount: data.amount,
      weeks: data.weeks,
      weeklyInterest: data.weeklyInterest || 0,
      remainingWeeks: data.remainingWeeks,
      // manter referência mínima para elegibilidade
      startDate: data.startDate,
      status: data.status,
    };
  });
}

/**
 * Criar registro inicial com dados fixos
 * ⚠️ IMPORTANTE: Verifica se já existe pagamento em driverPayments
 *    Se existe, marca como 'paid' - NÃO sobrescreve dados
 */
async function createDriverRecord(driverId: string, weekId: string): Promise<any> {
  const recordId = `${driverId}_${weekId}`;
  
  // ✅ NOVO: Verificar se já existe pagamento
  const existingPaymentSnap = await adminDb
    .collection('driverPayments')
    .where('recordId', '==', recordId)
    .limit(1)
    .get();
  
  const hasExistingPayment = !existingPaymentSnap.empty;
  
  const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
  if (!driverDoc.exists) {
    throw new Error(`Motorista não encontrado: ${driverId}`);
  }
  
  const driverData = driverDoc.data()!;
  const driverName = driverData.fullName || `${driverData.firstName || ''} ${driverData.lastName || ''}`.trim();
  const driverEmail = driverData.email || '';
  const isLocatario = driverData.type === 'renter';
  
  // Buscar datas
  const dataWeeklySnapshot = await adminDb
    .collection('dataWeekly')
    .where('driverId', '==', driverId)
    .where('weekId', '==', weekId)
    .limit(1)
    .get();
  
  const weekStart = dataWeeklySnapshot.empty ? '' : dataWeeklySnapshot.docs[0].data().weekStart;
  const weekEnd = dataWeeklySnapshot.empty ? '' : dataWeeklySnapshot.docs[0].data().weekEnd;
  
  // Aluguel
  let aluguel = 0;
  if (isLocatario && driverData.rentalFee) {
    aluguel = driverData.rentalFee;
  }
  
  // Financiamento
  const financingEntries = await getActiveFinancing(driverId);
  
  let totalInstallment = 0;
  let totalInterestAmount = 0;
  let totalInterestPercent = 0;
  
  for (const fin of financingEntries) {
    if (typeof fin.remainingWeeks === 'number' && fin.remainingWeeks <= 0) {
      continue;
    }
    
    let installment = 0;
    if (fin.type === 'loan' && fin.weeks && fin.weeks > 0) {
      installment = fin.amount / fin.weeks;
    } else if (fin.type === 'discount') {
      installment = fin.amount;
    }
    
    const interestPercent = fin.weeklyInterest || 0;
    const interestAmount = installment * (interestPercent / 100);
    
    totalInstallment += installment;
    totalInterestAmount += interestAmount;
    if (interestPercent > 0) totalInterestPercent += interestPercent;
  }
  
  const totalFinancingCost = totalInstallment + totalInterestAmount;
  
  // ✅ NOVO: Se tem pagamento, usar status 'paid' e puxar info do pagamento
  let initialPaymentStatus: 'pending' | 'paid' = 'pending';
  let initialPaymentDate: string | null = null;
  let initialPaymentInfo: any = null;
  
  if (hasExistingPayment) {
    initialPaymentStatus = 'paid';
    const paymentData = existingPaymentSnap.docs[0].data();
    initialPaymentDate = paymentData.paymentDate || null;
    initialPaymentInfo = {
      paymentId: existingPaymentSnap.docs[0].id,
      paymentDate: paymentData.paymentDate,
      totalAmount: paymentData.totalAmount,
      adminFeeValue: paymentData.adminFeeValue,
    };
    
    console.log(`[createDriverRecord] Pagamento já existe para ${recordId} - marcando como paid`);
  }
  
  const record = {
    driverId,
    driverName,
    driverEmail,
    weekStart,
    weekEnd,
    isLocatario,
    aluguel,
    financingDetails: {
      interestPercent: totalInterestPercent,
      installment: totalInstallment,
      interestAmount: totalInterestAmount,
      totalCost: totalFinancingCost,
      hasFinancing: totalInstallment > 0
    },
    iban: driverData.iban || driverData.banking?.iban || null,
    paymentStatus: initialPaymentStatus,
    paymentDate: initialPaymentDate,
    ...(initialPaymentInfo && { paymentInfo: initialPaymentInfo }),
    createdAt: new Date().toISOString(),
  };
  
  await adminDb
    .collection('driverWeeklyRecords')
    .doc(recordId)
    .set(record, { merge: true });
  
  console.log(`[createDriverRecord] Criado: ${recordId} (status: ${initialPaymentStatus})`);
  
  return record;
}

/**
 * Buscar dados completos do motorista
 */
export async function getDriverWeekData(
  driverId: string, 
  weekId: string,
  forceRefresh: boolean = false
): Promise<DriverWeeklyRecord | null> {
  
  try {
    // 1. Valores ATUAIS do dataWeekly
    const dataWeeklyValues = await getDataWeeklyValues(driverId, weekId);
    
    if (!dataWeeklyValues) {
      console.log(`[getDriverWeekData] Sem dados no dataWeekly para ${driverId} semana ${weekId}`);
      return null;
    }
    
  // 2. Registro salvo (dados fixos)
    const recordId = `${driverId}_${weekId}`;
    const savedRecordDoc = await adminDb
      .collection('driverWeeklyRecords')
      .doc(recordId)
      .get();
    
    let savedRecord = savedRecordDoc.exists ? savedRecordDoc.data() : null;

    let latestPayment: DriverPayment | null = null;
    
    // 3. Criar somente se NÃO existe
    //    Importante: não recriar em forceRefresh para não sobrescrever paymentStatus 'paid'
    if (!savedRecord) {
      console.log(`[getDriverWeekData] Criando record para ${driverId} semana ${weekId}`);
      savedRecord = await createDriverRecord(driverId, weekId);
    }

    if (savedRecord?.paymentStatus === 'paid') {
      try {
        if (savedRecord?.paymentInfo?.paymentId) {
          const paymentDoc = await adminDb
            .collection('driverPayments')
            .doc(savedRecord.paymentInfo.paymentId)
            .get();

          if (paymentDoc.exists) {
            latestPayment = paymentDoc.data() as DriverPayment;
          }
        }

        if (!latestPayment) {
          const paymentSnapshot = await adminDb
            .collection('driverPayments')
            .where('recordId', '==', recordId)
            .orderBy('updatedAt', 'desc')
            .limit(1)
            .get();

          if (!paymentSnapshot.empty) {
            latestPayment = paymentSnapshot.docs[0].data() as DriverPayment;
          }
        }
      } catch (paymentError) {
        console.warn(`[getDriverWeekData] Não foi possível buscar payment para ${recordId}:`, paymentError);
      }
    }
    
    // 3.5 Buscar dados do motorista para driverType e vehicle
  const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
    const driverData = driverDoc.exists ? driverDoc.data() : null;
    const driverType = driverData?.type === 'renter' ? 'renter' : 'affiliate';
    const vehicle = driverData?.vehicle?.plate || driverData?.integrations?.viaverde?.key || '';
    
  // 3.9 Configuração financeira (taxa adm)
  const financialCfg = await getFinancialConfig().catch(() => ({ adminFeePercent: 7, adminFeeFixedDefault: 25 }));
  const configuredAdminFee = Math.max(0, Number(financialCfg.adminFeePercent || 7));

  // 4. JUNTAR dados
    const completeRecord: any = {
      id: recordId,
      driverId: savedRecord.driverId,
      driverName: savedRecord.driverName,
      driverEmail: savedRecord.driverEmail,
      weekId,
      weekStart: savedRecord.weekStart,
      weekEnd: savedRecord.weekEnd,
      isLocatario: savedRecord.isLocatario,
      
      // Campos extras para UI
      driverType,
      vehicle,
      platformData: [], // Array vazio, dados agora vêm direto dos campos
      
      // DO DATAWEEKLY (sempre atualizados)
      uberTotal: dataWeeklyValues.uberTotal,
      boltTotal: dataWeeklyValues.boltTotal,
      prio: dataWeeklyValues.combustivel,
      combustivel: dataWeeklyValues.combustivel,
      viaverde: dataWeeklyValues.viaverde,
      ganhosTotal: dataWeeklyValues.ganhosTotal,
      ivaValor: dataWeeklyValues.ivaValor,
      ganhosMenosIVA: dataWeeklyValues.ganhosMenosIVA,
  // Aplicaremos a taxa adm configurada ao final (pode diferir de 7%)
  despesasAdm: dataWeeklyValues.despesasAdm,
  // Comissão extra (nova): calculada conforme configuração global (pode evoluir para override por motorista)
  commissionPercent: 0,
  commissionAmount: 0,
      
      // DO RECORD (fixos)
      aluguel: savedRecord.aluguel || 0,
  financingDetails: savedRecord.financingDetails,
      totalDespesas:
        dataWeeklyValues.combustivel
        + dataWeeklyValues.viaverde
        + (savedRecord.aluguel || 0)
        + (savedRecord.financingDetails?.totalCost || 0),

      // Repasse considera todas as despesas do motorista, incluindo portagens
      // Comissão (se existir) será adicionada mais abaixo
      repasse: dataWeeklyValues.ganhosMenosIVA
        - dataWeeklyValues.despesasAdm
        - dataWeeklyValues.combustivel
        - dataWeeklyValues.viaverde
        - (savedRecord.aluguel || 0)
        - (savedRecord.financingDetails?.totalCost || 0),

      // Pagamento
      iban: savedRecord.iban || driverData?.iban || driverData?.banking?.iban || null,
      paymentStatus: savedRecord.paymentStatus || 'pending',
      paymentDate: savedRecord.paymentDate || null,
      ...(savedRecord.paymentInfo && { paymentInfo: savedRecord.paymentInfo }),

      // Metadados
      dataSource: 'auto',
      createdAt: savedRecord.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(savedRecord.notes && { notes: savedRecord.notes }),
    };

    // Aplicar cálculo dinâmico do financiamento por semana (feature flag)
    try {
      const financialCfg = await getFinancialConfig();
      const dyn = financialCfg.financing?.dynamicCalculation ?? true;
      const eligibilityPolicy = financialCfg.financing?.eligibilityPolicy || 'startDateToWeekEnd';

      if (dyn) {
        const activeFinancings = await adminDb
          .collection('financing')
          .where('driverId', '==', driverId)
          .where('status', '==', 'active')
          .get();

        let totalInstallment = 0;
        let totalInterestAmount = 0;
        let hasAny = false;

        activeFinancings.docs.forEach((doc) => {
          const f = doc.data() as any;
          const eligible = isWeekEligibleByStart(f.startDate, savedRecord.weekStart, savedRecord.weekEnd, eligibilityPolicy);
          if (!eligible) return;
          if (f.type === 'loan') {
            const weeks = Number(f.weeks || 0);
            const remaining = Number(f.remainingWeeks || 0);
            if (weeks > 0 && remaining > 0) {
              const installment = Number(f.amount || 0) / weeks;
              const interest = installment * (Number(f.weeklyInterest || 0) / 100);
              totalInstallment += installment;
              totalInterestAmount += interest;
              hasAny = true;
            }
          } else if (f.type === 'discount') {
            const installment = Number(f.amount || 0);
            const interest = installment * (Number(f.weeklyInterest || 0) / 100);
            totalInstallment += installment;
            totalInterestAmount += interest;
            hasAny = true;
          }
        });

        const totalFinancingCost = totalInstallment + totalInterestAmount;

        completeRecord.financingDetails = {
          interestPercent: 0, // percentual agregado não é crucial; manter 0 para não confundir
          installment: totalInstallment,
          interestAmount: totalInterestAmount,
          totalCost: totalFinancingCost,
          hasFinancing: hasAny,
        };

        // Atualizar despesas totais e repasse conforme novo financiamento
        completeRecord.totalDespesas = dataWeeklyValues.combustivel
          + dataWeeklyValues.viaverde
          + (savedRecord.aluguel || 0)
          + totalFinancingCost;

        completeRecord.repasse = dataWeeklyValues.ganhosMenosIVA
          - completeRecord.despesasAdm
          - dataWeeklyValues.combustivel
          - dataWeeklyValues.viaverde
          - (savedRecord.aluguel || 0)
          - totalFinancingCost;
      }
    } catch (e) {
      console.warn('[getDriverWeekData] Falha no cálculo dinâmico de financiamento:', e);
    }

    // Aplicar Taxa Adm (customizada por motorista ou padrão global)
    try {
      let finalAdminFee = 0;
      
      // Verificar se motorista tem taxa customizada
      if (driverData?.adminFee) {
        if (driverData.adminFee.mode === 'fixed') {
          // Taxa fixa em euros (ex: 25€)
          const fixedValue = driverData.adminFee.fixedValue ?? financialCfg.adminFeeFixedDefault ?? 25;
          finalAdminFee = Math.max(0, Number(fixedValue));
        } else {
          // Taxa percentual customizada
          const customPercent = driverData.adminFee.percentValue ?? configuredAdminFee;
          finalAdminFee = completeRecord.ganhosMenosIVA * (customPercent / 100);
        }
      } else {
        // PADRÃO: Taxa fixa de €25 (não mais percentual)
        // Isso faz com que novos motoristas usem €25 fixo por semana
        const fixedDefault = financialCfg.adminFeeFixedDefault ?? 25;
        finalAdminFee = Math.max(0, Number(fixedDefault));
      }

      // ✅ VERIFICAR ISENÇÃO: Se motorista está isento, finalAdminFee = 0
      const weekDate = new Date(savedRecord.weekStart);
      const isExempt = await isDriverAdminFeeExempt(driverId, weekDate);
      if (isExempt) {
        console.log(`[getDriverWeekData] Motorista ${driverId} isento de taxa adm para semana ${weekId}`);
        finalAdminFee = 0;
      }
      
      const delta = finalAdminFee - completeRecord.despesasAdm;
      if (Math.abs(delta) > 0.0001) {
        completeRecord.despesasAdm = finalAdminFee;
        completeRecord.repasse = completeRecord.repasse - delta; // aumentar taxa adm diminui repasse
      }
    } catch (e) {
      console.warn('[getDriverWeekData] Falha ao aplicar taxa adm configurada:', e);
    }


    // Aplicar comissão extra se habilitada em config
    try {
      const extraCommission = await calculateExtraCommission(driverId, driverType, completeRecord);
      if (extraCommission.enabled && extraCommission.commissionAmount > 0) {
        completeRecord.commissionPercent = extraCommission.mode === 'percent' ? extraCommission.percent : 0;
        completeRecord.commissionAmount = extraCommission.commissionAmount;
        // Comissão é bônus do motorista: soma ao repasse (não altera despesas)
        completeRecord.repasse = completeRecord.repasse + extraCommission.commissionAmount;
      }
    } catch (e) {
      console.warn('[getDriverWeekData] Falha ao aplicar comissão extra:', e);
    }

    // Adicionar metas/recompensas semanais (rewards/goals)
    try {
      // Para cálculo correto, usar ganhos brutos e viagens da semana
      const ganhosBrutos = completeRecord.ganhosTotal || 0;
      // Se viagens não está disponível, pode ser necessário buscar de outro campo
      const viagens = completeRecord.viagens || completeRecord.totalViagens || 0;
      // Timestamp da semana (usar início da semana)
      const dataSemana = completeRecord.weekStart ? new Date(completeRecord.weekStart).getTime() : Date.now();
      completeRecord.goals = await computeDriverGoals(driverId, completeRecord.driverName || '', ganhosBrutos, viagens, dataSemana);
      
      // Injetar metas/recompensas semanais no repasse
      let goalsBonus = 0;
      if (Array.isArray(completeRecord.goals)) {
        completeRecord.goals.forEach((goal: any) => {
          if (goal.atingido && goal.valorGanho > 0) {
            goalsBonus += goal.valorGanho;
          }
        });
      }
      
      if (goalsBonus > 0) {
        completeRecord.repasse += goalsBonus;
        // Armazenar valor de metas para transparência
        (completeRecord as any).goalsBonus = goalsBonus;
      }
    } catch (e) {
      console.warn('[getDriverWeekData] Falha ao calcular metas/recompensas semanais:', e);
      completeRecord.goals = [];
    }

    if (latestPayment) {
      completeRecord.paymentInfo = latestPayment;
    }

    // Comissão de afiliados (multinível): busca total de bônus PAYABLE e adiciona ao repasse
    try {
      const affiliateBonus = await getBonusForDriverWeek(driverId, weekId);
      if (affiliateBonus && affiliateBonus.total > 0) {
        completeRecord.commissionAmount = (completeRecord.commissionAmount || 0) + affiliateBonus.total;
        completeRecord.repasse = completeRecord.repasse + affiliateBonus.total;
        // Marcar bônus como PAID após injetar no repasse
        await markBonusAsPaid(driverId, weekId);
        // opcional: anexar detalhes para UI/exports
        (completeRecord as any).affiliateBonusDetails = affiliateBonus.details;
      }
    } catch (e) {
      console.warn('[getDriverWeekData] Falha ao obter bônus de afiliados:', e);
    }
    
    return completeRecord;
    
  } catch (error) {
    console.error(`[getDriverWeekData] Erro ${driverId} semana ${weekId}:`, error);
    throw error;
  }
}

/**
 * Buscar múltiplos motoristas para uma semana
 */
export async function getAllDriversWeekData(
  weekId: string,
  forceRefresh: boolean = false
): Promise<DriverWeeklyRecord[]> {
  
  const dataWeeklySnapshot = await adminDb
    .collection('dataWeekly')
    .where('weekId', '==', weekId)
    .get();
  
  const driverIds = Array.from(new Set(
    dataWeeklySnapshot.docs.map(doc => doc.data().driverId)
  )).filter(id => id);
  
  console.log(`[getAllDriversWeekData] Processando ${driverIds.length} motoristas para semana ${weekId}`);
  
  const results = await Promise.all(
    driverIds.map(driverId => getDriverWeekData(driverId, weekId, forceRefresh))
  );
  
  return results.filter(r => r !== null) as DriverWeeklyRecord[];
}

