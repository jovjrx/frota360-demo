import { BaseIntegrationClient, IntegrationResponse } from '../base-client';

export interface FonoaInvoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  tax: number;
  total: number;
  status: string;
  customer: {
    name: string;
    taxId: string;
  };
}

export interface FonoaTaxReport {
  period: {
    start: string;
    end: string;
  };
  totalRevenue: number;
  totalTax: number;
  taxRate: number;
  invoices: number;
}

export class FonoaClient extends BaseIntegrationClient {
  constructor(email: string, password: string) {
    super({
      baseURL: 'https://api.fonoa.com',
      username: email,
      password: password,
    });
  }

  getName(): string {
    return 'FONOA';
  }

  async testConnection(): Promise<IntegrationResponse> {
    try {
      const response = await this.request('GET', '/v1/account');
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

  async getInvoices(startDate: string, endDate: string): Promise<IntegrationResponse<FonoaInvoice[]>> {
    return this.request<FonoaInvoice[]>('GET', '/v1/invoices', undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async getInvoice(invoiceId: string): Promise<IntegrationResponse<FonoaInvoice>> {
    return this.request<FonoaInvoice>('GET', `/v1/invoices/${invoiceId}`);
  }

  async getTaxReport(startDate: string, endDate: string): Promise<IntegrationResponse<FonoaTaxReport>> {
    return this.request<FonoaTaxReport>('GET', '/v1/tax-reports', undefined, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
  }

  async createInvoice(invoiceData: any): Promise<IntegrationResponse> {
    return this.request('POST', '/v1/invoices', invoiceData);
  }
}

export function createFonoaClient(): FonoaClient {
  const email = process.env.FONOA_EMAIL || 'info@alvoradamagistral.eu';
  const password = process.env.FONOA_PASSWORD || 'Muffin@2017';
  
  return new FonoaClient(email, password);
}
