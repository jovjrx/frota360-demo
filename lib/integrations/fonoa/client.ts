import { 
  BaseIntegrationClient, 
  IntegrationCredentials, 
  ConnectionTestResult, 
  Invoice 
} from '../base-client';

interface FONOACredentials extends IntegrationCredentials {
  email: string;
  password: string;
}

interface FONOAAuthResponse {
  token: string;
  expires_in: number;
  user_id: string;
}

interface FONOAInvoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  tax_amount: number;
  status: string;
  customer_name: string;
}

export class FONOAClient extends BaseIntegrationClient {
  private authToken?: string;
  private tokenExpiry?: Date;

  constructor(credentials: FONOACredentials) {
    super(credentials, 'https://api.fonoa.com/v1');
  }

  getPlatformName(): string {
    return 'FONOA';
  }

  async authenticate(): Promise<void> {
    try {
      const response = await fetch('https://api.fonoa.com/v1/auth/login', {
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
        throw new Error(`FONOA authentication failed: ${response.statusText}`);
      }

      const data: FONOAAuthResponse = await response.json();
      this.authToken = data.token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      this.isAuthenticated = true;
    } catch (error) {
      console.error('FONOA authentication error:', error);
      throw new Error('Failed to authenticate with FONOA');
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      await this.authenticate();
      
      // Test with a simple API call
      const response = await this.makeRequest('GET', '/invoices?limit=1');
      
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

  async getInvoices(startDate: string, endDate: string): Promise<Invoice[]> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/invoices?start_date=${startDate}&end_date=${endDate}`
      );

      const invoices: FONOAInvoice[] = response.invoices || [];
      
      return invoices.map(invoice => ({
        id: invoice.id,
        number: invoice.number,
        date: invoice.date,
        amount: invoice.amount,
        tax: invoice.tax_amount,
        status: this.mapInvoiceStatus(invoice.status),
        customer: invoice.customer_name,
      }));
    } catch (error) {
      console.error('Error fetching FONOA invoices:', error);
      return [];
    }
  }

  async getInvoiceSummary(startDate: string, endDate: string): Promise<{
    totalInvoiced: number;
    totalTax: number;
    totalPaid: number;
    totalPending: number;
    invoiceCount: number;
  }> {
    try {
      const invoices = await this.getInvoices(startDate, endDate);
      
      const summary = {
        totalInvoiced: 0,
        totalTax: 0,
        totalPaid: 0,
        totalPending: 0,
        invoiceCount: invoices.length,
      };

      invoices.forEach(invoice => {
        summary.totalInvoiced += invoice.amount;
        summary.totalTax += invoice.tax;
        
        if (invoice.status === 'paid') {
          summary.totalPaid += invoice.amount;
        } else {
          summary.totalPending += invoice.amount;
        }
      });

      return summary;
    } catch (error) {
      console.error('Error calculating FONOA invoice summary:', error);
      return {
        totalInvoiced: 0,
        totalTax: 0,
        totalPaid: 0,
        totalPending: 0,
        invoiceCount: 0,
      };
    }
  }

  async getTrips(startDate: string, endDate: string): Promise<any[]> {
    // FONOA doesn't provide trip data
    return [];
  }

  async getEarnings(startDate: string, endDate: string): Promise<any> {
    // FONOA doesn't provide earnings data
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
    // FONOA doesn't provide driver data
    return [];
  }

  private mapInvoiceStatus(fonoaStatus: string): 'paid' | 'pending' | 'overdue' {
    switch (fonoaStatus.toLowerCase()) {
      case 'paid':
      case 'pago':
        return 'paid';
      case 'overdue':
      case 'vencido':
        return 'overdue';
      default:
        return 'pending';
    }
  }

   async getMonthlyData(year: number, month: number): Promise<any> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    try {
      const invoices = await this.getInvoices(startDate, endDate);
      const totalTaxes = invoices.reduce((sum, inv) => sum + (inv.amount * 0.23), 0); // Assumindo 23% de IVA
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

      return {
        success: true,
        data: {
          totalTaxes: Math.round(totalTaxes * 100) / 100,
          totalAmount: Math.round(totalAmount * 100) / 100,
          invoices: invoices.length,
          list: invoices
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
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