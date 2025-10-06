import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

async function updateYuriEmail() {
  const oldEmail = "caroline@alvoradamagistral.eu";
  const newEmail = "yurirsc18@gmail.com";

  try {
    // 1. Encontrar o motorista na coleção 'drivers' pelo email antigo
    const driversRef = adminDb.collection("drivers");
    const querySnapshot = await driversRef.where("email", "==", oldEmail).limit(1).get();

    if (querySnapshot.empty) {
      console.log(`Motorista com email ${oldEmail} não encontrado na coleção 'drivers'.`);
      return;
    }

    const driverDoc = querySnapshot.docs[0];
    const driverData = driverDoc.data();
    const driverId = driverDoc.id;
    const firebaseUid = driverData.firebaseUid;

    if (!firebaseUid) {
      console.log(`Motorista ${oldEmail} não possui firebaseUid. Não é possível atualizar no Firebase Auth.`);
      return;
    }

    console.log(`Encontrado motorista: ${driverData.firstName} ${driverData.lastName} (ID: ${driverId}, UID: ${firebaseUid})`);

    // 2. Atualizar o email no Firebase Auth
    await adminAuth.updateUser(firebaseUid, {
      email: newEmail,
    });
    console.log(`Email do usuário ${firebaseUid} atualizado para ${newEmail} no Firebase Auth.`);

    // 3. Atualizar o email na coleção 'drivers'
    await driverDoc.ref.update({
      email: newEmail,
    });
    console.log(`Email do motorista ${driverId} atualizado para ${newEmail} na coleção 'drivers'.`);

    console.log("Atualização concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar email do Yuri Rocha:", error);
  }
}

updateYuriEmail();

