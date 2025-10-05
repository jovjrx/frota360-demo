import { 
  BaseIntegrationClient, 
  IntegrationCredentials, 
  ConnectionTestResult, 
  Trip, 
  Earnings, 
  Driver 
} from '../base-client';

interface BoltCredentials extends IntegrationCredentials {
  clientId: string;
  clientSecret: string;
}

interface BoltAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface BoltTrip {
  id: string;
  driver_id: string;
  status: string;
  start_time: string;
  end_time?: string;
  distance_km: number;
  price: {
    amount: number;
    currency: string;
  };
}

interface BoltDriver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

export class BoltClient extends BaseIntegrationClient {
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(credentials: BoltCredentials) {
    // Base URL oficial da API Bolt Fleet Integration Gateway
    super(credentials, 'https://node.bolt.eu/fleet-integration-gateway');
  }

  getPlatformName(): string {
    return 'Bolt';
  }

  async authenticate(): Promise<void> {
    try {
      const response = await fetch('https://oidc.bolt.eu/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.credentials.clientId as string,
          client_secret: this.credentials.clientSecret as string,
          grant_type: 'client_credentials',
          scope: 'fleet-integration:api',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bolt authentication failed: ${response.statusText} - ${errorText}`);
      }

      const data: BoltAuthResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      this.isAuthenticated = true;
    } catch (error) {
      console.error('Bolt authentication error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      await this.authenticate();
      
      // Test endpoint da documentação oficial
      const response = await this.makeRequest('POST', '/fleetIntegration/v1/test');
      
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

  async getTrips(startDate: string, endDate: string): Promise<Trip[]> {
    try {
      // Bolt usa POST para getFleetOrders (viagens)
      const response = await this.makeRequest('POST', '/fleetIntegration/v1/getFleetOrders', {
        from: new Date(startDate).getTime(),
        to: new Date(endDate).getTime(),
      });

      const trips: BoltTrip[] = response.orders || [];
      
      return trips.map(trip => ({
        id: trip.id,
        date: new Date(parseInt(trip.start_time) || 0).toISOString().split('T')[0],
        startTime: new Date(parseInt(trip.start_time) || 0).toISOString(),
        endTime: trip.end_time ? new Date(parseInt(trip.end_time) || 0).toISOString() : '',
        distance: (trip.distance_km || 0) / 1000, // Bolt pode retornar em metros
        duration: trip.end_time && trip.start_time 
          ? (parseInt(trip.end_time) - parseInt(trip.start_time)) / 60000 // ms para minutos
          : 0,
        earnings: trip.price?.amount || 0,
        driverId: trip.driver_id,
        status: this.mapTripStatus(trip.status),
      }));
    } catch (error) {
      console.error('Error fetching Bolt trips:', error);
      return [];
    }
  }

  async getEarnings(startDate: string, endDate: string): Promise<Earnings> {
    try {
      const trips = await this.getTrips(startDate, endDate);
      const totalEarnings = trips.reduce((sum, trip) => sum + trip.earnings, 0);
      
      return {
        total: totalEarnings,
        trips: trips.length,
        averagePerTrip: trips.length > 0 ? totalEarnings / trips.length : 0,
        period: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      console.error('Error calculating Bolt earnings:', error);
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
  }

  async getDrivers(): Promise<Driver[]> {
    try {
      // Bolt usa POST para getDrivers
      const response = await this.makeRequest('POST', '/fleetIntegration/v1/getDrivers', {});
      const drivers: BoltDriver[] = response.drivers || [];
      
      return drivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: this.mapDriverStatus(driver.status),
        totalTrips: 0, // Would need additional API call
        totalEarnings: 0, // Would need additional API call
      }));
    } catch (error) {
      console.error('Error fetching Bolt drivers:', error);
      return [];
    }
  }

  private mapTripStatus(boltStatus: string): 'completed' | 'cancelled' | 'pending' {
    switch (boltStatus.toLowerCase()) {
      case 'completed':
      case 'finished':
        return 'completed';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private mapDriverStatus(boltStatus: string): 'active' | 'inactive' | 'suspended' {
    switch (boltStatus.toLowerCase()) {
      case 'active':
      case 'online':
        return 'active';
      case 'inactive':
      case 'offline':
        return 'inactive';
      case 'suspended':
      case 'blocked':
        return 'suspended';
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
    if (!this.accessToken || (this.tokenExpiry && new Date() >= this.tokenExpiry)) {
      await this.authenticate();
    }

    const authHeaders = {
      'Authorization': `Bearer ${this.accessToken}`,
      ...headers,
    };

    return super.makeRequest(method, endpoint, data, authHeaders);
  }
}

// Factory function para criar instância com env vars
export function createBoltClient(): BoltClient {
  const clientId = process.env.BOLT_CLIENT_ID || '';
  const clientSecret = process.env.BOLT_SECRET || '';

  if (!clientId || !clientSecret) {
    throw new Error('BOLT_CLIENT_ID and BOLT_SECRET are required');
  }

  return new BoltClient({
    clientId,
    clientSecret,
  });
}