function getWeekDates(weekId) {
  const [year, week] = weekId.split('-W').map(Number);
  
  // ISO 8601: Semana 1 é a primeira semana com quinta-feira
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Domingo = 7
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);
  
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const formatDate = (date) => {
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

console.log('🧪 Testando ISO 8601\n');
console.log('2025-W40:');
const w40 = getWeekDates('2025-W40');
console.log(`  ${w40.start} a ${w40.end}`);
console.log(`  Esperado: 2025-09-29 a 2025-10-05`);
console.log(`  ${w40.start === '2025-09-29' ? '✅' : '❌'} CORRETO\n`);

console.log('2025-W01:');
const w01 = getWeekDates('2025-W01');
console.log(`  ${w01.start} a ${w01.end}\n`);

console.log('2025-W52:');
const w52 = getWeekDates('2025-W52');
console.log(`  ${w52.start} a ${w52.end}`);
