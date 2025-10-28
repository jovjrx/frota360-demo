/**
 * Gera weekId a partir de uma data
 */
export function getWeekId(date: Date): string {
  // ISO 8601 week (Monday start). Compute in UTC to avoid timezone shifts.
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7; // Sunday => 7
  // set to Thursday to determine week/year per ISO
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const year = d.getUTCFullYear();
  return `${year}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Obtém datas de início e fim de uma semana (ISO 8601)
 * Semana começa na segunda-feira e termina no domingo
 */
export function getWeekDates(weekId: string): { start: string; end: string } {
  const [yearStr, weekStr] = weekId.split('-W');
  const year = Number(yearStr);
  const week = Number(weekStr);

  // ISO 8601 computation in UTC
  // Find the Monday of week 1: the Monday of the week containing Jan 4th
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // Sunday => 7
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

  const weekStart = new Date(firstMonday);
  weekStart.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const formatUTC = (d: Date) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return { start: formatUTC(weekStart), end: formatUTC(weekEnd) };
}



/**
 * Gera ID único para registro semanal
 */
export function generateWeeklyRecordId(driverId: string, weekId: string): string {
  return `${driverId}_${weekId}`;
}

