/**
 * Utilitários para formatação de data e hora
 * Complementa format.ts com funções que incluem hora
 */

/**
 * Formata data e hora no formato DD/MM/YYYY HH:mm
 * Evita conversão de timezone quando possível
 * @param dateStr - String de data ISO ou timestamp
 * @param fallback - Valor de fallback se a data for inválida
 */
export function formatDateTime(dateStr?: string | number | null, fallback = '—'): string {
  if (!dateStr) return fallback;
  
  try {
    const date = new Date(dateStr);
    
    // Verificar se é uma data válida
    if (isNaN(date.getTime())) return fallback;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (_error) {
    return fallback;
  }
}

/**
 * Formata apenas a hora no formato HH:mm
 * @param dateStr - String de data ISO ou timestamp
 * @param fallback - Valor de fallback se a data for inválida
 */
export function formatTime(dateStr?: string | number | null, fallback = '—'): string {
  if (!dateStr) return fallback;
  
  try {
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) return fallback;
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  } catch (_error) {
    return fallback;
  }
}

/**
 * Formata data e hora de forma relativa (ex: "há 2 horas", "ontem")
 * @param dateStr - String de data ISO ou timestamp
 */
export function formatRelativeTime(dateStr?: string | number | null): string {
  if (!dateStr) return '—';
  
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} mês${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
    
    return `há ${Math.floor(diffDays / 365)} ano${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
  } catch (_error) {
    return '—';
  }
}


