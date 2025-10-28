import { adminDb } from '@/lib/firebaseAdmin';
import { getProcessedWeeklyRecords } from '@/lib/api/weekly-data-processor';

/**
 * Busca os dados do motorista no Firestore
 */
export async function getDriverData(driverId: string) {
  try {
    // Buscar motorista pelo email (driverId é o email)
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', driverId)
      .limit(1)
      .get();

    if (driversSnapshot.empty) {
      return null;
    }

    const driverDoc = driversSnapshot.docs[0];
    const driverData = driverDoc.data();

    // Verificar se está ativo
    if (driverData.status !== 'active') {
      return null;
    }

    // Retornar dados do motorista (mesmo formato da API)
    return {
      id: driverDoc.id,
      
      // Dados pessoais
      firstName: driverData.firstName || '',
      lastName: driverData.lastName || '',
      fullName: driverData.fullName || `${driverData.firstName} ${driverData.lastName}`,
      email: driverData.email || '',
      phone: driverData.phone || '',
      birthDate: driverData.birthDate || null,
      city: driverData.city || '',
      
      // Status
      status: driverData.status || 'pending',
      type: driverData.type || 'affiliate',
      
      // Dados bancários (IBAN mascarado)
      banking: {
        iban: driverData.banking?.iban 
          ? maskIban(driverData.banking.iban) 
          : null,
        accountHolder: driverData.banking?.accountHolder || null,
      },
      
      // Veículo (se locatário)
      vehicle: driverData.type === 'renter' ? {
        plate: driverData.vehicle?.plate || null,
        model: driverData.vehicle?.model || null,
        assignedDate: driverData.vehicle?.assignedDate || null,
      } : null,
      
      // Aluguel (se locatário)
      rentalFee: driverData.type === 'renter' ? (driverData.rentalFee || 0) : 0,
      
      // Datas
      createdAt: driverData.createdAt || null,
      activatedAt: driverData.activatedAt || null,
    };

  } catch (error) {
    console.error('Erro ao buscar dados do motorista:', error);
    return null;
  }
}

/**
 * Busca os contracheques do motorista
 */
/**
 * Busca os contracheques do motorista
 * ATUALIZADO: Usa função centralizada getDriverWeekData para sempre ter dados frescos
 */
