/**
 * Gera weekId a partir de uma data
 */
export function getWeekId(date: Date): string {
  const year = date.getFullYear();
  const onejan = new Date(year, 0, 1);
  const week = Math.ceil((((date.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Obtém datas de início e fim de uma semana
 */
export function getWeekDates(weekId: string): { start: string; end: string } {
  const [year, week] = weekId.split('-W').map(Number);
  
  // Primeiro dia do ano
  const jan1 = new Date(year, 0, 1);
  
  // Primeiro dia da semana (segunda-feira)
  const daysToMonday = (jan1.getDay() === 0 ? 6 : jan1.getDay() - 1);
  const firstMonday = new Date(year, 0, 1 + (7 - daysToMonday) % 7);
  
  // Calcular início da semana desejada
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  // Fim da semana (domingo)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
  };
}



/**
 * Gera ID único para registro semanal
 */
export function generateWeeklyRecordId(driverId: string, weekId: string): string {
  return `${driverId}_${weekId}`;
}

