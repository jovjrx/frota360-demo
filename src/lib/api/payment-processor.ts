/**
 * Processador de Pagamentos Semanais
 * Este é o ÚNICO lugar onde os dados são processados e driverPayments é criado
 * Invocado apenas da aba DADOS (WeeklyDataTabContent)
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { getAdminFeeConfig, computeAdminFeeForDriver, AdminFeeConfig } from '@/lib/finance/admin-fee';
import { DriverPayment, ProcessingResult } from '@/types/driver-payment';

export async function processWeeklyPayments(weekId: string): Promise<ProcessingResult[]> {
  const results: ProcessingResult[] = [];
  // Carregar configuração global uma vez
  const adminFeeConfig = await getAdminFeeConfig();

  try {
    // 1. Buscar dataWeekly desta semana
    const weeklySnap = await adminDb
      .collection('dataWeekly')
      .where('weekId', '==', weekId)
      .get();

    console.log(`[process-payments] 📊 Encontrados ${weeklySnap.size} registros em dataWeekly para ${weekId}`);

    if (weeklySnap.empty) {
      console.log(`⚠️ Nenhum registro em dataWeekly para ${weekId}. Nada a processar.`);
      return results;
    }

    // 2. Carregar TODOS os motoristas e construir mapas de busca
    const driversSnap = await adminDb.collection('drivers').get();
    const driversById = new Map<string, any>();
    const driversByUber = new Map<string, any>();
    const driversByBolt = new Map<string, any>();
    const driversByMyPrio = new Map<string, any>();
    const driversByPlate = new Map<string, any>();

    driversSnap.docs.forEach(doc => {
      const driver = { id: doc.id, ...doc.data() } as any;
      driversById.set(doc.id, driver);

      const integrations = (driver?.integrations || {}) as any;
      
      // Uber UUID
      const uberKey = typeof integrations.uber === 'string' 
        ? integrations.uber 
        : integrations.uber?.key;
      if (uberKey) driversByUber.set(uberKey.toLowerCase(), driver);

      // Bolt email
      const boltKey = typeof integrations.bolt === 'string'
        ? integrations.bolt
        : integrations.bolt?.key;
      if (boltKey) driversByBolt.set(boltKey.toLowerCase(), driver);

      // MyPrio cartão
      const myprioKey = typeof integrations.myprio === 'string'
        ? integrations.myprio
        : integrations.myprio?.key;
      if (myprioKey) driversByMyPrio.set(myprioKey.toLowerCase(), driver);

      // Placa do veículo (para MyPrio e ViaVerde)
      const plate = (driver?.vehicle as any)?.plate;
      if (plate) {
        const cleanPlate = plate.toLowerCase().replace(/[^a-z0-9]/g, '');
        driversByPlate.set(cleanPlate, driver);
      }
    });

    console.log(`[process-payments] 📋 Mapas criados: ${driversById.size} motoristas, ${driversByUber.size} Uber, ${driversByBolt.size} Bolt, ${driversByMyPrio.size} MyPrio, ${driversByPlate.size} placas`);

    // 3. Agrupar entradas por driverId (com fallback automático)
    const entriesByDriver = new Map<string, any[]>();
    let mappedCount = 0;
    let fallbackCount = 0;
    let skippedCount = 0;
    
    weeklySnap.docs.forEach((doc) => {
      const data = doc.data() as any;
      let driver: any = null;
      let mappingMethod = '';

      // Tentar usar driverId direto
      if (data.driverId && typeof data.driverId === 'string' && data.driverId.length > 0) {
        driver = driversById.get(data.driverId);
        if (driver) {
          mappedCount++;
          mappingMethod = 'driverId direto';
        }
      }

      // FALLBACK: Tentar mapear pelo referenceId (UUID/email/cartão) ou placa
      if (!driver && data.referenceId) {
        const refId = data.referenceId.toLowerCase();
        
        if (data.platform === 'uber') {
          driver = driversByUber.get(refId);
          if (driver) {
            fallbackCount++;
            mappingMethod = 'Uber UUID';
          }
        } else if (data.platform === 'bolt') {
          driver = driversByBolt.get(refId);
          if (driver) {
            fallbackCount++;
            mappingMethod = 'Bolt email';
          }
        } else if (data.platform === 'myprio') {
          driver = driversByMyPrio.get(refId);
          if (driver) {
            fallbackCount++;
            mappingMethod = 'MyPrio cartão';
          }
        }
      }

      // FALLBACK 2: Tentar pela placa (para MyPrio e ViaVerde)
      if (!driver && data.vehiclePlate) {
        const cleanPlate = data.vehiclePlate.toLowerCase().replace(/[^a-z0-9]/g, '');
        driver = driversByPlate.get(cleanPlate);
        if (driver) {
          fallbackCount++;
          mappingMethod = 'placa veículo';
        }
      }

      if (!driver) {
        skippedCount++;
        console.log(`⚠️ Registro NÃO MAPEADO: plataforma=${data.platform}, ref=${data.referenceId}, placa=${data.vehiclePlate || 'N/A'}, nome=${data.driverName || 'N/A'}`);
        return;
      }

      if (!entriesByDriver.has(driver.id)) {
        entriesByDriver.set(driver.id, []);
      }
      entriesByDriver.get(driver.id)!.push({ id: doc.id, ...data });
      
      if (fallbackCount <= 5) { // Mostrar apenas os primeiros 5 para não poluir
        console.log(`   ✅ Mapeado ${driver.fullName || driver.name} via ${mappingMethod}`);
      }
    });

    console.log(`\n[process-payments] 📊 MAPEAMENTO:`);
    console.log(`   ✅ ${mappedCount} registros mapeados diretamente (driverId)`);
    console.log(`   🔄 ${fallbackCount} registros mapeados via fallback (UUID/email/placa)`);
    console.log(`   ❌ ${skippedCount} registros ignorados (não encontrado)`);
    console.log(`   👥 ${entriesByDriver.size} motoristas com dados\n`);

    if (entriesByDriver.size === 0) {
      console.log(`❌ PROBLEMA: Nenhum motorista foi mapeado dos ${weeklySnap.size} registros.`);
      console.log(`💡 SOLUÇÃO: Verifique os cadastros de integrações (Uber UUID, Bolt email, MyPrio cartão, placas)`);
      return results;
    }

    // 4. Para cada motorista com dados: filtrar ativos e processar
    for (const [driverId, entries] of entriesByDriver.entries()) {
      const driver = driversById.get(driverId);
      
      if (!driver) {
        console.log(`⚠️ Driver ${driverId} não encontrado (bug interno - ${entries.length} registros ignorados)`);
        continue;
      }
      
      // Filtrar ativo
      const isActive = driver?.status === 'active' || driver?.isActive === true;
      if (!isActive) {
        console.log(`⚠️ Driver ${driver.fullName || driver.name} (${driverId}) está INATIVO - ignorando ${entries.length} registros`);
        continue;
      }

      console.log(`\n✅ Processando ${driver.fullName || driver.name} (${driverId}): ${entries.length} registros`);

      try {
        const payment = await processDriverPaymentFromEntries(driver, weekId, adminFeeConfig, entries);
        if (payment) {
          console.log(`   💰 Pagamento criado: repasse=€${payment.repasse.toFixed(2)}, financiamento=${payment.financingDetails ? '€' + payment.financingDetails.displayAmount.toFixed(2) : 'N/A'}`);
          results.push({
            success: true,
            driverId: driver.id,
            driverName: driver.fullName || driver.name,
            weekId,
            payment,
          });
        } else {
          console.log(`   ⚠️ Nenhum pagamento gerado (provavelmente sem dados válidos)`);
        }
      } catch (error: any) {
        console.error(`   ❌ ERRO ao processar ${driver.fullName || driver.name}: ${error.message}`);
        results.push({
          success: false,
          driverId: driver.id,
          driverName: driver.fullName || driver.name,
          weekId,
          error: error.message,
        });
      }
    }

    console.log(`\n[process-payments] 📊 RESUMO FINAL:`);
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📝 Total processado: ${results.length} motoristas`);
    
    if (errorCount > 0) {
      console.log(`\n⚠️ MOTORISTAS COM ERRO:`);
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.driverName}: ${r.error}`);
      });
    }
    console.log();

    return results;
  } catch (error: any) {
    console.error(`❌ Erro ao processar pagamentos da semana ${weekId}:`, error);
    throw error;
  }
}

async function processDriverPaymentFromEntries(driver: any, weekId: string, adminFeeConfig: AdminFeeConfig, weeklyData: any[]): Promise<DriverPayment | null> {
  if (!Array.isArray(weeklyData) || weeklyData.length === 0) {
    console.log(`⚠️ Nenhum dataWeekly para motorista ${driver.id} semana ${weekId}`);
    return null;
  }

  console.log(`   🔍 Processando ${weeklyData.length} entradas para ${driver.fullName || driver.name}`);

  // 2. Calcular ganhos por integração
  const ganhosPorIntegracao: Record<string, number> = {
    uber: 0,
    bolt: 0,
    myprio: 0,
    viaverde: 0,
  };

  weeklyData.forEach((data: any) => {
    const value = data.totalValue || 0;
    ganhosPorIntegracao[data.platform] = (ganhosPorIntegracao[data.platform] || 0) + value;
    console.log(`      - ${data.platform}: €${value.toFixed(2)}`);
  });

  console.log(`   💰 Totais: Uber=€${ganhosPorIntegracao.uber.toFixed(2)}, Bolt=€${ganhosPorIntegracao.bolt.toFixed(2)}, Combustível=€${ganhosPorIntegracao.myprio.toFixed(2)}, Portagens=€${ganhosPorIntegracao.viaverde.toFixed(2)}`);

  const ganhosTotal = Object.values(ganhosPorIntegracao).reduce((a, b) => a + b, 0);
  const ivaValor = ganhosTotal * 0.06; // 6% IVA
  const ganhosMenosIVA = ganhosTotal - ivaValor;

  // 3. **TAXA ADM** - Usar função centralizada e configurável
  // Combustível e Portagens serão considerados na base, assim como aluguel e financiamento

  // 4. **COMBUSTÍVEL E PORTAGENS**
  const combustivel = ganhosPorIntegracao['myprio'] || 0;
  const portagensRaw = ganhosPorIntegracao['viaverde'] || 0;
  const driverType: 'renter' | 'affiliate' = (driver?.type === 'renter' || driver?.isLocatario) ? 'renter' : 'affiliate';
  const portagens = driverType === 'renter' ? portagensRaw : 0; // ViaVerde apenas para locatários

  // 5. **ALUGUEL** (se locatário)
  const aluguel = driverType === 'renter' ? (driver.rentalFee || 0) : 0;

  // 6. **FINANCIAMENTO** - Buscar empréstimos ativos
  let financingDetails: any = null;
  const financingSnap = await adminDb
    .collection('financing')
  .where('driverId', '==', driver.id)
    .get();

  console.log(`   💳 Financiamentos encontrados: ${financingSnap.size}`);

  if (!financingSnap.empty) {
    // Pode haver múltiplos financiamentos: agregamos semanal e juros percentuais
    const financings = financingSnap.docs
      .map(d => d.data() as any)
      .filter(f => {
        const status = f?.status || 'active';
        const isCompleted = status === 'completed';
        if (isCompleted) {
          console.log(`      ⏭️ Financiamento concluído ignorado: €${f?.amount || 0}`);
        }
        return !isCompleted;
      });

    console.log(`   💳 Financiamentos ativos: ${financings.length}`);

    let totalWeekly = 0;
    let totalWeeklyInterestPercent = 0;
    let hasLoanType = false;
    let totalAmount = 0;
    for (const raw of financings) {
      const f = {
        ...raw,
        type: raw?.type || ((typeof raw?.weeks === 'number' && raw.weeks > 0) ? 'loan' : 'discount'),
      } as any;
      if (f.type === 'loan') hasLoanType = true;
      if (typeof f?.amount === 'number') totalAmount += f.amount;
      totalWeeklyInterestPercent += Number(f?.weeklyInterest || 0);
      let weekly = 0;
      if (typeof f?.weeklyAmount === 'number' && f.weeklyAmount > 0) {
        weekly = Number(f.weeklyAmount) || 0;
        console.log(`      ✓ weeklyAmount definido: €${weekly.toFixed(2)}`);
      } else if (f.type === 'loan' && f?.amount > 0) {
        const w = Number((f.remainingWeeks ?? f.weeks) || 0);
        weekly = w > 0 ? (Number(f.amount) || 0) / w : 0;
        console.log(`      ✓ loan: amount=€${f.amount}, weeks=${w} → parcela=€${weekly.toFixed(2)}`);
      } else if (f.type === 'discount') {
        weekly = Number(f.amount) || 0;
        console.log(`      ✓ discount: €${weekly.toFixed(2)}`);
      } else {
        console.log(`      ✗ Não conseguiu calcular! weeklyAmount=${f?.weeklyAmount}, type=${f?.type}, amount=${f?.amount}, weeks=${f?.weeks}`);
      }
      totalWeekly += weekly;
    }
    const interestAmount = Math.round((totalWeekly * totalWeeklyInterestPercent / 100) * 100) / 100;
    const weeklyWithFees = Math.round((totalWeekly + interestAmount) * 100) / 100;
    
    console.log(`   💰 Financiamento total: parcela=€${totalWeekly.toFixed(2)}, juros=€${interestAmount.toFixed(2)}, total=€${weeklyWithFees.toFixed(2)}`);
    
    financingDetails = {
      type: hasLoanType ? 'loan' : 'discount',
      amount: totalAmount,
      weeklyAmount: totalWeekly,
      weeklyInterest: totalWeeklyInterestPercent,
      displayAmount: weeklyWithFees,
      totalCost: weeklyWithFees,
      hasFinancing: weeklyWithFees > 0,
      isParcelado: hasLoanType,
      displayLabel: `Parcela: €${weeklyWithFees.toFixed(2)}`,
      // Campos legados/compat
      interestPercent: totalWeeklyInterestPercent,
      interestAmount,
      weeklyWithFees,
      installment: totalWeekly,
    };
  } else {
    console.log(`   ℹ️ Nenhum financiamento ativo para este motorista`);
    // ✅ IMPORTANTE: Definir como objeto vazio (não undefined) para evitar erro no Firestore
    financingDetails = {
      type: 'discount',
      amount: 0,
      weeklyAmount: 0,
      weeklyInterest: 0,
      displayAmount: 0,
      totalCost: 0,
      hasFinancing: false,
      isParcelado: false,
      displayLabel: 'Sem financiamento',
      interestPercent: 0,
      interestAmount: 0,
      weeklyWithFees: 0,
      installment: 0,
    };
  }

  // 3b. **TAXA ADM** depende também de financiamento (parcela+juros) e aluguel
  const financingCostForBase = financingDetails?.weeklyWithFees || financingDetails?.totalCost || 0;
  const feeCtx = {
    ganhosBrutos: ganhosTotal,
    ivaValor,
    combustivel,
    portagens,
  aluguel: driverType === 'renter' ? (driver.rentalFee || 0) : 0,
    financiamentoTotal: financingCostForBase,
  };
  const despesasAdm = computeAdminFeeForDriver(driver, adminFeeConfig, feeCtx).fee;

  // 7. **BÔNUS META** - Verificar se elegível
  let bonusMetaAmount = 0;
  const goalsSnap = await adminDb
    .collection('goals')
    .where('driverId', '==', driver.id)
    .where('status', '==', 'active')
    .get();

  if (!goalsSnap.empty) {
    const goal = goalsSnap.docs[0].data() as any;
    // Verificar se atingiu meta desta semana
    if (goal.weeklyTarget && ganhosTotal >= goal.weeklyTarget) {
      bonusMetaAmount = goal.bonusAmount || 0;
      console.log(`   🎯 BÔNUS META: atingiu meta de €${goal.weeklyTarget.toFixed(2)} → Bônus de €${bonusMetaAmount.toFixed(2)}`);
    } else {
      console.log(`   ℹ️ Bônus meta: Ganhos €${ganhosTotal.toFixed(2)} < Meta €${goal.weeklyTarget?.toFixed(2) || 'N/A'} → sem bônus`);
    }
  } else {
    console.log(`   ℹ️ Sem metas ativas`);
  }

  // 8. **BÔNUS INDICAÇÃO** - Verificar motoristas indicados
  let bonusReferralAmount = 0;
  const referralSnap = await adminDb
    .collection('drivers')
    .where('referredBy', '==', driver.id)
    .where('isApproved', '==', true)
    .get();

  if (!referralSnap.empty) {
    // Bônus por cada motorista indicado e aprovado
    bonusReferralAmount = referralSnap.size * 25; // €25 por referência
    console.log(`   👥 BÔNUS INDICAÇÃO: ${referralSnap.size} motorista(s) indicado(s) → €${bonusReferralAmount.toFixed(2)}`);
  } else {
    console.log(`   ℹ️ Sem motoristas indicados ou aprovados`);
  }

  // 9. **COMISSÃO**
  const commissionAmount = (driver.commission?.percent || 0) > 0 
    ? (ganhosTotal * (driver.commission.percent / 100))
    : 0;
  
  if (commissionAmount > 0) {
    console.log(`   💼 COMISSÃO: ${driver.commission.percent}% de €${ganhosTotal.toFixed(2)} → €${commissionAmount.toFixed(2)}`);
  } else {
    console.log(`   ℹ️ Sem comissão configurada`);
  }

  // 10. **CALCULAR REPASSE**
  // IMPORTANTE: Financiamento DESCONTA do repasse!
  const financingDeduction = financingDetails?.totalCost || 0;
  const totalDespesas = combustivel + portagens + aluguel + despesasAdm + financingDeduction;
  const repasse = ganhosMenosIVA - totalDespesas + bonusMetaAmount + bonusReferralAmount + commissionAmount;
  
  console.log(`   📝 CÁLCULO FINAL DO REPASSE:`);
  console.log(`      Base: €${ganhosMenosIVA.toFixed(2)} (ganhos - IVA)`);
  console.log(`      - Combustível: €${combustivel.toFixed(2)}`);
  console.log(`      - Portagens: €${portagens.toFixed(2)}`);
  console.log(`      - Aluguel: €${aluguel.toFixed(2)}`);
  console.log(`      - Taxa Adm: €${despesasAdm.toFixed(2)}`);
  if (bonusMetaAmount > 0 || bonusReferralAmount > 0 || commissionAmount > 0) {
    console.log(`      + Bônus Meta: €${bonusMetaAmount.toFixed(2)}`);
    console.log(`      + Bônus Indicação: €${bonusReferralAmount.toFixed(2)}`);
    console.log(`      + Comissão: €${commissionAmount.toFixed(2)}`);
  }
  console.log(`      = REPASSE FINAL: €${repasse.toFixed(2)}`);
  if (financingDetails?.weeklyAmount) {
    console.log(`      (+ Financiamento €${financingDetails.weeklyAmount.toFixed(2)} + €${financingDetails.interestAmount.toFixed(2)} juros = €${financingDetails.weeklyWithFees.toFixed(2)} SEPARADO)`);
  }

  // 11. **CRIAR DOCUMENTO driverPayments**
  const paymentRef = adminDb.collection('driverPayments').doc(`${driver.id}_${weekId}`);
  
  const payment: DriverPayment = {
    id: paymentRef.id,
    recordId: `${driver.id}_${weekId}`,
    driverId: driver.id,
    driverName: driver.fullName || driver.name,
    weekId,
    // capturar datas da própria semana a partir de dataWeekly
    weekStart: (weeklyData[0]?.weekStart) || new Date().toISOString().split('T')[0],
    weekEnd: (weeklyData[0]?.weekEnd) || new Date().toISOString().split('T')[0],
    currency: 'EUR',
    baseAmount: repasse,
    baseAmountCents: Math.round(repasse * 100),
    bonusAmount: 0,
    bonusCents: 0,
    discountAmount: 0,
    discountCents: 0,
    totalAmount: repasse,
    totalAmountCents: Math.round(repasse * 100),
    iban: driver.banking?.iban,
    paymentDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    adminFeePercentage: driver.adminFee?.mode === 'percent' ? driver.adminFee.percentValue : 0,
    adminFeeValue: despesasAdm,
    adminFeeCents: Math.round(despesasAdm * 100),
    combustivel,
    portagens,
    aluguel,
    // ✅ ADICIONADO: Uber e Bolt salvos também no nível principal
    uberTotal: ganhosPorIntegracao['uber'] || 0,
    boltTotal: ganhosPorIntegracao['bolt'] || 0,
    // Conveniência: armazenar campos que facilitam enriquecimento/preview
    ganhosTotal,
    ivaValor,
    ganhosMenosIVA,
    despesasAdm,
    financingDetails, // ✅ Agora sempre é um objeto, nunca undefined
    bonusMetaAmount,
    bonusReferralAmount,
    commissionAmount,
    repasse,
    recordSnapshot: {
      // APENAS dados de INPUT (necessários para reprocessar se houver bug)
      driverId: driver.id,
      driverName: driver.fullName || driver.name,
      weekId,
      type: driverType,
      // Dados calculados completos
      ganhosTotal,
      uberTotal: ganhosPorIntegracao['uber'] || 0,
      boltTotal: ganhosPorIntegracao['bolt'] || 0,
      prio: ganhosPorIntegracao['myprio'] || 0,
      ivaValor,
      ganhosMenosIVA,
      combustivel,
      viaverde: portagens,
      aluguel,
      despesasAdm,
      commissionAmount,
      bonusMetaAmount,
      bonusReferralAmount,
      totalDespesas,
      repasse,
      // Financiamento COMPLETO
      financingDetails,
      bonusMetaPending: [],
      referralBonusPending: [],
      totalBonusAmount: bonusMetaAmount + bonusReferralAmount,
      bonusMetaPaid: [],
      referralBonusPaid: [],
      isLocatario: driverType === 'renter',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any,
    paymentStatus: 'pending' as const,
  };

  // 12. **SALVAR em driverPayments**
  await paymentRef.set(payment);
  
  console.log(`   ✅ Documento salvo em driverPayments/${paymentRef.id}`);
  console.log(`   📊 Valores: Ganhos=€${ganhosTotal.toFixed(2)}, IVA=€${ivaValor.toFixed(2)}, Líquido=€${ganhosMenosIVA.toFixed(2)}`);
  console.log(`   💸 Despesas: Adm=€${despesasAdm.toFixed(2)}, Comb=€${combustivel.toFixed(2)}, Portagens=€${portagens.toFixed(2)}, Aluguel=€${aluguel.toFixed(2)}`);
  if (financingDetails) {
    console.log(`   💳 Financiamento: Parcela=€${financingDetails.weeklyAmount.toFixed(2)}, Juros=${financingDetails.weeklyInterest}%, Total=€${financingDetails.totalCost.toFixed(2)}`);
  }
  console.log(`   💰 REPASSE FINAL: €${repasse.toFixed(2)}\n`);

  return payment;
}
