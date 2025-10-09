import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { Driver } from "@/schemas/driver";

async function addTestDriver() {
  const driverEmail = "yuri@example.com"; // Email do Yuri
  const driverPassword = "Carol@25"; // Senha fornecida

  let userRecord;
  try {
    userRecord = await adminAuth.getUserByEmail(driverEmail);
    await adminAuth.updateUser(userRecord.uid, { password: driverPassword });
    console.log(`✅ Senha do usuário ${driverEmail} atualizada com sucesso.`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      userRecord = await adminAuth.createUser({ email: driverEmail, password: driverPassword });
      console.log(`✅ Usuário ${driverEmail} criado com sucesso.`);
    } else {
      console.error("❌ Erro ao buscar/criar usuário no Firebase Auth:", error);
      return;
    }
  }

  const testDriver: Driver = {
    id: userRecord.uid, // Usar o UID do Firebase Auth como ID do driver no Firestore
    uid: userRecord.uid,
    userId: userRecord.uid,
    firstName: "Yuri",
    lastName: "Test",
    email: driverEmail,
    phone: "+351912345678",
    name: "Yuri Test",
    fullName: "Yuri Test",
    locale: "pt",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    status: "active", // Garantir que o status é 'active'
    isActive: true,
    isApproved: true,
    type: "affiliate",
    rentalFee: 0,
    integrations: {
      uber: { key: "uber-uuid-test", enabled: true, lastSync: null },
      bolt: { key: driverEmail, enabled: true, lastSync: null },
      myprio: { key: "7824736068450001", enabled: true, lastSync: null },
      viaverde: { key: "AA-00-BB", enabled: true, lastSync: null },
    },

    banking: {
      iban: "PT50000000000000000000000",
      accountHolder: "Yuri Test",
    },

    rating: 0,
    documents: {
      license: { uploaded: true, verified: true, url: null },
      insurance: { uploaded: true, verified: true, url: null },
      vehicle: { uploaded: true, verified: true, url: null },
    },
    vehicle: {
      make: "Toyota",
      model: "Corolla",
      year: 2020,
      plate: "AA-00-BB",
    },
    commission: { percent: 7 },
    notes: "Motorista de teste para simulação de importação.",
    lastPayoutAmount: 0,
    checkinCount: 0,
    nextCheckin: 0,
  };

  try {
    await adminDb.collection("drivers").doc(testDriver.id).set(testDriver, { merge: true });
    console.log(`✅ Motorista de teste '${testDriver.fullName}' adicionado/atualizado com sucesso no Firestore.`);
  } catch (error) {
    console.error("❌ Erro ao adicionar motorista de teste no Firestore:", error);
  }
}

addTestDriver();

