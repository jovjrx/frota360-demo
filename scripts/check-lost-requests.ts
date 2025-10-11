/**
 * Script para verificar solicitações perdidas
 * 
 * Verifica quantas solicitações estão na collection 'requests' (antiga)
 * que nunca chegaram ao admin (em 'driver_requests').
 * 
 * Execute: npx ts-node scripts/check-lost-requests.ts
 */

import { adminDb } from '@/lib/firebaseAdmin';

async function checkLostRequests() {
  console.log('🔍 Verificando solicitações perdidas...\n');

  try {
    // Buscar solicitações antigas
    const oldRequestsSnapshot = await adminDb.collection('requests').get();
    const newRequestsSnapshot = await adminDb.collection('driver_requests').get();

    console.log('📊 ESTATÍSTICAS:\n');
    console.log(`   Collection "requests" (antiga):        ${oldRequestsSnapshot.size} documentos`);
    console.log(`   Collection "driver_requests" (atual):  ${newRequestsSnapshot.size} documentos\n`);

    if (oldRequestsSnapshot.empty) {
      console.log('✅ Nenhuma solicitação perdida encontrada!');
      console.log('   Todas as solicitações estão sendo salvas corretamente.\n');
      return;
    }

    // Analisar solicitações antigas
    console.log('⚠️  SOLICITAÇÕES PERDIDAS (nunca chegaram ao admin):\n');
    console.log('   ID                    | Nome                 | Email                      | Data               | Status');
    console.log('   ' + '-'.repeat(110));

    let pending = 0;
    let approved = 0;
    let rejected = 0;

    oldRequestsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const name = data.firstName && data.lastName 
        ? `${data.firstName} ${data.lastName}` 
        : data.fullName || 'N/A';
      const email = data.email || 'N/A';
      const status = data.status || 'pending';
      const createdAt = data.createdAt 
        ? (typeof data.createdAt === 'number' 
            ? new Date(data.createdAt).toLocaleDateString('pt-PT')
            : new Date(data.createdAt).toLocaleDateString('pt-PT'))
        : 'N/A';

      console.log(`   ${doc.id.padEnd(22)} | ${name.padEnd(20)} | ${email.padEnd(26)} | ${createdAt.padEnd(18)} | ${status}`);

      if (status === 'pending') pending++;
      else if (status === 'approved') approved++;
      else if (status === 'rejected') rejected++;
    });

    console.log('\n📈 Resumo por Status:');
    console.log(`   ⏳ Pendentes: ${pending}`);
    console.log(`   ✅ Aprovadas: ${approved}`);
    console.log(`   ❌ Rejeitadas: ${rejected}`);
    console.log(`   📊 Total: ${oldRequestsSnapshot.size}\n`);

    if (pending > 0) {
      console.log('🚨 AÇÃO NECESSÁRIA:');
      console.log(`   Há ${pending} solicitação(ões) pendente(s) que NUNCA chegaram ao admin!`);
      console.log('   Execute o script de migração para recuperá-las:');
      console.log('   👉 npx ts-node scripts/migrate-requests.ts\n');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar solicitações:', error);
    throw error;
  }
}

// Executar verificação
checkLostRequests()
  .then(() => {
    console.log('✅ Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verificação falhou:', error);
    process.exit(1);
  });

