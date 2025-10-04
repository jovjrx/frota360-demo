import { BaseIntegrationClient, IntegrationResponse } from '../base-client';

export interface ViaVerdeTransaction {
  id: string;
  date: string;
  time: string;
  location: string;
  amount: number;
  vehicleId: string;
  registration: string;
  type: string; // toll, parking, fuel
}

export interface ViaVerdeAccount {
  id: string;
  balance: number;
  vehicles: Array<{
    id: string;
    registration: string;
    status: string;
  }>;
}

export interface ViaVerdeStats {
  totalTransactions: number;
  totalAmount: number;
  byType: {
    toll: number;
    parking: number;
    fuel: number;
  };
  period: {
    start: string;
    end: string;
  };
}

export class ViaVerdeClient extends BaseIntegrationClient {
  constructor(email: string, password: string) {
    super({
      baseURL: 'https://api.viaverde.pt',
      username: email,
      password: password,
    });
  }

  getName(): string {
    return 'ViaVerde';
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

  async getAccount(): Promise<IntegrationResponse<ViaVerdeAccount>> {
    return this.request<ViaVerdeAccount>('GET', '/api/v1/account');
  }

  async getTransactions(startDate: string, endDate: string): Promise<IntegrationResponse<ViaVerdeTransaction[]>> {
    return this.request<ViaVerdeTransaction[]>('GET', '/api/v1/transactions', undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async getVehicleTransactions(
    vehicleId: string,
    startDate: string,
    endDate: string
  ): Promise<IntegrationResponse<ViaVerdeTransaction[]>> {
    return this.request<ViaVerdeTransaction[]>('GET', `/api/v1/vehicles/${vehicleId}/transactions`, undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async getStats(startDate: string, endDate: string): Promise<IntegrationResponse<ViaVerdeStats>> {
    return this.request<ViaVerdeStats>('GET', '/api/v1/stats', undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }
}

export function createViaVerdeClient(): ViaVerdeClient {
  const email = process.env.VIAVERDE_EMAIL || 'info@alvoradamagistral.eu';
  const password = process.env.VIAVERDE_PASSWORD || 'Alvorada2025@';
  
  return new ViaVerdeClient(email, password);
}
