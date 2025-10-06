import { adminDb } from "@/lib/firebaseAdmin";

async function clearWeeklyDataImports() {
  try {
    console.log("Iniciando limpeza da coleção weeklyDataImports...");

    const collectionRef = adminDb.collection("weeklyDataImports");
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      console.log("A coleção weeklyDataImports já está vazia. Nenhuma ação necessária.");
      return;
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ ${snapshot.docs.length} documentos deletados da coleção weeklyDataImports.`);

  } catch (error) {
    console.error("❌ Erro ao limpar a coleção weeklyDataImports:", error);
  }
}

clearWeeklyDataImports();

