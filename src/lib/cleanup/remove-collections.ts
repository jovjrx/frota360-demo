import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Script para remover coleções não usadas do Firebase
 * 
 * Coleções a remover:
 * - weeklyDataSources (antigo, substituído por rawFileArchive + dataWeekly)
 * - weeklyDriverPlatformData (deprecated, não integrado)
 * - weeklyReports (não usado, sem integração)
 * 
 * Executar em: pages/api/admin/cleanup/remove-collections.ts
 */

export async function deleteCollection(collectionPath: string, batchSize = 100): Promise<number> {
  let deletedCount = 0;
  let query = adminDb.collection(collectionPath);

  let snapshotDocs = await query.limit(batchSize).get();

  while (snapshotDocs.docs.length > 0) {
    const batch = adminDb.batch();
    
    snapshotDocs.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();
    console.log(`[Cleanup] Deletados ${deletedCount} documentos de ${collectionPath}`);

    snapshotDocs = await query.limit(batchSize).get();
  }

  return deletedCount;
}

export async function cleanupUnusedCollections() {
  const collectionsToRemove = [
    'weeklyDataSources',
    'weeklyDriverPlatformData',
    'weeklyReports',
  ];

  console.log('🧹 Iniciando limpeza de coleções não usadas...');

  for (const collection of collectionsToRemove) {
    try {
      const count = await deleteCollection(collection);
      console.log(`✅ ${collection}: ${count} documentos deletados`);
    } catch (error) {
      console.error(`❌ Erro ao deletar ${collection}:`, error);
    }
  }

  console.log('✅ Limpeza concluída!');
}

// Para executar manualmente:
// import { cleanupUnusedCollections } from '@/lib/cleanup/remove-collections';
// await cleanupUnusedCollections();
