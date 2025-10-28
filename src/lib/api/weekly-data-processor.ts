import { adminDb } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';
import { calculateAllBonusesForWeek } from '@/lib/api/weekly-bonus-processor';
import { getAdminFeeConfig, computeAdminFeeForDriver } from '@/lib/finance/admin-fee';

interface DriverInfo {
  id: string;
  name: string;
  type: 'affiliate' | 'renter';
  rentalFee: number;
  adminFee?: any; // Regra de taxa customizada (se houver)
  integrations?: {
    uber?: string | null;
    bolt?: string | null;
    myprio?: string | null;
    viaverde?: string | null;
  };
}

/**
 * Processa dados de uma semana do dataWeekly
 * Parâmetro único lugar para mudanças!
 * 
 * @param weekId - semana a processar
 * @param driverId - (opcional) se definido, retorna apenas este motorista
 * @param forceRefresh - (opcional) força recalcular mesmo se pago
 * 
 * USO:
 * - Admin weekly: getProcessedWeeklyRecords(weekId) → todos os motoristas
 * - Admin dashboard: getProcessedWeeklyRecords(weekId) + getProcessedWeeklyRecords(previousWeekId) → 2 chamadas
 * - Driver page: getProcessedWeeklyRecords(weekId, driverId) → apenas este motorista
 */
