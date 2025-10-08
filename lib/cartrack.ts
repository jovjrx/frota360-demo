import { adminDb } from "./firebaseAdmin";

interface CartrackIntegration {
  username: string;
  apiKey: string;
  baseUrl: string;
}

interface CartrackClient {
  getTrips: (vehicleId: string, startDate: string, endDate: string) => Promise<any>;
  getLatestPosition: (vehicleId: string) => Promise<any>;
}

let cartrackClientInstance: CartrackClient | null = null;

async function initializeCartrackClient(): Promise<CartrackClient> {
  if (cartrackClientInstance) {
    return cartrackClientInstance;
  }

  const integrationDoc = await adminDb.collection("integrations").doc("cartrack").get();
  if (!integrationDoc.exists) {
    throw new Error("Cartrack integration not found in Firebase.");
  }

  const { username, apiKey, baseUrl } = integrationDoc.data() as CartrackIntegration;

  if (!username || !apiKey || !baseUrl) {
    throw new Error("Cartrack credentials missing.");
  }

  // Implementação mock do cliente Cartrack. Em um ambiente real, aqui seria a integração com a API real.
  cartrackClientInstance = {
    getTrips: async (vehicleId: string, startDate: string, endDate: string) => {
      console.log(`Mock Cartrack: Getting trips for vehicle ${vehicleId} from ${startDate} to ${endDate}`);
      // Simular chamada à API Cartrack
      return Promise.resolve({
        trips: [
          // Dados de exemplo
          { id: "trip1", vehicleId, start: "2025-10-01T08:00:00Z", end: "2025-10-01T09:00:00Z", distance: 50, duration: 3600, startLat: 38.7223, startLng: -9.1393, endLat: 38.7167, endLng: -9.1467 },
          { id: "trip2", vehicleId, start: "2025-10-01T10:00:00Z", end: "2025-10-01T11:30:00Z", distance: 80, duration: 5400, startLat: 38.7167, startLng: -9.1467, endLat: 38.7000, endLng: -9.1500 },
        ],
      });
    },
    getLatestPosition: async (vehicleId: string) => {
      console.log(`Mock Cartrack: Getting latest position for vehicle ${vehicleId}`);
      // Simular chamada à API Cartrack
      return Promise.resolve({
        latitude: 38.7223,
        longitude: -9.1393,
        timestamp: new Date().toISOString(),
        speed: 60,
      });
    },
  };

  return cartrackClientInstance;
}

export async function getCartrackClient(): Promise<CartrackClient> {
  return initializeCartrackClient();
}

