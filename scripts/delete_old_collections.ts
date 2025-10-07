import { adminDb } from "@/lib/firebaseAdmin";

async function deleteCollection(collectionPath: string) {
  const collectionRef = adminDb.collection(collectionPath);
  const snapshot = await collectionRef.limit(100).get(); // Limitar para evitar sobrecarga

  if (snapshot.size === 0) {
    console.log(`Coleção '${collectionPath}' está vazia ou não existe.`);
    return;
  }

  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Documentos da coleção '${collectionPath}' deletados.`);

  // Recursivamente deletar mais se houver
  if (snapshot.size === 100) {
    await deleteCollection(collectionPath);
  }
}

async function main() {
  console.log("Iniciando exclusão de coleções antigas...");
  try {
    await deleteCollection("weeks");
    console.log("✅ Exclusão de coleções antigas concluída com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao excluir coleções antigas:", error);
  }
}

main();

