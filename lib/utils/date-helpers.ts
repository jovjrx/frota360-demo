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
 * Obtém datas de início e fim de uma semana (ISO 8601)
 * Semana começa na segunda-feira e termina no domingo
 */
export function getWeekDates(weekId: string): { start: string; end: string } {
  const [year, week] = weekId.split('-W').map(Number);
  
  // ISO 8601: Semana 1 é a primeira semana com quinta-feira
  // Encontrar a primeira quinta-feira do ano
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Domingo = 7
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);
  
  // Calcular início da semana desejada
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  // Fim da semana (domingo)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  // Format date without timezone conversion (YYYY-MM-DD)
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    start: formatDate(weekStart),
    end: formatDate(weekEnd),
  };
}



/**
 * Gera ID único para registro semanal
 */
export function generateWeeklyRecordId(driverId: string, weekId: string): string {
  return `${driverId}_${weekId}`;
}
