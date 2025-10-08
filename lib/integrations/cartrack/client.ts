import { 
  BaseIntegrationClient, 
  IntegrationCredentials, 
  ConnectionTestResult, 
  VehicleData 
} from '../base-client';
import integrationService from '../integration-service';

interface CartrackCredentials extends IntegrationCredentials {
  username: string;
  apiKey: string;
}

interface CartrackAuthResponse {
  token: string;
  expires_in: number;
  user_id: string;
}

interface CartrackVehicle {
  vehicle_id: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  status: string;
  odometer: number;
  last_service?: string;
}

export class CartrackClient extends BaseIntegrationClient {
  private authHeader: string;

  constructor(credentials: CartrackCredentials) {
    // Cartrack Portugal usa Basic Auth com API Key
    super(credentials, 'https://fleetapi-pt.cartrack.com/rest');
    
    // Criar Basic Auth header usando username + API Key
    const auth = `${credentials.username}:${credentials.apiKey}`;
    this.authHeader = `Basic ${Buffer.from(auth).toString('base64')}`;
    this.isAuthenticated = true; // Basic auth doesn't need separate authentication
  }

  getPlatformName(): string {
    return 'Cartrack';
  }

  async authenticate(): Promise<void> {
    // Cartrack usa Basic Auth, então não precisa de autenticação separada
    // Apenas testa a conexão
    try {
      await this.makeRequest('GET', '/vehicles/status');
      this.isAuthenticated = true;
    } catch (error) {
      console.error('Cartrack authentication error:', error);
      throw new Error('Failed to authenticate with Cartrack');
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      // Test with a simple API call
      const response = await this.makeRequest('GET', '/vehicles/status');
      
      return {
        success: true,
        lastSync: new Date().toISOString(),
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getVehicles(): Promise<VehicleData[]> {
    try {
      const response = await this.makeRequest('GET', '/vehicles');
      const vehicles: CartrackVehicle[] = response.vehicles || [];
      
      return vehicles.map(vehicle => ({
        id: vehicle.vehicle_id,
        plate: vehicle.registration,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        status: this.mapVehicleStatus(vehicle.status),
        kilometers: vehicle.odometer,
        lastMaintenance: vehicle.last_service,
      }));
    } catch (error) {
      console.error('Error fetching Cartrack vehicles:', error);
      return [];
    }
  }

  async getVehicleUtilization(startDate: string, endDate: string): Promise<{
    totalVehicles: number;
    activeVehicles: number;
    totalKilometers: number;
    averageUtilization: number;
  }> {
    try {
      const vehicles = await this.getVehicles();
      const activeVehicles = vehicles.filter(v => v.status === 'active').length;
      
      // Buscar dados de viagens para calcular kilometragem real
      const trips = await this.getTrips(startDate, endDate);
      const totalKilometers = trips.reduce((sum: number, trip: any) => sum + (trip.distance_km || 0), 0);
      
      return {
        totalVehicles: vehicles.length,
        activeVehicles,
        totalKilometers,
        averageUtilization: vehicles.length > 0 ? (activeVehicles / vehicles.length) * 100 : 0,
      };
    } catch (error) {
      console.error('Error calculating vehicle utilization:', error);
      return {
        totalVehicles: 0,
        activeVehicles: 0,
        totalKilometers: 0,
        averageUtilization: 0,
      };
    }
  }

  async getTrips(startDate: string, endDate: string): Promise<any[]> {
    try {
      // According to Cartrack API docs: GET /trips with timestamps in format "YYYY-MM-DD HH:MM:SS"
      // Example: "2025-09-28 00:00:00"
      const startTimestamp = `${startDate} 00:00:00`;
      const endTimestamp = `${endDate} 23:59:59`;
      
      console.log(`[Cartrack] Fetching trips from ${startTimestamp} to ${endTimestamp}`);
      
      const params = new URLSearchParams({
        'filter[start_timestamp]': startTimestamp,
        'filter[end_timestamp]': endTimestamp,
        limit: '1000',
        page: '1',
      });

      const response = await this.makeRequest('GET', `/trips?${params.toString()}`);
      const trips = response.data || [];
      
      console.log(`[Cartrack] Received ${trips.length} trips`);
      if (trips.length > 0) {
        const firstTrip = trips[0];
        const lastTrip = trips[trips.length - 1];
        console.log(`[Cartrack] First trip: ${firstTrip.start_timestamp}, Last trip: ${lastTrip.start_timestamp}`);
      }
      
      return trips;
    } catch (error) {
      console.error('Error fetching Cartrack trips:', error);
      return [];
    }
  }

  async getFuelData(startDate: string, endDate: string): Promise<any> {
    try {
      // According to Cartrack API docs: There are multiple fuel endpoints
      // Try /mifleet/fuel first (from documentation)
      const startTimestamp = `${startDate} 00:00:00`;
      const endTimestamp = `${endDate} 23:59:59`;
      
      const body = {
        registrations: [], // Empty array for all vehicles
        start_timestamp: startTimestamp,
        end_timestamp: endTimestamp,
        page: 1,
        limit: 1000,
      };
      
      // Try mifleet/fuel endpoint
      try {
        const response = await this.makeRequest('GET', `/mifleet/fuel?filter[start_timestamp]=${encodeURIComponent(startTimestamp)}&filter[end_timestamp]=${encodeURIComponent(endTimestamp)}&limit=1000`);
        return response;
      } catch (err) {
        // If that fails, fuel data might not be available or require different endpoint
        console.warn('MiFleet fuel endpoint not available, trying alternative');
        return { data: [], meta: null };
      }
    } catch (error) {
      console.error('Error fetching Cartrack fuel data:', error);
      return { data: [], meta: null };
    }
  }

  async getMaintenanceData(startDate: string, endDate: string): Promise<any[]> {
    try {
      // According to Cartrack API docs: Try /mifleet/maintenance
      const startTimestamp = `${startDate} 00:00:00`;
      const endTimestamp = `${endDate} 23:59:59`;
      
      const params = new URLSearchParams({
        'filter[start_timestamp]': startTimestamp,
        'filter[end_timestamp]': endTimestamp,
        limit: '1000',
      });
      
      try {
        const response = await this.makeRequest('GET', `/mifleet/maintenance?${params.toString()}`);
        return response.data || [];
      } catch (err) {
        // If that fails, try without mifleet prefix
        console.warn('MiFleet maintenance endpoint not available');
        return [];
      }
    } catch (error) {
      console.error('Error fetching Cartrack maintenance data:', error);
      return [];
    }
  }

  async getMetrics(startDate: string, endDate: string): Promise<any> {
    try {
      const [vehicles, trips, fuelData, maintenanceData] = await Promise.all([
        this.getVehicles(),
        this.getTrips(startDate, endDate),
        this.getFuelData(startDate, endDate),
        this.getMaintenanceData(startDate, endDate),
      ]);

      const activeVehicles = vehicles.filter(v => v.status === 'active').length;
      
      // API Cartrack retorna trip_distance em METROS e trip_duration_seconds
      const totalDistance = trips.reduce((sum: number, t: any) => {
        const distanceMeters = t.trip_distance || 0;
        return sum + (distanceMeters / 1000); // Converter metros para km
      }, 0);
      
      const totalDuration = trips.reduce((sum: number, t: any) => {
        const durationSeconds = t.trip_duration_seconds || 0;
        return sum + (durationSeconds / 60); // Converter segundos para minutos
      }, 0);
      
      // Fuel data now comes in data array format from API
      const fuelDataArray = fuelData.data || [];
      const fuelConsumed = fuelDataArray.reduce((sum: number, f: any) => sum + (f.fuel_consumed_liters || 0), 0);
      const fuelCost = fuelDataArray.reduce((sum: number, f: any) => sum + (f.cost || 0), 0);
      const avgConsumption = fuelDataArray.length > 0 
        ? fuelDataArray.reduce((sum: number, f: any) => sum + (f.consumption_per_100km || 0), 0) / fuelDataArray.length
        : 0;
      
      const maintenanceCost = maintenanceData.reduce((sum: number, m: any) => sum + (m.cost || 0), 0);

      return {
        vehicles: {
          total: vehicles.length,
          active: activeVehicles,
          inactive: vehicles.length - activeVehicles,
        },
        trips: {
          total: trips.length,
          totalDistanceKm: totalDistance,
          totalDurationHours: totalDuration / 60,
        },
        fuel: {
          totalLiters: fuelConsumed,
          totalCost: fuelCost,
          avgConsumption: avgConsumption,
        },
        maintenance: {
          totalCost: maintenanceCost,
          eventsCount: maintenanceData.length,
        },
        summary: {
          totalExpenses: fuelCost + maintenanceCost,
          activeVehicles,
        },
      };
    } catch (error) {
      console.error('Error fetching Cartrack metrics:', error);
      throw error;
    }
  }

  async getEarnings(startDate: string, endDate: string): Promise<any> {
    // Cartrack doesn't provide earnings data
    return {
      total: 0,
      trips: 0,
      averagePerTrip: 0,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  }

  async getDrivers(): Promise<any[]> {
    // Cartrack doesn't provide driver data
    return [];
  }

  private mapVehicleStatus(cartrackStatus: string): 'active' | 'inactive' | 'maintenance' {
    switch (cartrackStatus.toLowerCase()) {
      case 'active':
      case 'online':
        return 'active';
      case 'maintenance':
      case 'service':
        return 'maintenance';
      default:
        return 'inactive';
    }
  }

  async getMonthlyData(year: number, month: number): Promise<any> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    try {
      const [vehicles, utilization] = await Promise.all([
        this.getVehicles(),
        this.getVehicleUtilization(startDate, endDate)
      ]);

      return {
        success: true,
        data: {
          vehicles: {
            total: utilization.totalVehicles,
            active: utilization.activeVehicles,
            list: vehicles
          },
          trips: {
            total: 0,
            totalDistance: utilization.totalKilometers
          },
          fuel: {
            totalCost: 0,
            transactions: 0
          }
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  protected async makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    // Cartrack usa Basic Auth, não Bearer token
    const authHeaders = {
      'Authorization': this.authHeader,
      ...headers,
    };

    return super.makeRequest(method, endpoint, data, authHeaders);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Cria instância do Cartrack Client a partir do Firestore (RECOMENDADO)
 * Usa o IntegrationService para buscar credenciais do Firestore com cache
 */
export async function createCartrackClient(): Promise<CartrackClient> {
  // Busca integração do Firestore (com cache)
  const integration = await integrationService.getIntegration('cartrack');
  
  if (!integration) {
    throw new Error('Integração Cartrack não encontrada no Firestore. Execute o setup primeiro.');
  }
  
  if (!integration.enabled) {
    throw new Error('Integração Cartrack está desabilitada.');
  }
  
  const { username, apiKey } = integration.credentials;
  
  if (!username || !apiKey) {
    throw new Error('Credenciais Cartrack incompletas no Firestore.');
  }
  
  console.log(`🚗 Cartrack Client criado do Firestore (cached: ${integrationService.getCacheStats().platforms.includes('cartrack')})`);
  
  return new CartrackClient({
    username,
    apiKey,
  });
}

/**
 * Cria instância do Cartrack Client a partir de variáveis de ambiente (LEGADO)
 * Use apenas para testes ou se não quiser usar Firestore
 */
export function createCartrackClientFromEnv(): CartrackClient {
  const username = process.env.CARTRACK_USERNAME || '';
  const apiKey = process.env.CARTRACK_API_KEY || process.env.CARTRACK_PASSWORD || '';

  if (!username || !apiKey) {
    throw new Error('CARTRACK_USERNAME e CARTRACK_API_KEY são obrigatórios nas variáveis de ambiente');
  }

  console.log(`🚗 Cartrack Client criado de variáveis de ambiente`);

  return new CartrackClient({
    username,
    apiKey,
  });
}