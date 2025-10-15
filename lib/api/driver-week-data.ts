/**
 * FUNÇÃO CENTRALIZADA PARA DADOS SEMANAIS DE MOTORISTA
 * 
 * ARQUITETURA:
 * - Dados de plataformas (uber, bolt, combustível, portagens) → sempre do dataWeekly
 * - Dados fixos (aluguel, financiamento, pagamento) → salvos em driverWeeklyRecords
 * - Junta tudo na hora de retornar
 */

import { adminDb } from '@/lib/firebaseAdmin';
import type { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';

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
      remainingWeeks: data.remainingWeeks
    };
  });
}

/**
 * Criar registro inicial com dados fixos
 */
async function createDriverRecord(driverId: string, weekId: string): Promise<any> {
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
    paymentStatus: 'pending',
    paymentDate: null,
    createdAt: new Date().toISOString(),
  };
  
  const recordId = `${driverId}_${weekId}`;
  await adminDb
    .collection('driverWeeklyRecords')
    .doc(recordId)
    .set(record, { merge: true });
  
  console.log(`[createDriverRecord] Criado: ${recordId}`);
  
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
    
    // 3. Criar se não existe
    if (!savedRecord || forceRefresh) {
      console.log(`[getDriverWeekData] Criando record para ${driverId} semana ${weekId}`);
      savedRecord = await createDriverRecord(driverId, weekId);
    }
    
    // 3.5 Buscar dados do motorista para driverType e vehicle
    const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
    const driverData = driverDoc.exists ? driverDoc.data() : null;
    const driverType = driverData?.type === 'renter' ? 'renter' : 'affiliate';
    const vehicle = driverData?.vehicle?.plate || driverData?.integrations?.viaverde?.key || '';
    
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
      despesasAdm: dataWeeklyValues.despesasAdm,
      
      // DO RECORD (fixos)
      aluguel: savedRecord.aluguel || 0,
      financingDetails: savedRecord.financingDetails,
      totalDespesas: dataWeeklyValues.combustivel + dataWeeklyValues.viaverde + (savedRecord.aluguel || 0),
      
      // Repasse
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
