import { adminDb } from "@/lib/firebaseAdmin";
import { Driver } from "@/schemas/driver";

async function addTestDriver() {
  const testDriver: Driver = {
    id: "test-driver-123",
    uid: "test-uid-123",
    userId: "test-user-123",
    firstName: "Test",
    lastName: "Driver",
    email: "test.driver@example.com",
    phone: "+351912345678",
    name: "Test Driver",
    fullName: "Test Driver",
    locale: "pt",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    status: "active",
    isActive: true,
    isApproved: true,
    type: "affiliate",
    rentalFee: 0,
    integrations: {
      uber: { key: "uber-uuid-test", enabled: true, lastSync: null },
      bolt: { key: "test.driver@example.com", enabled: true, lastSync: null },
      myprio: { key: "7824736068450001", enabled: true, lastSync: null },
      viaverde: { key: "AA-00-BB", enabled: true, lastSync: null },
    },
    cards: {
      myprio: "123456789",
      viaverde: "AA-00-BB",
    },
    banking: {
      iban: "PT50000000000000000000000",
      accountHolder: "Test Driver",
    },
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    totalTrips: 0,
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
  };

  try {
    await adminDb.collection("drivers").doc(testDriver.id).set(testDriver, { merge: true });
    console.log(`✅ Motorista de teste '${testDriver.fullName}' adicionado/atualizado com sucesso.`);
  } catch (error) {
    console.error("❌ Erro ao adicionar motorista de teste:", error);
  }
}

addTestDriver();

