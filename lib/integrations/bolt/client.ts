import { 
  BaseIntegrationClient, 
  IntegrationCredentials, 
  ConnectionTestResult, 
  Trip, 
  Earnings, 
  Driver 
} from '../base-client';

interface BoltCredentials extends IntegrationCredentials {
  email: string;
  password: string;
}

interface BoltAuthResponse {
  token: string;
  expires_at: string;
  user_id: string;
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
  private authToken?: string;
  private tokenExpiry?: Date;
  private userId?: string;

  constructor(credentials: BoltCredentials) {
    super(credentials, 'https://api.bolt.eu/v1');
  }

  getPlatformName(): string {
    return 'Bolt';
  }

  async authenticate(): Promise<void> {
    try {
      const response = await fetch('https://api.bolt.eu/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.credentials.email as string,
          password: this.credentials.password as string,
        }),
      });

      if (!response.ok) {
        throw new Error(`Bolt authentication failed: ${response.statusText}`);
      }

      const data: BoltAuthResponse = await response.json();
      this.authToken = data.token;
      this.tokenExpiry = new Date(data.expires_at);
      this.userId = data.user_id;
      this.isAuthenticated = true;
    } catch (error) {
      console.error('Bolt authentication error:', error);
      throw new Error('Failed to authenticate with Bolt');
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      await this.authenticate();
      
      // Test with a simple API call
      const response = await this.makeRequest('GET', '/user/profile');
      
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
      const response = await this.makeRequest(
        'GET',
        `/trips?start_date=${startDate}&end_date=${endDate}`
      );

      const trips: BoltTrip[] = response.trips || [];
      
      return trips.map(trip => ({
        id: trip.id,
        date: new Date(trip.start_time).toISOString().split('T')[0],
        startTime: trip.start_time,
        endTime: trip.end_time || '',
        distance: trip.distance_km || 0,
        duration: trip.end_time ? 
          (new Date(trip.end_time).getTime() - new Date(trip.start_time).getTime()) / 60000 : 0, // minutes
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
      const response = await this.makeRequest('GET', '/drivers');
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
    if (!this.authToken || (this.tokenExpiry && new Date() >= this.tokenExpiry)) {
      await this.authenticate();
    }

    const authHeaders = {
      'Authorization': `Bearer ${this.authToken}`,
      'X-User-ID': this.userId || '',
      ...headers,
    };

    return super.makeRequest(method, endpoint, data, authHeaders);
  }
}