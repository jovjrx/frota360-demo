/**
 * SERVICE: Driver Initialization
 * Inicializa todas as estruturas quando um novo motorista é aprovado
 * - Comissões (apenas afiliados)
 * - Rede de recrutamento (apenas afiliados)
 * - KPIs (todos)
 * - Metas 2026 (todos)
 * - Reserva técnica (apenas afiliados)
 */

import { adminDb } from '@/lib/firebaseAdmin';

interface InitializationResult {
  success: boolean;
  driverId: string;
  driverName: string;
  driverType: 'affiliate' | 'renter';
  structures: {
    commission: boolean;
    referral: boolean;
    kpi: boolean;
    goals: boolean;
    technicalReserve: boolean;
  };
}

/**
 * Inicializa todas as estruturas para um novo motorista
 */
export async function initializeNewDriver(
  driverId: string,
  driverName: string,
  driverType: 'affiliate' | 'renter',
  driverEmail: string
): Promise<InitializationResult> {
  const result: InitializationResult = {
    success: false,
    driverId,
    driverName,
    driverType,
    structures: {
      commission: false,
      referral: false,
      kpi: false,
      goals: false,
      technicalReserve: false,
    },
  };

  try {
    // Estruturas para AFILIADOS
    if (driverType === 'affiliate') {
      // 1. Inicializar Comissões
      try {
        await initializeCommissions(driverId, driverName);
        result.structures.commission = true;
      } catch (error) {
        console.error(`[initializeNewDriver] Erro ao inicializar comissões para ${driverId}:`, error);
      }

      // 2. Inicializar Rede de Recrutamento
      try {
        await initializeReferralNetwork(driverId, driverName, driverEmail);
        result.structures.referral = true;
      } catch (error) {
        console.error(`[initializeNewDriver] Erro ao inicializar rede de recrutamento para ${driverId}:`, error);
      }

      // 3. Inicializar Reserva Técnica
      try {
        await initializeTechnicalReserve(driverId, driverName);
        result.structures.technicalReserve = true;
      } catch (error) {
        console.error(`[initializeNewDriver] Erro ao inicializar reserva técnica para ${driverId}:`, error);
      }
    }

    // Estruturas para TODOS
    // 4. Inicializar KPIs
    try {
      await initializeKPIs(driverId, driverName);
      result.structures.kpi = true;
    } catch (error) {
      console.error(`[initializeNewDriver] Erro ao inicializar KPIs para ${driverId}:`, error);
    }

    // 5. Inicializar Metas 2026
    try {
      await initializeGoals(driverId, driverName, driverType);
      result.structures.goals = true;
    } catch (error) {
      console.error(`[initializeNewDriver] Erro ao inicializar metas para ${driverId}:`, error);
    }

    // Atualizar driver com informações iniciais
    await adminDb.collection('drivers').doc(driverId).update({
      affiliateLevel: driverType === 'affiliate' ? 1 : undefined,
      activeRecruitments: driverType === 'affiliate' ? 0 : undefined,
      totalRecruitments: driverType === 'affiliate' ? 0 : undefined,
      initializedAt: new Date().toISOString(),
    });

    result.success = true;
    return result;
  } catch (error) {
    console.error(`[initializeNewDriver] Erro geral ao inicializar motorista ${driverId}:`, error);
    return result;
  }
}

/**
 * Inicializa comissões para um novo afiliado
 */
async function initializeCommissions(driverId: string, driverName: string): Promise<void> {
  // Criar documento de comissões iniciais
  await adminDb.collection('commissions').doc(driverId).set({
    driverId,
    driverName,
    totalCommissionsEarned: 0,
    totalCommissionsWeeks: 0,
    averageWeeklyCommission: 0,
    lastCommissionDate: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Inicializa rede de recrutamento para um novo afiliado
 */
async function initializeReferralNetwork(
  driverId: string,
  driverName: string,
  driverEmail: string
): Promise<void> {
  // Gerar código de convite único
  const inviteCode = generateInviteCode();

  // Criar documento de rede de afiliação
  await adminDb.collection('affiliateNetworks').doc(driverId).set({
    driverId,
    driverName,
    driverEmail,
    inviteCode,
    totalRecruitments: 0,
    activeRecruitments: 0,
    recruitedDrivers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Criar entrada em referralInvites para rastrear o próprio convite
  await adminDb.collection('referralInvites').add({
    recruiterId: driverId,
    recruiterName: driverName,
    recruiterEmail: driverEmail,
    inviteCode,
    email: null,
    phone: null,
    status: 'generated', // Convite gerado para o próprio afiliado
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 ano
    acceptedAt: null,
    acceptedByDriverId: null,
    acceptedByDriverName: null,
  });
}

/**
 * Inicializa KPIs para um novo motorista
 */
async function initializeKPIs(driverId: string, driverName: string): Promise<void> {
  // Criar documento de KPIs iniciais (semana atual com score 0)
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekId = `W${weekStart.getFullYear()}${String(weekStart.getMonth() + 1).padStart(2, '0')}${String(weekStart.getDate()).padStart(2, '0')}`;

  await adminDb.collection('performanceKPIs').add({
    driverId,
    driverName,
    weekId,
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    weeklyRevenue: 0,
    acceptanceRate: 0,
    passengerRating: 0,
    recruitmentsActive: 0,
    activeHoursPerWeek: 0,
    overallScore: 0,
    performanceLevel: 'beginner',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Inicializa metas 2026 para um novo motorista
 */
async function initializeGoals(
  driverId: string,
  driverName: string,
  driverType: 'affiliate' | 'renter'
): Promise<void> {
  // Metas padrão para 2026
  const goals = [
    {
      quarter: 'Q1',
      target: 15,
      description: 'Atingir 15 motoristas ativos',
      weight: 25,
    },
    {
      quarter: 'Q2',
      target: 25,
      description: 'Atingir 25 motoristas ativos',
      weight: 25,
    },
    {
      quarter: 'Q3',
      target: 40,
      description: 'Atingir 40 motoristas ativos',
      weight: 25,
    },
    {
      quarter: 'Q4',
      target: 60,
      description: 'Atingir 60 motoristas ativos',
      weight: 25,
    },
  ];

  for (const goal of goals) {
    await adminDb.collection('goals').add({
      driverId,
      driverName,
      driverType,
      year: 2026,
      quarter: goal.quarter,
      target: goal.target,
      description: goal.description,
      weight: goal.weight,
      current: 0,
      status: 'not_started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Inicializa reserva técnica para um novo afiliado
 */
async function initializeTechnicalReserve(driverId: string, driverName: string): Promise<void> {
  await adminDb.collection('technicalReserves').doc(driverId).set({
    driverId,
    driverName,
    totalReserve: 0,
    weeksCovered: 0,
    daysCovered: 0,
    reserveHealth: 'critical', // Começa crítico (sem reserve)
    lastUpdateDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Gera um código de convite único
 */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}


