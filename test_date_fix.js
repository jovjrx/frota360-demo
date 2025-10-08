// Simular a função corrigida
function getWeekDates(weekId) {
  const [year, week] = weekId.split('-W').map(Number);
  
  const jan1 = new Date(year, 0, 1);
  const daysToMonday = (jan1.getDay() === 0 ? 6 : jan1.getDay() - 1);
  const firstMonday = new Date(year, 0, 1 + (7 - daysToMonday) % 7);
  
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  // Format date without timezone conversion
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

console.log('🧪 Testando correção de datas\n');
console.log('Semana 2025-W40:');
const result = getWeekDates('2025-W40');
console.log(`  Início: ${result.start}`);
console.log(`  Fim: ${result.end}`);
console.log('\n✅ Esperado: 2025-09-29 a 2025-10-05');
console.log(`✅ Resultado: ${result.start} a ${result.end}`);
console.log(`\n${result.start === '2025-09-29' && result.end === '2025-10-05' ? '✅ CORRETO!' : '❌ INCORRETO!'}`);
