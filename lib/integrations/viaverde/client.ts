import { 
  BaseIntegrationClient, 
  IntegrationCredentials, 
  ConnectionTestResult, 
  Transaction 
} from '../base-client';

interface ViaVerdeCredentials extends IntegrationCredentials {
  email: string;
  password: string;
}

interface ViaVerdeAuthResponse {
  token: string;
  expires_in: number;
  user_id: string;
}

interface ViaVerdeTransaction {
  id: string;
  date: string;
  amount: number;
  type: string;
  location: string;
  description: string;
}

export class ViaVerdeClient extends BaseIntegrationClient {
  private authToken?: string;
  private tokenExpiry?: Date;

  constructor(credentials: ViaVerdeCredentials) {
    super(credentials, 'https://api.viaverde.pt/v1');
  }

  getPlatformName(): string {
    return 'ViaVerde';
  }

  async authenticate(): Promise<void> {
    try {
      const response = await fetch('https://api.viaverde.pt/v1/auth/login', {
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
        throw new Error(`ViaVerde authentication failed: ${response.statusText}`);
      }

      const data: ViaVerdeAuthResponse = await response.json();
      this.authToken = data.token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      this.isAuthenticated = true;
    } catch (error) {
      console.error('ViaVerde authentication error:', error);
      throw new Error('Failed to authenticate with ViaVerde');
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      await this.authenticate();
      
      // Test with a simple API call
      const response = await this.makeRequest('GET', '/transactions?limit=1');
      
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

  async getTransactions(startDate: string, endDate: string): Promise<Transaction[]> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/transactions?start_date=${startDate}&end_date=${endDate}`
      );

      const transactions: ViaVerdeTransaction[] = response.transactions || [];
      
      return transactions.map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        amount: transaction.amount,
        type: this.mapTransactionType(transaction.type),
        location: transaction.location,
        description: transaction.description,
      }));
    } catch (error) {
      console.error('Error fetching ViaVerde transactions:', error);
      return [];
    }
  }

  async getExpensesByCategory(startDate: string, endDate: string): Promise<{
    toll: number;
    parking: number;
    fuel: number;
    other: number;
    total: number;
  }> {
    try {
      const transactions = await this.getTransactions(startDate, endDate);
      
      const expenses = {
        toll: 0,
        parking: 0,
        fuel: 0,
        other: 0,
        total: 0,
      };

      transactions.forEach(transaction => {
        expenses[transaction.type] += transaction.amount;
        expenses.total += transaction.amount;
      });

      return expenses;
    } catch (error) {
      console.error('Error calculating ViaVerde expenses:', error);
      return {
        toll: 0,
        parking: 0,
        fuel: 0,
        other: 0,
        total: 0,
      };
    }
  }

  async getTrips(startDate: string, endDate: string): Promise<any[]> {
    // ViaVerde doesn't provide trip data
    return [];
  }

  async getEarnings(startDate: string, endDate: string): Promise<any> {
    // ViaVerde doesn't provide earnings data
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
    // ViaVerde doesn't provide driver data
    return [];
  }

  private mapTransactionType(viaverdeType: string): 'toll' | 'parking' | 'fuel' | 'other' {
    switch (viaverdeType.toLowerCase()) {
      case 'toll':
      case 'portagem':
        return 'toll';
      case 'parking':
      case 'estacionamento':
        return 'parking';
      case 'fuel':
      case 'combustivel':
        return 'fuel';
      default:
        return 'other';
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