export interface IntegrationCredentials {
  [key: string]: string | number;
}

export interface IntegrationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface ConnectionTestResult {
  success: boolean;
  error?: string;
  lastSync?: string;
  data?: any;
}

export interface Trip {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  earnings: number;
  driverId: string;
  status: 'completed' | 'cancelled' | 'pending';
  driver_id?: string;
  fare?: {
    value: number;
    currency?: string;
  };
  tip?: number;
  tolls?: number;
  currency?: string;
  raw?: Record<string, unknown>;
}

export interface Earnings {
  total: number;
  trips: number;
  averagePerTrip: number;
  period: {
    start: string;
    end: string;
  };
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  totalTrips: number;
  totalEarnings: number;
}

export interface VehicleData {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  status: 'active' | 'inactive' | 'maintenance';
  kilometers: number;
  lastMaintenance?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'toll' | 'parking' | 'fuel' | 'other';
  location: string;
  description: string;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  tax: number;
  status: 'paid' | 'pending' | 'overdue';
  customer: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  receipt?: string;
}

export abstract class BaseIntegrationClient {
  protected baseUrl: string;
  protected credentials: IntegrationCredentials;
  protected isAuthenticated: boolean = false;

  constructor(credentials: IntegrationCredentials, baseUrl: string) {
    this.credentials = credentials;
    this.baseUrl = baseUrl;
  }

  /**
   * Authenticate with the external service
   */
  abstract authenticate(): Promise<void>;

  /**
   * Test connection to the external service
   */
  abstract testConnection(): Promise<ConnectionTestResult>;

  /**
   * Make a request to the external service
   */
  protected async makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    if (!this.isAuthenticated) {
      await this.authenticate();
    }

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Integration request failed: ${method} ${url}`, error);
      throw error;
    }
  }

  /**
   * Get trips data for a date range
   */
  abstract getTrips(startDate: string, endDate: string): Promise<Trip[]>;

  /**
   * Get earnings data for a date range
   */
  abstract getEarnings(startDate: string, endDate: string): Promise<Earnings>;

  /**
   * Get active drivers
   */
  abstract getDrivers(): Promise<Driver[]>;

  /**
   * Format date to the expected format for the integration
   */
  protected formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Get the platform name
   */
  abstract getPlatformName(): string;

  /**
   * Get the platform status
   */
  async getStatus(): Promise<{
    online: boolean;
    lastSync: string;
    errors: string[];
  }> {
    try {
      const testResult = await this.testConnection();
      return {
        online: testResult.success,
        lastSync: testResult.lastSync || new Date().toISOString(),
        errors: testResult.error ? [testResult.error] : [],
      };
    } catch (error) {
      return {
        online: false,
        lastSync: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }
}