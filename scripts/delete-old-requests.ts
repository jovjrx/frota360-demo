/**
 * Script para deletar solicitações antigas
 * 
 * Deleta a collection 'requests' após confirmar que tudo foi migrado.
 * ATENÇÃO: Execute APENAS após verificar que a migração funcionou!
 * 
 * Execute: npx ts-node scripts/delete-old-requests.ts
 */

import { adminDb } from '@/lib/firebaseAdmin';

async function deleteOldRequests() {
  console.log('⚠️  ATENÇÃO: Este script irá DELETAR a collection "requests"!\n');
  console.log('   Certifique-se de que:');
  console.log('   1. Executou o script de migração (migrate-requests.ts)');
  console.log('   2. Verificou os dados em /admin/requests');
  console.log('   3. Confirmou que tudo está correto\n');

  // Aguardar 5 segundos para dar tempo de cancelar
  console.log('⏳ Aguardando 5 segundos... (Ctrl+C para cancelar)\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    const snapshot = await adminDb.collection('requests').get();
    
    if (snapshot.empty) {
      console.log('✅ Collection "requests" já está vazia. Nada a deletar.\n');
      return;
    }

    console.log(`🗑️  Deletando ${snapshot.size} documentos...\n`);

    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    
    console.log(`✅ ${snapshot.size} documentos deletados com sucesso!\n`);
    console.log('📝 Collection "requests" foi removida.\n');

  } catch (error) {
    console.error('❌ Erro ao deletar collection:', error);
    throw error;
  }
}

// Executar
deleteOldRequests()
  .then(() => {
    console.log('✅ Limpeza concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Limpeza falhou:', error);
    process.exit(1);
  });

