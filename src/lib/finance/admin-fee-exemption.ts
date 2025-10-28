/**
 * Sistema de Isenção de Taxa Administrativa
 * 
 * Permite que o admin isente um motorista de desconto por X semanas
 * Útil para promoções iniciais, bônus, etc.
 */

import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export interface AdminFeeExemption {
  isExempt: boolean;
  exemptionStartDate: string | null; // ISO string
  exemptionWeeks: number;
  createdAt: string | null;
  createdBy: string | null;
  reason?: string;
}

/**
 * Cria ou atualiza isenção de taxa adm para um motorista
 * 
 * @param driverId - ID do motorista
 * @param exemptionWeeks - Número de semanas de isenção
 * @param reason - Motivo da isenção (opcional)
 * @param adminId - ID do admin que criou
 * @returns A isenção criada
 */
export async function setAdminFeeExemption(
  driverId: string,
  exemptionWeeks: number,
  reason: string = '',
  adminId: string
): Promise<AdminFeeExemption> {
  const db = adminDb;
  
  if (exemptionWeeks < 0) {
    throw new Error('Número de semanas deve ser >= 0');
  }

  const now = new Date().toISOString();
  const isExempt = exemptionWeeks > 0;

  const exemption: AdminFeeExemption = {
    isExempt,
    exemptionStartDate: isExempt ? now : null,
    exemptionWeeks,
    createdAt: now,
    createdBy: adminId,
    reason,
  };

  // Atualiza o motorista com a nova isenção
  await db.collection('drivers').doc(driverId).update({
    adminFeeExemption: exemption,
    updatedAt: Timestamp.now(),
  });

  return exemption;
}

/**
 * Remove isenção de taxa adm (volta ao desconto normal)
 * 
 * @param driverId - ID do motorista
 */
export async function clearAdminFeeExemption(driverId: string): Promise<void> {
  const db = adminDb;

  await db.collection('drivers').doc(driverId).update({
    adminFeeExemption: {
      isExempt: false,
      exemptionStartDate: null,
      exemptionWeeks: 0,
      createdAt: null,
      createdBy: null,
    },
    updatedAt: Timestamp.now(),
  });
}

/**
 * Verifica se um motorista está isento de taxa adm nesta semana
 * 
 * @param driverId - ID do motorista
 * @param weekDate - Data da semana (qualquer dia da semana, será normalizado para segunda-feira)
 * @returns true se está isento
 */
export async function isDriverAdminFeeExempt(
  driverId: string,
  weekDate?: Date
): Promise<boolean> {
  const db = adminDb;
  const driverDoc = await db.collection('drivers').doc(driverId).get();

  if (!driverDoc.exists) {
    return false;
  }

  const driver = driverDoc.data();
  const exemption = driver?.adminFeeExemption as AdminFeeExemption | undefined;

  if (!exemption?.isExempt || !exemption.exemptionStartDate || exemption.exemptionWeeks <= 0) {
    return false;
  }

  // Se não foi passada uma data, usa hoje
  const checkDate = weekDate || new Date();

  // Parse da data de início
  const startDate = new Date(exemption.exemptionStartDate);

  // Calcula a data final (exemptionWeeks * 7 dias)
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + exemption.exemptionWeeks * 7);

  // Verifica se checkDate está dentro do período
  return checkDate >= startDate && checkDate < endDate;
}

/**
 * Obtém isenção para um motorista
 * 
 * @param driverId - ID do motorista
 * @returns A isenção ou null se não existe
 */
export async function getAdminFeeExemption(driverId: string): Promise<AdminFeeExemption | null> {
  const db = adminDb;
  const driverDoc = await db.collection('drivers').doc(driverId).get();

  if (!driverDoc.exists) {
    return null;
  }

  const driver = driverDoc.data();
  return driver?.adminFeeExemption || null;
}

/**
 * Retorna quantos dias faltam para terminar a isenção
 * 
 * @param driverId - ID do motorista
 * @returns Número de dias restantes, ou 0 se não está isento
 */
export async function getExemptionDaysRemaining(driverId: string): Promise<number> {
  const db = adminDb;
  const driverDoc = await db.collection('drivers').doc(driverId).get();

  if (!driverDoc.exists) {
    return 0;
  }

  const driver = driverDoc.data();
  const exemption = driver?.adminFeeExemption as AdminFeeExemption | undefined;

  if (!exemption?.isExempt || !exemption.exemptionStartDate || exemption.exemptionWeeks <= 0) {
    return 0;
  }

  const startDate = new Date(exemption.exemptionStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + exemption.exemptionWeeks * 7);

  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calcula se deve descontar taxa adm baseado na isenção
 * 
 * @param driverId - ID do motorista
 * @param baseAdminFee - Valor da taxa adm a descontar (ex: 25€)
 * @param weekDate - Data da semana
 * @returns Valor a descontar (0 se isento, baseAdminFee se não)
 */
export async function calculateAdminFeeWithExemption(
  driverId: string,
  baseAdminFee: number,
  weekDate?: Date
): Promise<number> {
  const isExempt = await isDriverAdminFeeExempt(driverId, weekDate);
  return isExempt ? 0 : baseAdminFee;
}

