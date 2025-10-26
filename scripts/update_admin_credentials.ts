import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

async function updateAdminCredentials() {
  const oldEmail = "conduzcontacto@gmail.com";
  const newEmail = "info@alvoradamagistral.eu";
  const newPassword = "Alvorada@25";

  try {
    let firebaseUid: string | undefined;
    let adminDocRef: FirebaseFirestore.DocumentReference | undefined;

    // 1. Tentar encontrar o usuário no Firebase Auth pelo email antigo
    try {
      const userRecord = await adminAuth.getUserByEmail(oldEmail);
      firebaseUid = userRecord.uid;
      console.log(`Admin encontrado no Firebase Auth: ${oldEmail} (UID: ${firebaseUid})`);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        console.log(`Admin ${oldEmail} não encontrado no Firebase Auth. Criando...`);
        const newUser = await adminAuth.createUser({
          email: oldEmail,
          password: "123456789", // Usar a senha original para criar, depois atualizar
          displayName: "Admin Frota360",
        });
        firebaseUid = newUser.uid;
        console.log(`Admin ${oldEmail} criado no Firebase Auth com UID: ${firebaseUid}`);
      } else {
        throw authError;
      }
    }

    // 2. Encontrar/Atualizar o documento na coleção 'users' pelo email
    const usersRef = adminDb.collection("users");
    const querySnapshot = await usersRef.where("email", "==", oldEmail).limit(1).get();

    if (querySnapshot.empty) {
      console.log(`Admin com email ${oldEmail} não encontrado na coleção 'users'. Criando novo documento...`);
      adminDocRef = usersRef.doc(firebaseUid); // Usar o UID do Firebase Auth como ID do documento
      await adminDocRef.set({
        uid: firebaseUid,
        email: oldEmail,
        name: "Admin Frota360",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`Documento do admin criado na coleção 'users' com ID: ${firebaseUid}`);
    } else {
      adminDocRef = querySnapshot.docs[0].ref;
      const adminData = querySnapshot.docs[0].data();
      console.log(`Documento do admin encontrado na coleção 'users' (ID: ${adminDocRef.id}).`);
      // Garantir que o uid no documento corresponda ao firebaseUid
      if (adminData.uid !== firebaseUid) {
        await adminDocRef.update({ uid: firebaseUid });
        console.log(`UID do documento do admin atualizado para ${firebaseUid}.`);
      }
    }

    if (!firebaseUid || !adminDocRef) {
      console.error("Erro: firebaseUid ou adminDocRef não definidos.");
      return;
    }

    // 3. Atualizar o email e a senha no Firebase Auth para os novos valores
    await adminAuth.updateUser(firebaseUid, {
      email: newEmail,
      password: newPassword,
    });
    console.log(`Email e senha do usuário ${firebaseUid} atualizados para ${newEmail} no Firebase Auth.`);

    // 4. Atualizar o email na coleção 'users'
    await adminDocRef.update({
      email: newEmail,
      updatedAt: new Date(),
    });
    console.log(`Email do admin ${adminDocRef.id} atualizado para ${newEmail} na coleção 'users'.`);

    console.log("Atualização das credenciais do admin concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar credenciais do admin:", error);
  }
}

updateAdminCredentials();

