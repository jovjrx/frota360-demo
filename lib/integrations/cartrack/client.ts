import { BaseIntegrationClient, IntegrationResponse } from '../base-client';

export interface CartrackVehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  year: number;
  status: string;
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  odometer: number;
  fuelLevel?: number;
}

export interface CartrackTrip {
  id: string;
  vehicleId: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  startLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  endLocation: {
    lat: number;
    lng: number;
    address?: string;
  };
  maxSpeed: number;
  avgSpeed: number;
}

export interface CartrackStats {
  totalVehicles: number;
  activeVehicles: number;
  totalDistance: number;
  totalTrips: number;
  averageSpeed: number;
  fuelConsumption: number;
}

export class CartrackClient extends BaseIntegrationClient {
  constructor(username: string, password: string) {
    super({
      baseURL: 'https://api.cartrack.com',
      username: username,
      password: password,
    });
  }

  getName(): string {
    return 'Cartrack';
  }

  async testConnection(): Promise<IntegrationResponse> {
    try {
      const response = await this.request('GET', '/api/v1/account');
      return {
        success: response.success,
        data: response.data,
        error: response.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getVehicles(): Promise<IntegrationResponse<CartrackVehicle[]>> {
    return this.request<CartrackVehicle[]>('GET', '/api/v1/vehicles');
  }

  async getVehicle(vehicleId: string): Promise<IntegrationResponse<CartrackVehicle>> {
    return this.request<CartrackVehicle>('GET', `/api/v1/vehicles/${vehicleId}`);
  }

  async getVehicleLocation(vehicleId: string): Promise<IntegrationResponse> {
    return this.request('GET', `/api/v1/vehicles/${vehicleId}/location`);
  }

  async getTrips(vehicleId: string, startDate: string, endDate: string): Promise<IntegrationResponse<CartrackTrip[]>> {
    return this.request<CartrackTrip[]>('GET', `/api/v1/vehicles/${vehicleId}/trips`, undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async getStats(startDate: string, endDate: string): Promise<IntegrationResponse<CartrackStats>> {
    return this.request<CartrackStats>('GET', '/api/v1/stats', undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async getVehicleStats(vehicleId: string, startDate: string, endDate: string): Promise<IntegrationResponse> {
    return this.request('GET', `/api/v1/vehicles/${vehicleId}/stats`, undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }
}

export function createCartrackClient(): CartrackClient {
  const username = process.env.CARTRACK_USERNAME || 'ALVO00008';
  const password = process.env.CARTRACK_PASSWORD || 'Alvorada2025@';
  
  return new CartrackClient(username, password);
}