export async function getProcessedWeeklyRecords(
  weekId: string,
  driverId?: string,
  forceRefresh: boolean = false
): Promise<DriverWeeklyRecord[]> {
  if (!weekId) {
    return [];
  }

  try {
    // ✅ PRIORIDADE 1: SEMPRE buscar de driverPayments PRIMEIRO (paid ou pending)
    // Se existe aqui, NÃO processa de dataWeekly, pois já foi processado uma vez
    const existingPayments = new Map<string, DriverWeeklyRecord>();
    
    if (!forceRefresh) {
      let paymentQuery = adminDb
        .collection('driverPayments')
        .where('weekId', '==', weekId);
      
      if (driverId) {
        paymentQuery = paymentQuery.where('driverId', '==', driverId);
      }
      
      const paymentsSnap = await paymentQuery.get();
      
      // Mapear TODOS os payments (paid ou pending) por (driverId + weekId)
      paymentsSnap.docs.forEach(doc => {
        const payment = doc.data() as any;
        if (payment.driverId && payment.weekId) {
          // Se há dados em recordSnapshot, converter para DriverWeeklyRecord
          if (payment.recordSnapshot) {
            const snapshot = payment.recordSnapshot;
            const key = `${payment.driverId}_${payment.weekId}`;
            
            console.log(`   ✅ Usando dados de driverPayments: ${payment.driverName} (${payment.paymentStatus})`);
            // Montar registro base a partir do snapshot
            const rec: DriverWeeklyRecord = {
                id: snapshot.id || `${payment.weekId}_${payment.driverId}`,
                driverId: payment.driverId,
                driverName: payment.driverName,
                weekId: payment.weekId,
                weekStart: payment.weekStart,
                weekEnd: payment.weekEnd,
                type: snapshot.type || 'affiliate',
                ganhosTotal: snapshot.ganhosTotal || 0,
                uberTotal: snapshot.uberTotal || 0,
                boltTotal: snapshot.boltTotal || 0,
                prio: snapshot.prio || 0,
                ivaValor: snapshot.ivaValor || 0,
                ganhosMenosIVA: (typeof snapshot.ganhosMenosIVA === 'number'
                  ? snapshot.ganhosMenosIVA
                  : (typeof snapshot.ganhosTotal === 'number' && typeof snapshot.ivaValor === 'number'
                      ? (snapshot.ganhosTotal - snapshot.ivaValor)
                      : 0)),
                despesasAdm: snapshot.despesasAdm || 0,
                commissionAmount: snapshot.commissionAmount || 0,
                combustivel: snapshot.combustivel || 0,
                viaverde: snapshot.viaverde || 0,
                aluguel: snapshot.aluguel || 0,
                financingDetails: snapshot.financingDetails,
                totalDespesas: snapshot.totalDespesas || 0,
                repasse: snapshot.repasse || 0,
                bonusMetaPending: snapshot.bonusMetaPending || [],
                referralBonusPending: snapshot.referralBonusPending || [],
                commissionPending: snapshot.commissionPending,
                totalBonusAmount: snapshot.totalBonusAmount || 0,
                bonusMetaPaid: snapshot.bonusMetaPaid || [],
                referralBonusPaid: snapshot.referralBonusPaid || [],
                paymentStatus: (payment.paymentStatus || 'pending') as 'paid' | 'pending' | 'cancelled',
                createdAt: snapshot.createdAt || new Date().toISOString(),
                updatedAt: snapshot.updatedAt || new Date().toISOString(),
                dataSource: snapshot.dataSource || 'payment',
                isLocatario: snapshot.isLocatario || false,
            } as DriverWeeklyRecord;

            // ✅ Fallback: se não houver financingDetails no snapshot, derivar parcela pela identidade do repasse
            if (!rec.financingDetails) {
              const ganhosMenosIVA = Number(rec.ganhosMenosIVA || 0);
              const despesasAdm = Number(rec.despesasAdm || 0);
              const combustivel = Number(rec.combustivel || 0);
              const viaverde = Number(rec.viaverde || 0);
              const aluguel = Number(rec.aluguel || 0);
              const repasse = Number(rec.repasse || 0);
              const derived = ganhosMenosIVA - despesasAdm - combustivel - viaverde - aluguel - repasse;
              if (isFinite(derived) && derived > 0) {
                rec.financingDetails = {
                  installment: derived,
                  totalCost: derived,
                  hasFinancing: true,
                  displayAmount: derived,
                  displayLabel: `Parcela: €${derived.toFixed(2)}`,
                } as any;
              }
            }

            existingPayments.set(key, rec);
          }
        }
      });
    }
    
    // Se todos os registros já foram encontrados em driverPayments, retorna logo
    if (existingPayments.size > 0) {
      const records = Array.from(existingPayments.values());
      console.log(`[API Weekly Data] Retornando ${records.length} registros de driverPayments (não recalculando)`);
      return records;
    }

  // Buscar dados normalizados da semana
    let query = adminDb
      .collection('dataWeekly')
      .where('weekId', '==', weekId);
    
    // Se driverId definido, filtra para apenas este motorista
    if (driverId) {
      query = query.where('driverId', '==', driverId);
    }
    
    const normalizedSnapshot = await query.get();

    if (normalizedSnapshot.empty) {
      return [];
    }

    const normalizedData: WeeklyNormalizedData[] = normalizedSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as WeeklyNormalizedData),
    }));

    console.log(`   Dados por plataforma:`);
    const platformSummary = normalizedData.reduce((acc, entry) => {
      if (!acc[entry.platform]) acc[entry.platform] = { count: 0, total: 0 };
      acc[entry.platform].count++;
      acc[entry.platform].total += entry.totalValue || 0;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);
    
    Object.entries(platformSummary).forEach(([platform, data]) => {
      console.log(`      ${platform}: ${data.count} registros, €${data.total.toFixed(2)}`);
    });

    // Buscar motoristas
  const driversSnapshot = await adminDb.collection('drivers').get();
  const driversById = new Map<string, DriverInfo>();
  const driversByUber = new Map<string, DriverInfo>();
  const driversByBolt = new Map<string, DriverInfo>();
  const driversByMyPrio = new Map<string, DriverInfo>();
  const driversByPlate = new Map<string, DriverInfo>();

    driversSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const displayName = (
        data.fullName ||
        data.name ||
        [data.firstName, data.lastName].filter(Boolean).join(' ').trim() ||
        data.driverName ||
        data.email ||
        'Desconhecido'
      );
      const driver: DriverInfo = {
        id: doc.id,
        name: displayName,
        type: (data.type === 'renter' || data.isLocatario) ? 'renter' : 'affiliate',
        rentalFee: typeof data.rentalFee === 'number' ? data.rentalFee : 0,
        integrations: data.integrations || {}
      };

      driversById.set(doc.id, driver);
      
      const uberKey = typeof data.integrations?.uber === 'string'
        ? data.integrations.uber
        : (data.integrations?.uber?.key || undefined);
      const boltKey = typeof data.integrations?.bolt === 'string'
        ? data.integrations.bolt
        : (data.integrations?.bolt?.key || undefined);
      const myprioKey = typeof data.integrations?.myprio === 'string'
        ? data.integrations.myprio
        : (data.integrations?.myprio?.key || undefined);

      if (uberKey && typeof uberKey === 'string') {
        driversByUber.set(uberKey.toLowerCase(), driver);
      }
      if (boltKey && typeof boltKey === 'string') {
        driversByBolt.set(boltKey.toLowerCase(), driver);
      }
      if (myprioKey && typeof myprioKey === 'string') {
        driversByMyPrio.set(myprioKey.toLowerCase(), driver);
      }
      if (data.vehicle?.plate && typeof data.vehicle.plate === 'string') {
        driversByPlate.set(data.vehicle.plate.toLowerCase().replace(/[^a-z0-9]/g, ''), driver);
      }
    });

    // Buscar financiamentos (considerar ativos e também docs sem campo status)
    // Observação: alguns documentos antigos não possuem 'status'; tratamos como 'active'
    const financingSnapshot = await adminDb
      .collection('financing')
      .get();
    
    const financingByDriver = new Map();
    financingSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const driverId = data.driverId;
      if (!driverId) return;
      const status = data.status || 'active';
      if (status && typeof status === 'string' && status.toLowerCase() === 'completed') {
        return; // ignorar concluídos
      }
      const resolvedType = (data.type
        || (typeof data.weeks === 'number' && data.weeks > 0 ? 'loan' : 'discount')) as 'loan' | 'discount';
      
      if (!financingByDriver.has(driverId)) {
        financingByDriver.set(driverId, []);
      }
      financingByDriver.get(driverId).push({
        type: resolvedType,
        amount: data.amount,
        weeks: data.weeks,
        weeklyInterest: data.weeklyInterest || 0,
        weeklyAmount: data.weeklyAmount || 0,
        remainingWeeks: data.remainingWeeks || data.weeks
      });
    });

    console.log(`[weekly-data-processor] 💳 ${financingSnapshot.size} financiamentos no total, ${financingByDriver.size} motoristas com financiamento ativo`);
    financingByDriver.forEach((list, dId) => {
      console.log(`   - Driver ${dId}: ${list.length} financiamento(s), total parcela semanal: €${list.reduce((sum: number, f: any) => sum + (f.weeklyAmount || 0), 0).toFixed(2)}`);
    });

    // Agregar dados por motorista
    const totals = new Map<string, {
      driver: DriverInfo;
      uber: number;
      bolt: number;
      combustivel: number;
      viaverde: number;
    }>();

    normalizedData.forEach((entry) => {
      let driver: DriverInfo | undefined;

      // Resolver motorista - driverId já está no entry
      if (entry.driverId) {
        driver = driversById.get(entry.driverId);
      } 
      
      // Fallback: tentar pelo referenceId (que contém o ID da plataforma)
      if (!driver && entry.referenceId) {
        if (entry.platform === 'uber') {
          driver = driversByUber.get(entry.referenceId.toLowerCase());
        } else if (entry.platform === 'bolt') {
          driver = driversByBolt.get(entry.referenceId.toLowerCase());
        } else if (entry.platform === 'myprio') {
          driver = driversByMyPrio.get(entry.referenceId.toLowerCase());
        }
      }

      // Fallback: tentar pela placa
      if (!driver && entry.vehiclePlate) {
        const cleanPlate = entry.vehiclePlate.toLowerCase().replace(/[^a-z0-9]/g, '');
        driver = driversByPlate.get(cleanPlate);
      }

      if (!driver) return;

      if (!totals.has(driver.id)) {
        totals.set(driver.id, {
          driver,
          uber: 0,
          bolt: 0,
          combustivel: 0,
          viaverde: 0
        });
      }

      const t = totals.get(driver.id)!;

      if (entry.platform === 'uber') t.uber += entry.totalValue || 0;
      else if (entry.platform === 'bolt') t.bolt += entry.totalValue || 0;
      else if (entry.platform === 'myprio') t.combustivel += entry.totalValue || 0;
      else if (entry.platform === 'viaverde') t.viaverde += entry.totalValue || 0;
    });

  // Carregar configuração de Taxa Adm (uma vez)
  const adminFeeConfig = await getAdminFeeConfig();

  // Gerar registros finais
    const records: DriverWeeklyRecord[] = [];

    const recordPromises = Array.from(totals.entries()).map(async ([driverId, t]) => {
      const ganhosTotal = t.uber + t.bolt;
      const ivaValor = ganhosTotal * 0.06;
      const ganhosMenosIVA = ganhosTotal - ivaValor;

      console.log(`\n📋 Processando ${t.driver.name}:`);
      console.log(`   driverId: ${driverId}`);
      console.log(`   driver.id: ${t.driver.id}`);
      console.log(`   ganhos: €${ganhosTotal.toFixed(2)}`);

      // ✅ NOVO: Construir platformData array
      const platformData: WeeklyNormalizedData[] = [];
      const driverEntries = normalizedData.filter(d => d.driverId === driverId);
      
      // Agrupar por plataforma
      const platformsMap = new Map<string, { count: number; total: number; driver: DriverInfo }>();
      driverEntries.forEach(entry => {
        if (!platformsMap.has(entry.platform)) {
          platformsMap.set(entry.platform, {
            count: 0,
            total: 0,
            driver: t.driver
          });
        }
        const pl = platformsMap.get(entry.platform)!;
        pl.count += 1;
        pl.total += entry.totalValue || 0;
      });

      // Converter para array
      platformsMap.forEach((data, platform) => {
        platformData.push({
          platform,
          totalValue: data.total,
          totalTrips: data.count,
          driverId: t.driver.id,
          driverName: t.driver.name,
        } as any);
      });

  let despesasAdm = 0; // calculado com base na configuração
  let commissionAmount = 0; // Nova Comissão (extra)
  let totalFinancingInterestPercent = 0;
  let totalInstallment = 0;

      // Calcular financiamento
      const driverFinancings = financingByDriver.get(driverId) || [];
      
      if (driverFinancings.length > 0) {
        console.log(`   💳 Financiamento encontrado: ${driverFinancings.length} item(ns)`);
        driverFinancings.forEach((f, idx) => {
          console.log(`      ${idx+1}. Tipo=${f.type}, Valor=€${f.amount}, weeklyAmount=${f.weeklyAmount}, weeks=${f.weeks}, remainingWeeks=${f.remainingWeeks}, Juros=${f.weeklyInterest}%`);
        });
      } else {
        console.log(`   ℹ️ Nenhum financiamento`);
      }
      
      let totalFinancingAmount = 0;
      let hasLoanType = false;
      let isParceladoAggregate = false;
      driverFinancings.forEach((f: any) => {
        if (f?.type === 'loan') hasLoanType = true;
        if (typeof f?.amount === 'number') totalFinancingAmount += f.amount;
        if (typeof f?.weeklyInterest === 'number') totalFinancingInterestPercent += Number(f?.weeklyInterest) || 0;

        // Derivar parcela semanal
        let weekly = 0;
        if (typeof f?.weeklyAmount === 'number' && f.weeklyAmount > 0) {
          weekly = Number(f.weeklyAmount) || 0;
          console.log(`         ✓ weeklyAmount definido: €${weekly.toFixed(2)}`);
        } else if (f?.type === 'loan' && f?.amount > 0) {
          const w = Number((f.remainingWeeks ?? f.weeks) || 0);
          weekly = w > 0 ? (Number(f.amount) || 0) / w : 0;
          console.log(`         ✓ loan: amount=€${f.amount}, weeks=${w} → parcela=€${weekly.toFixed(2)}`);
        } else if (f?.type === 'discount') {
          weekly = Number(f.amount) || 0; // desconto vitalício: valor é semanal
          console.log(`         ✓ discount: €${weekly.toFixed(2)}`);
        } else {
          console.log(`         ✗ Não conseguiu calcular parcela! weeklyAmount=${f?.weeklyAmount}, type=${f?.type}, amount=${f?.amount}, weeks=${f?.weeks}`);
        }
        totalInstallment += weekly;

        if (
          (typeof f?.weeks === 'number' && f.weeks > 0) ||
          (typeof f?.remainingWeeks === 'number' && f.remainingWeeks > 0) ||
          weekly > 0
        ) {
          isParceladoAggregate = true;
        }
      });

      const interestAmount = Math.round((totalInstallment * totalFinancingInterestPercent / 100) * 100) / 100;
      const weeklyWithFees = Math.round((totalInstallment + interestAmount) * 100) / 100;
      
      console.log(`   📊 Financiamento calculado:`);
      console.log(`      Parcela: €${totalInstallment.toFixed(2)}`);
      console.log(`      Juros ${totalFinancingInterestPercent}%: €${interestAmount.toFixed(2)}`);
      console.log(`      Total: €${weeklyWithFees.toFixed(2)}`);

      // Comissão Extra (global opcional) - por padrão 0
      // NOTA: este processor não lê config por design; a comissão é melhor aplicada nas rotas modernas

      const aluguel = t.driver.type === 'renter' ? t.driver.rentalFee : 0;
      // ViaVerde só desconta de locatários
      const viaverdeDesconto = t.driver.type === 'renter' ? t.viaverde : 0;

      // Calcular Taxa Adm com base configurável (pode considerar despesas e financiamento)
      const financingTotalForBase = weeklyWithFees;
      const feeCtx = {
        ganhosBrutos: ganhosTotal,
        ivaValor,
        combustivel: t.combustivel,
        portagens: viaverdeDesconto,
        aluguel,
        financiamentoTotal: financingTotalForBase,
      };
      despesasAdm = computeAdminFeeForDriver(t.driver as any, adminFeeConfig, feeCtx).fee;
      
      // ✅ FASE 2: Calcular bonus (meta, indicação, comissão)
      const bonusBundle = await calculateAllBonusesForWeek(
        driverId,
        t.driver.name,
        weekId,
        new Date().toISOString().split('T')[0], // weekStart (aproximado)
        ganhosTotal,
        normalizedData.filter(d => d.driverId === driverId).length // total de transações
      );
      
      // Total despesas = combustivel + viaverde (se locatário) + aluguel + financiamento
      const financingDeduction = financingTotalForBase || 0;
      const totalDespesas = t.combustivel + viaverdeDesconto + aluguel + financingDeduction;
      
      // Repasse = ganhos - IVA - despesasAdm - totalDespesas + bônus + comissão
      // IMPORTANTE: Financiamento desconta do repasse!
      let repasse = ganhosMenosIVA - despesasAdm - totalDespesas + (bonusBundle.bonusMetaAmount || 0) + (bonusBundle.bonusReferralAmount || 0) + commissionAmount;

      console.log(`   ${t.driver.name}: Ganhos=€${ganhosTotal.toFixed(2)}, Repasse=€${repasse.toFixed(2)}, Bonus=€${bonusBundle.totalBonusAmount.toFixed(2)}`);

      return {
        id: `${weekId}_${driverId}`,
        weekId,
        weekStart: new Date().toISOString().split('T')[0],
        weekEnd: new Date().toISOString().split('T')[0],
        driverId,
        driverName: t.driver.name,
        isLocatario: t.driver.type === 'renter',
        // ✅ ADICIONADO: type (affiliate ou renter)
        type: t.driver.type,
        ganhosTotal,
        uberTotal: t.uber,
        boltTotal: t.bolt,
        prio: t.combustivel,
        ivaValor,
        ganhosMenosIVA,
        despesasAdm,
        commissionAmount,
        // ✅ ADICIONADO: valores individuais de bônus
        // @ts-ignore - bonusMetaAmount não está no DriverWeeklyRecordSchema original
        bonusMetaAmount: bonusBundle.bonusMetaAmount || 0,
        // @ts-ignore - bonusReferralAmount não está no DriverWeeklyRecordSchema original
        bonusReferralAmount: bonusBundle.bonusReferralAmount || 0,
        combustivel: t.combustivel,
        viaverde: t.viaverde,
        aluguel,
        // ✅ ADICIONADO: financingDetails (compatível com schema)
        financingDetails: (() => {
          if (driverFinancings.length > 0) {
            const interestAmount = Math.round((totalInstallment * totalFinancingInterestPercent / 100) * 100) / 100;
            const weeklyWithFees = Math.round((totalInstallment + interestAmount) * 100) / 100;
            const hasFinancing = totalInstallment > 0 || totalFinancingAmount > 0;
            return {
              type: hasLoanType ? 'loan' as const : 'discount',
              amount: totalFinancingAmount,
              weeklyAmount: totalInstallment,
              weeklyInterest: totalFinancingInterestPercent,
              displayAmount: weeklyWithFees,
              totalCost: weeklyWithFees,
              hasFinancing,
              isParcelado: isParceladoAggregate,
              displayLabel: `Parcela: €${weeklyWithFees.toFixed(2)}`,
              // Campos legados para compatibilidade
              interestPercent: totalFinancingInterestPercent,
              installment: totalInstallment,
              interestAmount,
              weeklyWithFees,
            };
          }
          // Sem docs de financiamento: ainda retornar objeto padrão (0)
          return {
            type: 'discount' as const,
            amount: 0,
            weeklyAmount: 0,
            weeklyInterest: 0,
            displayAmount: 0,
            totalCost: 0,
            hasFinancing: false,
            isParcelado: false,
            displayLabel: 'Sem financiamento',
            // Campos legados
            interestPercent: 0,
            installment: 0,
            interestAmount: 0,
            weeklyWithFees: 0,
          };
        })(),
        totalDespesas,
        repasse,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        dataSource: 'auto',
        // ✅ ADICIONADO: platformData (Uber, Bolt, MyPrio)
        platformData: platformData.length > 0 ? platformData : undefined,
        // ✅ NOVO: Bonus armazenados no record (pending)
        bonusMetaPending: (bonusBundle.bonusMetaPending || []).map((b: any) => ({
          id: b.rewardId || b.id || 'unknown',
          amount: b.amount || 0,
          criteria: b.criteria || 'ganho',
          criteriaValue: b.baseValue || 0,
          description: b.description || '',
        })),
        referralBonusPending: (bonusBundle.referralBonusPending || []).map((r: any) => ({
          id: r.referralId || r.id || 'unknown',
          referredDriverId: r.referredDriverId || '',
          referredDriverName: r.referredDriverName || '',
          amount: r.amount || 0,
          weeksCompleted: r.recruitedWeeksCompleted || 0,
          minimumWeeksRequired: r.minimumWeeksRequired || 0,
          description: r.description || '',
        })),
        commissionPending: bonusBundle.commissionPending ? {
          id: (bonusBundle.commissionPending as any).commissionId || 'unknown',
          amount: (bonusBundle.commissionPending as any).amount || 0,
          rate: (bonusBundle.commissionPending as any).rate || 0,
          subordinatesCount: (bonusBundle.commissionPending as any).subordinatesCount || 0,
          description: (bonusBundle.commissionPending as any).description || '',
        } : undefined,
        totalBonusAmount: bonusBundle.totalBonusAmount || 0,
        // Bonuses paid (inicialmente vazios)
        bonusMetaPaid: [],
        referralBonusPaid: [],
      } as DriverWeeklyRecord;
    });

    const resolvedRecords = await Promise.all(recordPromises);
    records.push(...resolvedRecords);

    return records;
    
  } catch (error) {
    console.error(`Erro ao processar registros da semana ${weekId}:`, error);
    return [];
  }
}

/**
 * Busca os IDs das últimas N semanas disponíveis no dataWeekly
 */
export async function getAvailableWeekIds(limit: number = 10): Promise<string[]> {
  try {
    const snapshot = await adminDb
      .collection('dataWeekly')
      .orderBy('weekId', 'desc')
      .limit(100)
      .get();

    const weekIds = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.weekId) {
        weekIds.add(data.weekId);
      }
    });
    
    const sortedWeekIds = Array.from(weekIds)
      .sort()
      .reverse()
      .slice(0, limit);
    
    return sortedWeekIds;
  } catch (error) {
    console.error('Erro ao buscar semanas disponíveis:', error);
    return [];
  }
}

