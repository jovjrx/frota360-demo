import { BaseIntegrationClient, IntegrationResponse } from '../base-client';

export interface BoltTrip {
  id: string;
  driverId: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  fare: number;
  commission: number;
  status: string;
}

export interface BoltDriver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  totalTrips: number;
  totalEarnings: number;
}

export interface BoltStats {
  totalTrips: number;
  totalEarnings: number;
  totalCommissions: number;
  activeDrivers: number;
  period: {
    start: string;
    end: string;
  };
}

export class BoltClient extends BaseIntegrationClient {
  constructor(email: string, password: string) {
    super({
      baseURL: 'https://fleet-api.bolt.eu',
      username: email,
      password: password,
      headers: {
        'X-Fleet-API-Version': '1.0',
      },
    });
  }

  getName(): string {
    return 'Bolt';
  }

  async testConnection(): Promise<IntegrationResponse> {
    try {
      const response = await this.request('GET', '/v1/fleet/info');
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

  async getTrips(startDate: string, endDate: string): Promise<IntegrationResponse<BoltTrip[]>> {
    return this.request<BoltTrip[]>('GET', '/v1/trips', undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async getDrivers(): Promise<IntegrationResponse<BoltDriver[]>> {
    return this.request<BoltDriver[]>('GET', '/v1/drivers');
  }

  async getDriver(driverId: string): Promise<IntegrationResponse<BoltDriver>> {
    return this.request<BoltDriver>('GET', `/v1/drivers/${driverId}`);
  }

  async getStats(startDate: string, endDate: string): Promise<IntegrationResponse<BoltStats>> {
    return this.request<BoltStats>('GET', '/v1/stats', undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async getDriverEarnings(driverId: string, startDate: string, endDate: string): Promise<IntegrationResponse> {
    return this.request('GET', `/v1/drivers/${driverId}/earnings`, undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }
}

export function createBoltClient(): BoltClient {
  const email = process.env.BOLT_EMAIL || 'caroline@alvoradamagistral.eu';
  const password = process.env.BOLT_PASSWORD || 'Muffin@2017';
  
  return new BoltClient(email, password);
}
