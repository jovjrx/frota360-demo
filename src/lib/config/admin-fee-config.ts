/**
 * Configuração de taxas administrativas por tipo de motorista
 */

export const ADMIN_FEE_CONFIG = {
  // Locatário: 4%
  renter: {
    mode: 'percent' as const,
    value: 4, // 4%
    label: '4%',
  },
  // Afiliado: €25 fixo
  affiliate: {
    mode: 'fixed' as const,
    value: 25, // €25 fixo
    label: '€25',
  },
};

/**
 * Calcula a taxa administrativa baseada nas regras do motorista
 * 
 * @param driver Dados do driver (com type e adminFee opcionais)
 * @param ganhosMenosIVA Ganhos menos IVA
 * @returns Taxa administrativa em euros
 */
export function calculateAdminFee(
  driver: any,
  ganhosMenosIVA: number
): number {
  // 1. Se o driver tem regra customizada, usa ela
  if (driver.adminFee) {
    if (driver.adminFee.mode === 'fixed') {
      return driver.adminFee.fixedValue || 0;
    } else if (driver.adminFee.mode === 'percent' && driver.adminFee.percentValue !== undefined) {
      return ganhosMenosIVA * (driver.adminFee.percentValue / 100);
    }
  }

  // 2. Senão, usa regra pelo tipo
  const typeConfig = ADMIN_FEE_CONFIG[driver.type as 'renter' | 'affiliate'];
  
  if (!typeConfig) {
    // Fallback: 7% (legado)
    return ganhosMenosIVA * 0.07;
  }

  if (typeConfig.mode === 'fixed') {
    return typeConfig.value;
  } else {
    return ganhosMenosIVA * (typeConfig.value / 100);
  }
}

/**
 * Retorna label legível da taxa
 */
export function getAdminFeeLabel(driver: any): string {
  // Se tem regra customizada
  if (driver.adminFee) {
    if (driver.adminFee.mode === 'fixed') {
      return `€${driver.adminFee.fixedValue || 0}`;
    } else if (driver.adminFee.mode === 'percent') {
      return `${driver.adminFee.percentValue || 0}%`;
    }
  }

  // Senão, usa pelo tipo
  const typeConfig = ADMIN_FEE_CONFIG[driver.type as 'renter' | 'affiliate'];
  return typeConfig?.label || '7%';
}
