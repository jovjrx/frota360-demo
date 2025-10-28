/**
 * UTILITÁRIOS DE SERIALIZAÇÃO FIRESTORE
 * Para converter Timestamps e outros objetos não-JSON do Firestore em tipos serializáveis
 * 
 * Uso:
 * - serializeObject(obj) - Serializa um objeto
 * - serializeArray(arr) - Serializa um array
 * - serializeTimestamp(val) - Serializa um Timestamp
 */

import { Timestamp } from 'firebase-admin/firestore';

/**
 * Verifica se um valor é um Firestore Timestamp
 */
function isFirestoreTimestamp(value: any): boolean {
  return value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function';
}

/**
 * Converte um Firestore Timestamp para ISO string
 */export function serializeTimestamp(value: any): string | null {
  if (value === null || value === undefined) return null;
  
  // Se é Firestore Timestamp
  if (isFirestoreTimestamp(value)) {
    try {
      return value.toDate().toISOString();
    } catch (e) {
      console.error('Erro ao serializar Timestamp:', e);
      return null;
    }
  }
  
  // Se já é string
  if (typeof value === 'string') return value;
  
  // Se é Date
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  return null;
}

/**
 * Serializa recursivamente um objeto, convertendo Timestamps e removendo campos não-serializáveis
 */
export function serializeObject<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj;
  
  // Se é array, serializa cada item
  if (Array.isArray(obj)) {
    return obj.map(item => serializeObject(item)) as any;
  }
  
  // Se não é um objeto simples, retorna como está
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Se é Date
  if (obj instanceof Date) {
    return obj.toISOString() as any;
  }
  
  // Se é Timestamp Firestore
  if (isFirestoreTimestamp(obj)) {
    return serializeTimestamp(obj) as any;
  }
  
  // Se é um objeto comum, processa recursivamente
  const result: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      // Ignora valores undefined
      if (value === undefined) {
        continue;
      }
      
      // Campos de data/timestamp conhecidos
      if (key.endsWith('At') || key.endsWith('Date') || key === 'timestamp') {
        result[key] = serializeTimestamp(value);
      }
      // Recursivamente serializa objetos e arrays
      else if (typeof value === 'object' && value !== null) {
        result[key] = serializeObject(value);
      }
      // Copia valores simples
      else {
        result[key] = value;
      }
    }
  }
  
  return result as T;
}

/**
 * Serializa um array de objetos (padrão para SSR)
 */
export function serializeArray<T = any>(arr: any[]): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => serializeObject<T>(item));
}

/**
 * Serializa múltiplos objetos com nomes de chaves (útil para SSR com múltiplos datasets)
 * 
 * Exemplo:
 * serializeDatasets({
 *   drivers: recentDrivers,
 *   requests: recentRequests,
 *   stats: statsData,
 * })
 */
export function serializeDatasets<T extends Record<string, any>>(datasets: T): T {
  const result = {} as T;
  
  for (const [key, value] of Object.entries(datasets)) {
    if (Array.isArray(value)) {
      result[key as keyof T] = serializeArray(value) as any;
    } else if (typeof value === 'object' && value !== null) {
      result[key as keyof T] = serializeObject(value) as any;
    } else {
      result[key as keyof T] = value as any;
    }
  }
  
  return result;
}

