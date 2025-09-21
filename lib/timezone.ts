import { DateTime } from 'luxon';

// Configuração do timezone de Portugal
export const PORTUGAL_TIMEZONE = 'Europe/Lisbon';

// Função para obter data/hora atual em Portugal
export function getPortugalTime(): DateTime {
  return DateTime.now().setZone(PORTUGAL_TIMEZONE);
}

// Função para converter timestamp para Portugal
export function toPortugalTime(timestamp: Date | string | number): DateTime {
  return DateTime.fromJSDate(new Date(timestamp)).setZone(PORTUGAL_TIMEZONE);
}

// Função para obter timestamp atual em Portugal
export function getPortugalTimestamp(): number {
  return getPortugalTime().toMillis();
}

// Função para formatar data/hora em Portugal
export function formatPortugalTime(timestamp: Date | string | number, format: string = 'dd/MM/yyyy HH:mm'): string {
  return toPortugalTime(timestamp).toFormat(format);
}

// Função para obter início do dia em Portugal
export function getPortugalStartOfDay(): DateTime {
  return getPortugalTime().startOf('day');
}

// Função para obter fim do dia em Portugal
export function getPortugalEndOfDay(): DateTime {
  return getPortugalTime().endOf('day');
}

// Função para calcular próxima data/hora (ex: +5 minutos)
export function addPortugalTime(amount: number, unit: 'minutes' | 'hours' | 'days' = 'minutes'): DateTime {
  return getPortugalTime().plus({ [unit]: amount });
}
