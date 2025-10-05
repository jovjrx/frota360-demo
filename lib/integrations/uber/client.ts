import { 
  BaseIntegrationClient, 
  IntegrationCredentials, 
  ConnectionTestResult, 
  Trip, 
  Earnings, 
  Driver 
} from '../base-client';

interface UberCredentials extends IntegrationCredentials {
  clientId: string;
  clientSecret: string;
  orgUuid: string;
}

interface UberAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface UberTrip {
  trip_id: string;
  vehicle_view_id: string;
  driver_id: string;
  trip_status: string;
  start_time: number;
  end_time?: number;
  distance: number;
  fare: {
    total: number;
  };
}

interface UberDriver {
  driver_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  status: string;
}

export class UberClient extends BaseIntegrationClient {
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(credentials: UberCredentials) {
    super(credentials, 'https://api.uber.com/v1');
  }

  getPlatformName(): string {
    return 'Uber';
  }

  async authenticate(): Promise<void> {
    try {
      const response = await fetch('https://login.uber.com/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.credentials.clientId as string,
          client_secret: this.credentials.clientSecret as string,
          grant_type: 'client_credentials',
          scope: 'business.trips business.earnings',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Uber authentication failed: ${response.statusText} - ${errorText}`);
      }

      const data: UberAuthResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      this.isAuthenticated = true;
    } catch (error) {
      console.error('Uber authentication error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      await this.authenticate();
      
      // Test with a simple API call
      const response = await this.makeRequest('GET', '/organizations');
      
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
      const orgUuid = this.credentials.orgUuid as string;
      const response = await this.makeRequest(
        'GET',
        `/organizations/${orgUuid}/trips?start_time=${startDate}&end_time=${endDate}`
      );

      const trips: UberTrip[] = response.trips || [];
      
      return trips.map(trip => ({
        id: trip.trip_id,
        date: new Date(trip.start_time * 1000).toISOString().split('T')[0],
        startTime: new Date(trip.start_time * 1000).toISOString(),
        endTime: trip.end_time ? new Date(trip.end_time * 1000).toISOString() : '',
        distance: trip.distance || 0,
        duration: trip.end_time ? (trip.end_time - trip.start_time) / 60 : 0, // minutes
        earnings: trip.fare?.total || 0,
        driverId: trip.driver_id,
        status: this.mapTripStatus(trip.trip_status),
      }));
    } catch (error) {
      console.error('Error fetching Uber trips:', error);
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
      console.error('Error calculating Uber earnings:', error);
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
      const orgUuid = this.credentials.orgUuid as string;
      const response = await this.makeRequest(
        'GET',
        `/organizations/${orgUuid}/drivers`
      );

      const drivers: UberDriver[] = response.drivers || [];
      
      return drivers.map(driver => ({
        id: driver.driver_id,
        name: `${driver.first_name} ${driver.last_name}`,
        email: driver.email,
        phone: driver.phone_number,
        status: this.mapDriverStatus(driver.status),
        totalTrips: 0, // Would need additional API call
        totalEarnings: 0, // Would need additional API call
      }));
    } catch (error) {
      console.error('Error fetching Uber drivers:', error);
      return [];
    }
  }

  private mapTripStatus(uberStatus: string): 'completed' | 'cancelled' | 'pending' {
    switch (uberStatus) {
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
      case 'NO_SHOW':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private mapDriverStatus(uberStatus: string): 'active' | 'inactive' | 'suspended' {
    switch (uberStatus) {
      case 'ACTIVE':
        return 'active';
      case 'INACTIVE':
        return 'inactive';
      case 'SUSPENDED':
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
export function createUberClient(): UberClient {
  const clientId = process.env.UBER_CLIENT_ID || '';
  const clientSecret = process.env.UBER_CLIENT_SECRET || '';
  const orgUuid = process.env.UBER_ORG_UUID || '';

  if (!clientId || !clientSecret || !orgUuid) {
    throw new Error('UBER_CLIENT_ID, UBER_CLIENT_SECRET and UBER_ORG_UUID are required');
  }

  return new UberClient({
    clientId,
    clientSecret,
    orgUuid,
  });
}
