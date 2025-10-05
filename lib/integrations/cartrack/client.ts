import { 
  BaseIntegrationClient, 
  IntegrationCredentials, 
  ConnectionTestResult, 
  VehicleData 
} from '../base-client';

interface CartrackCredentials extends IntegrationCredentials {
  username: string;
  password: string;
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
    // Cartrack Portugal usa Basic Auth, não bearer token
    super(credentials, process.env.CARTRACK_BASE_URL || 'https://fleetapi-pt.cartrack.com/rest');
    
    // Criar Basic Auth header
    const auth = `${credentials.username}:${credentials.password}`;
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
      // According to API docs: GET /trips with query params
      const params = new URLSearchParams({
        start_timestamp: startDate,
        end_timestamp: endDate,
        limit: '1000',
      });
      const response = await this.makeRequest('GET', `/trips?${params.toString()}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching Cartrack trips:', error);
      return [];
    }
  }

  async getFuelData(startDate: string, endDate: string): Promise<any> {
    try {
      // According to API docs: POST /fuel/consumption with body
      const body = {
        registrations: [],
        start_timestamp: startDate,
        end_timestamp: endDate,
        page: 1,
        limit: 1000,
      };
      const response = await this.makeRequest('POST', '/fuel/consumption', body);
      return response;
    } catch (error) {
      console.error('Error fetching Cartrack fuel data:', error);
      return { data: [], meta: null };
    }
  }

  async getMaintenanceData(startDate: string, endDate: string): Promise<any[]> {
    try {
      // According to API docs: GET /maintenance with filter params
      const params = new URLSearchParams({
        'filter[start_timestamp]': startDate,
        'filter[end_timestamp]': endDate,
        limit: '1000',
      });
      const response = await this.makeRequest('GET', `/maintenance?${params.toString()}`);
      return response.data || [];
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
      const totalDistance = trips.reduce((sum: number, t: any) => sum + (t.distance_km || 0), 0);
      const totalDuration = trips.reduce((sum: number, t: any) => sum + (t.duration_minutes || 0), 0);
      
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

// Factory function para criar instância com env vars
export function createCartrackClient(): CartrackClient {
  const username = process.env.CARTRACK_USERNAME || '';
  const password = process.env.CARTRACK_PASSWORD || '';

  if (!username || !password) {
    throw new Error('CARTRACK_USERNAME and CARTRACK_PASSWORD are required');
  }

  return new CartrackClient({
    username,
    password,
  });
}