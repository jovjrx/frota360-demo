/**
 * Utilitários de formatação
 * 
 * IMPORTANTE: Datas devem ser formatadas sem conversão de timezone
 * para evitar inconsistências entre diferentes localizações
 */

/**
 * Formata data no formato DD/MM/YYYY sem conversão de timezone
 * @param dateStr - String de data no formato YYYY-MM-DD
 * @param fallback - Valor de fallback se a data for inválida
 */
export function formatDate(dateStr?: string | null, fallback = '—'): string {
  if (!dateStr) return fallback;
  
  try {
    // Não usar new Date() para evitar conversão de timezone
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    
    return `${day}/${month}/${year}`;
  } catch (_error) {
    return dateStr;
  }
}

/**
 * Formata data no formato curto DD/MM
 * @param dateStr - String de data no formato YYYY-MM-DD
 */
export function formatDateShort(dateStr?: string | null, fallback = '—'): string {
  if (!dateStr) return fallback;
  
  try {
    const [, month, day] = dateStr.split('-');
    if (!month || !day) return dateStr;
    
    return `${day}/${month}`;
  } catch (_error) {
    return dateStr;
  }
}

/**
 * Formata valor monetário em EUR
 * @param value - Valor numérico
 * @param locale - Locale para formatação (padrão: pt-PT)
 */
export function formatCurrency(value: number, locale: string = 'pt-PT'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

/**
 * Formata percentagem
 * @param value - Valor numérico (0-100)
 * @param decimals - Número de casas decimais (padrão: 1)
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Mascara IBAN mostrando apenas primeiros e últimos caracteres
 * @param iban - IBAN completo
 */
export function maskIBAN(iban?: string | null): string {
  if (!iban) return 'Não informado';
  
  if (iban.length < 8) return iban;
  
  return `${iban.substring(0, 4)} **** **** **** ${iban.substring(iban.length - 2)}`;
}

/**
 * Formata número de telefone
 * @param phone - Número de telefone
 */
export function formatPhone(phone?: string | null): string {
  if (!phone) return 'Não informado';
  
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Formato português: +351 XXX XXX XXX
  if (cleaned.length === 9) {
    return `+351 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  return phone;
}

/**
 * Formata período de datas
 * @param startDate - Data de início (YYYY-MM-DD)
 * @param endDate - Data de fim (YYYY-MM-DD)
 */
export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatDate(startDate)} — ${formatDate(endDate)}`;
}

/**
 * Formata bytes em formato legível
 * @param bytes - Tamanho em bytes
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

