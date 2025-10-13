// Este script vai disparar o processamento da semana W41
const fetch = require('node-fetch');

async function processWeek() {
  try {
    console.log('\n🔄 Processando dados da semana W41...\n');
    
    const response = await fetch('http://localhost:3000/api/admin/weekly/data?weekId=2025-W41');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Dados processados com sucesso!');
    console.log(`   Total de registros: ${data.records?.length || 0}`);
    console.log(`   Total não atribuído: ${data.unassigned?.length || 0}`);
    console.log('');
    
    if (data.records && data.records.length > 0) {
      console.log('📊 Motoristas processados:');
      data.records.forEach(r => {
        console.log(`   - ${r.driverName}: €${r.ganhosTotal.toFixed(2)}`);
      });
    }
    
    console.log('\n✅ Agora você pode recarregar o dashboard para ver os dados da W41!\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n⚠️  Certifique-se de que o servidor está rodando em http://localhost:3000\n');
  }
}

processWeek();
