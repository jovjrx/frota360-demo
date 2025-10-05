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
  private authToken?: string;
  private tokenExpiry?: Date;

  constructor(credentials: CartrackCredentials) {
    super(credentials, 'https://api.cartrack.com/v1');
  }

  getPlatformName(): string {
    return 'Cartrack';
  }

  async authenticate(): Promise<void> {
    try {
      const response = await fetch('https://api.cartrack.com/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.credentials.username as string,
          password: this.credentials.password as string,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cartrack authentication failed: ${response.statusText}`);
      }

      const data: CartrackAuthResponse = await response.json();
      this.authToken = data.token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      this.isAuthenticated = true;
    } catch (error) {
      console.error('Cartrack authentication error:', error);
      throw new Error('Failed to authenticate with Cartrack');
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      await this.authenticate();
      
      // Test with a simple API call
      const response = await this.makeRequest('GET', '/vehicles');
      
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
      
      // This would require additional API calls to get actual usage data
      const mockTotalKm = vehicles.reduce((sum, v) => sum + v.kilometers, 0);
      
      return {
        totalVehicles: vehicles.length,
        activeVehicles,
        totalKilometers: mockTotalKm,
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
    // Cartrack doesn't provide trip data in the same way as Uber/Bolt
    // This would be implemented based on actual Cartrack API documentation
    return [];
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
    if (!this.authToken || (this.tokenExpiry && new Date() >= this.tokenExpiry)) {
      await this.authenticate();
    }

    const authHeaders = {
      'Authorization': `Bearer ${this.authToken}`,
      ...headers,
    };

    return super.makeRequest(method, endpoint, data, authHeaders);
  }
}