export async function getDriverContracheques(driverId: string, limit: number = 12) {
  try {
    // Buscar ID real do motorista (document ID) a partir do email
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', driverId)
      .limit(1)
      .get();

    if (driversSnapshot.empty) {
      return [];
    }

    const driverDoc = driversSnapshot.docs[0];
    const realDriverId = driverDoc.id;

    // Buscar contracheques diretamente de driverPayments (FONTE ÚNICA)
    let query = adminDb
      .collection('driverPayments')
      .where('driverId', '==', realDriverId) as FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;

    const snap = await query.get();

    // Ordenar por weekStart desc em memória e limitar
    const sorted = snap.docs
      .map((doc) => ({ id: doc.id, data: doc.data() }))
      .sort((a, b) => {
        const aDate = new Date(a.data.weekStart || a.data.createdAt || 0).getTime();
        const bDate = new Date(b.data.weekStart || b.data.createdAt || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, limit);

    // Utilitário: mascarar IBAN se vier completo
    const maskIban = (iban?: string | null) => {
      if (!iban) return null;
      if (iban.length < 6) return iban;
      const first4 = iban.substring(0, 4);
      const last2 = iban.substring(iban.length - 2);
      const middle = '*'.repeat(Math.max(0, iban.length - 6));
      const masked = first4 + middle + last2;
      return masked.match(/.{1,4}/g)?.join(' ') || masked;
    };

    const contracheques = sorted.map(({ id, data }) => {
      const financing = data.financingDetails || data.recordSnapshot?.financingDetails || null;
      const proof = data.proofUrl
        ? {
            proofUrl: data.proofUrl as string,
            proofFileName: (data.proofFileName as string) || null,
          }
        : null;

      return {
        id,
        weekId: data.weekId,
        weekStart: data.weekStart || null,
        weekEnd: data.weekEnd || null,

        // Receitas e cálculos (conveniência no top-level em driverPayments)
        uberTotal: data.uberTotal || 0,
        boltTotal: data.boltTotal || 0,
        ganhosTotal: data.ganhosTotal || 0,
        ivaValor: data.ivaValor || 0,
        ganhosMenosIVA: data.ganhosMenosIVA || 0,
        despesasAdm: data.despesasAdm || 0,

        // Despesas
        combustivel: data.combustivel || 0,
        viaverde: data.portagens || data.viaverde || 0,
        aluguel: data.aluguel || 0,
        totalDespesas: data.totalDespesas || 0,

        // Repasse
        repasse: data.totalAmount ?? data.baseAmount ?? data.repasse ?? 0,

        // Pagamento
        iban: maskIban(data.iban || null),
        paymentStatus: (data.paymentStatus as string) || 'paid',
        paymentDate: data.paymentDate || null,
        paymentInfo: proof || null,

        // Financiamento (para detalhamento no modal)
        financingDetails: financing
          ? {
              interestPercent: financing.interestPercent || financing.weeklyInterest || 0,
              installment: financing.installment || financing.weeklyAmount || 0,
              interestAmount: financing.interestAmount || 0,
              totalCost: financing.totalCost || financing.displayAmount || financing.weeklyWithFees || financing.installment || 0,
              hasFinancing: Boolean(financing.hasFinancing ?? ((financing.installment || financing.weeklyAmount || 0) > 0)),
            }
          : null,

        // Metadados
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
      };
    });

    return contracheques;
  } catch (error) {
    console.error('[getDriverContracheques] Erro ao buscar contracheques:', error);
    return [];
  }
}

/**
 * Busca contratos pendentes de assinatura do motorista
 * SSR: para mostrar no dashboard
 */
export async function getDriverContracts(driverId: string, limit: number = 5) {
  try {
    // Buscar ID real do motorista pelo email
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', driverId)
      .limit(1)
      .get();

    if (driversSnapshot.empty) {
      return [];
    }

    const realDriverId = driversSnapshot.docs[0].id;

    // Buscar contratos pendentes (status = pending_signature)
    const contractsSnapshot = await adminDb
      .collection('driverContracts')
      .where('driverId', '==', realDriverId)
      .where('status', '==', 'pending_signature')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return contractsSnapshot.docs.map(doc => ({
      id: doc.id,
      driverId: doc.data().driverId,
      contractType: doc.data().contractType,
      category: doc.data().category || null,
      templateVersion: doc.data().templateVersion,
      status: doc.data().status,
      createdAt: doc.data().createdAt,
      dueDate: doc.data().dueDate || null,
      emailSentAt: doc.data().emailSentAt || null,
    }));
  } catch (error) {
    console.error('[getDriverContracts] Erro ao buscar contratos:', error);
    return [];
  }
}

/**
 * Busca documentos solicitados ao motorista
 * SSR: para mostrar no dashboard
 */
export async function getDriverDocumentRequests(driverId: string, limit: number = 5) {
  try {
    // Buscar ID real do motorista pelo email
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', driverId)
      .limit(1)
      .get();

    if (driversSnapshot.empty) {
      return [];
    }

    const realDriverId = driversSnapshot.docs[0].id;

    // Buscar documentos solicitados (status = pending ou submitted)
    const docsSnapshot = await adminDb
      .collection('documentRequests')
      .where('driverId', '==', realDriverId)
      .where('status', 'in', ['pending', 'submitted'])
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    return docsSnapshot.docs.map(doc => ({
      id: doc.id,
      driverId: doc.data().driverId,
      documentType: doc.data().documentType,
      documentName: doc.data().documentName,
      description: doc.data().description || null,
      status: doc.data().status,
      dueDate: doc.data().dueDate || null,
      uploadCount: doc.data().uploadCount || 0,
      rejectionReason: doc.data().rejectionReason || null,
      requestedAt: doc.data().requestedAt,
    }));
  } catch (error) {
    console.error('[getDriverDocumentRequests] Erro ao buscar documentos solicitados:', error);
    return [];
  }
}

/**
 * Busca preview de indicações do motorista
 * SSR: para mostrar no dashboard
 */
export async function getDriverReferralsPreview(driverId: string) {
  try {
    // Buscar ID real do motorista pelo email
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', driverId)
      .limit(1)
      .get();

    if (driversSnapshot.empty) {
      return { total: 0, pending: 0, approved: 0, earned: 0 };
    }

    const realDriverId = driversSnapshot.docs[0].id;

    // Buscar indicações ativas (status = pending ou approved)
    const referralsSnapshot = await adminDb
      .collection('referrals')
      .where('referrerId', '==', realDriverId)
      .get();

    const referrals = referralsSnapshot.docs.map(doc => doc.data());

    return {
      total: referrals.length,
      pending: referrals.filter(r => r.status === 'pending').length,
      approved: referrals.filter(r => r.status === 'approved').length,
      earned: referrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0),
    };
  } catch (error) {
    console.error('[getDriverReferralsPreview] Erro ao buscar indicações:', error);
    return { total: 0, pending: 0, approved: 0, earned: 0 };
  }
}

/**
 * Busca preview de metas/bônus do motorista
 * SSR: para mostrar no dashboard
 */
export async function getDriverGoalsPreview(driverId: string) {
  try {
    // Buscar ID real do motorista pelo email
    const driversSnapshot = await adminDb
      .collection('drivers')
      .where('email', '==', driverId)
      .limit(1)
      .get();

    if (driversSnapshot.empty) {
      return { activeGoals: 0, completedGoals: 0, totalRewards: 0, nextMilestone: null };
    }

    const realDriverId = driversSnapshot.docs[0].id;

    // Buscar metas ativas (status = active)
    const goalsSnapshot = await adminDb
      .collection('driverGoals')
      .where('driverId', '==', realDriverId)
      .get();

    const goals = goalsSnapshot.docs.map(doc => doc.data());
    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const totalRewards = completedGoals.reduce((sum, g) => sum + (g.rewardAmount || 0), 0);

    // Próxima milestone (meta não completada mais próxima)
    const nextMilestone = activeGoals.length > 0 ? activeGoals[0] : null;

    return {
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalRewards,
      nextMilestone: nextMilestone ? {
        name: nextMilestone.name || 'Meta',
        progress: nextMilestone.currentProgress || 0,
        target: nextMilestone.targetValue || 0,
        reward: nextMilestone.rewardAmount || 0,
      } : null,
    };
  } catch (error) {
    console.error('[getDriverGoalsPreview] Erro ao buscar metas:', error);
    return { activeGoals: 0, completedGoals: 0, totalRewards: 0, nextMilestone: null };
  }
}

/**
 * Mascara o IBAN mostrando apenas os primeiros 4 e últimos 2 dígitos
 * Exemplo: PT50003300004555698867005 → PT50 **** **** **** **05
 */
function maskIban(iban: string): string {
  if (!iban || iban.length < 6) return iban;
  
  const first4 = iban.substring(0, 4);
  const last2 = iban.substring(iban.length - 2);
  const middle = '*'.repeat(Math.max(0, iban.length - 6));
  
  // Formatar com espaços a cada 4 caracteres
  const masked = first4 + middle + last2;
  return masked.match(/.{1,4}/g)?.join(' ') || masked;
}

