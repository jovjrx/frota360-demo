import { BaseIntegrationClient, IntegrationResponse } from '../base-client';

export interface MyprioExpense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  vehicleId?: string;
  driverId?: string;
  receipt?: string;
}

export interface MyprioCategory {
  id: string;
  name: string;
  type: string;
  totalAmount: number;
  transactionCount: number;
}

export interface MyprioStats {
  totalExpenses: number;
  byCategory: Record<string, number>;
  period: {
    start: string;
    end: string;
  };
}

export class MyprioClient extends BaseIntegrationClient {
  constructor(accountId: string, password: string) {
    super({
      baseURL: 'https://api.myprio.com',
      username: accountId,
      password: password,
    });
  }

  getName(): string {
    return 'myprio';
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

  async getExpenses(startDate: string, endDate: string): Promise<IntegrationResponse<MyprioExpense[]>> {
    return this.request<MyprioExpense[]>('GET', '/api/v1/expenses', undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async getExpense(expenseId: string): Promise<IntegrationResponse<MyprioExpense>> {
    return this.request<MyprioExpense>('GET', `/api/v1/expenses/${expenseId}`);
  }

  async getCategories(): Promise<IntegrationResponse<MyprioCategory[]>> {
    return this.request<MyprioCategory[]>('GET', '/api/v1/categories');
  }

  async getStats(startDate: string, endDate: string): Promise<IntegrationResponse<MyprioStats>> {
    return this.request<MyprioStats>('GET', '/api/v1/stats', undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async getVehicleExpenses(
    vehicleId: string,
    startDate: string,
    endDate: string
  ): Promise<IntegrationResponse<MyprioExpense[]>> {
    return this.request<MyprioExpense[]>('GET', '/api/v1/expenses', undefined, {
      params: {
        vehicle_id: vehicleId,
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async createExpense(expenseData: Partial<MyprioExpense>): Promise<IntegrationResponse> {
    return this.request('POST', '/api/v1/expenses', expenseData);
  }
}

export function createMyprioClient(): MyprioClient {
  const accountId = process.env.MYPRIO_ACCOUNT_ID || '606845';
  const password = process.env.MYPRIO_PASSWORD || 'Alvorada25@';
  
  return new MyprioClient(accountId, password);
}
