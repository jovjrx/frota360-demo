/**
 * Script de migração de solicitações
 * 
 * Migra solicitações antigas da collection 'requests' para 'driver_requests'
 * com o formato correto usado pelo painel admin.
 * 
 * Execute: npx ts-node scripts/migrate-requests.ts
 */

import { adminDb } from '@/lib/firebaseAdmin';

async function migrateRequests() {
  console.log('🔄 Iniciando migração de solicitações...\n');

  try {
    // 1. Buscar todas as solicitações da collection antiga
    const oldRequestsSnapshot = await adminDb.collection('requests').get();
    
    if (oldRequestsSnapshot.empty) {
      console.log('✅ Nenhuma solicitação antiga encontrada na collection "requests".');
      console.log('   O sistema já está funcionando corretamente!\n');
      return;
    }

    console.log(`📋 Encontradas ${oldRequestsSnapshot.size} solicitações antigas.\n`);

    // 2. Processar cada solicitação
    let migrated = 0;
    let errors = 0;
    const batch = adminDb.batch();
    
    for (const doc of oldRequestsSnapshot.docs) {
      const oldData = doc.data();
      
      try {
        // Converter formato antigo para novo
        const newData = {
          // Combinar firstName + lastName → fullName
          fullName: oldData.firstName && oldData.lastName 
            ? `${oldData.firstName} ${oldData.lastName}`
            : oldData.fullName || 'Nome não informado',
          
          email: oldData.email,
          phone: oldData.phone,
          city: oldData.city,
          
          // Converter driverType → type
          type: oldData.driverType || oldData.type || 'affiliate',
          
          vehicle: oldData.vehicle || null,
          
          status: oldData.status || 'pending',
          
          // Preservar timestamps
          createdAt: oldData.createdAt 
            ? (typeof oldData.createdAt === 'number' 
                ? new Date(oldData.createdAt).toISOString() 
                : oldData.createdAt)
            : new Date().toISOString(),
          
          updatedAt: oldData.updatedAt 
            ? (typeof oldData.updatedAt === 'number' 
                ? new Date(oldData.updatedAt).toISOString() 
                : oldData.updatedAt)
            : new Date().toISOString(),
          
          // Preservar campos de auditoria se existirem
          adminNotes: oldData.adminNotes || null,
          rejectionReason: oldData.rejectionReason || null,
          approvedBy: oldData.approvedBy || null,
          driverId: oldData.driverId || null,
          
          // Marcar como migrado
          _migratedFrom: 'requests',
          _migratedAt: new Date().toISOString(),
          _originalId: doc.id,
        };

        // Adicionar à nova collection
        const newRef = adminDb.collection('driver_requests').doc();
        batch.set(newRef, { id: newRef.id, ...newData });
        
        console.log(`  ✅ ${newData.fullName} (${newData.email}) - ${newData.status}`);
        migrated++;
      } catch (error) {
        console.error(`  ❌ Erro ao migrar ${doc.id}:`, error);
        errors++;
      }
    }

    // 3. Executar batch
    await batch.commit();
    
    console.log(`\n📊 Resumo da Migração:`);
    console.log(`   ✅ Migradas: ${migrated}`);
    console.log(`   ❌ Erros: ${errors}`);
    console.log(`   📝 Total: ${oldRequestsSnapshot.size}\n`);

    // 4. Perguntar se quer deletar collection antiga
    console.log('⚠️  ATENÇÃO:');
    console.log('   As solicitações antigas ainda estão na collection "requests".');
    console.log('   Recomendação: Verifique os dados migrados no painel admin antes de deletar.');
    console.log('   Para deletar depois, rode: npx ts-node scripts/delete-old-requests.ts\n');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
}

// Executar migração
migrateRequests()
  .then(() => {
    console.log('✅ Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migração falhou:', error);
    process.exit(1);
  });

