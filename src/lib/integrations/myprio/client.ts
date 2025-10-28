import { 
  BaseIntegrationClient, 
  IntegrationCredentials, 
  ConnectionTestResult, 
  Expense 
} from '../base-client';

interface MyprioCredentials extends IntegrationCredentials {
  accountId: string;
  password: string;
}

interface MyprioAuthResponse {
  token: string;
  expires_in: number;
  user_id: string;
}

interface MyprioExpense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  receipt_url?: string;
}

export class MyprioClient extends BaseIntegrationClient {
  private authToken?: string;
  private tokenExpiry?: Date;

  constructor(credentials: MyprioCredentials) {
    super(credentials, 'https://api.myprio.com/v1');
  }

  getPlatformName(): string {
    return 'myprio';
  }

  async authenticate(): Promise<void> {
    try {
      const response = await fetch('https://api.myprio.com/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: this.credentials.accountId as string,
          password: this.credentials.password as string,
        }),
      });

      if (!response.ok) {
        throw new Error(`myprio authentication failed: ${response.statusText}`);
      }

      const data: MyprioAuthResponse = await response.json();
      this.authToken = data.token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
      this.isAuthenticated = true;
    } catch (error) {
      console.error('myprio authentication error:', error);
      throw new Error('Failed to authenticate with myprio');
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      await this.authenticate();
      
      // Test with a simple API call
      const response = await this.makeRequest('GET', '/expenses?limit=1');
      
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

  async getExpenses(startDate: string, endDate: string): Promise<Expense[]> {
    try {
      const response = await this.makeRequest(
        'GET',
        `/expenses?start_date=${startDate}&end_date=${endDate}`
      );

      const expenses: MyprioExpense[] = response.expenses || [];
      
      return expenses.map(expense => ({
        id: expense.id,
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        receipt: expense.receipt_url,
      }));
    } catch (error) {
      console.error('Error fetching myprio expenses:', error);
      return [];
    }
  }

  async getExpensesByCategory(startDate: string, endDate: string): Promise<{
    [category: string]: number;
    total: number;
  }> {
    try {
      const expenses = await this.getExpenses(startDate, endDate);
      
      const categoryTotals: { [category: string]: number } = {};
      let total = 0;

      expenses.forEach(expense => {
        if (!categoryTotals[expense.category]) {
          categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category] += expense.amount;
        total += expense.amount;
      });

      return {
        ...categoryTotals,
        total,
      };
    } catch (error) {
      console.error('Error calculating myprio expenses by category:', error);
      return {
        total: 0,
      };
    }
  }

  async getMonthlyComparison(startDate: string, endDate: string): Promise<{
    currentMonth: number;
    previousMonth: number;
    difference: number;
    percentageChange: number;
  }> {
    try {
      const currentExpenses = await this.getExpenses(startDate, endDate);
      const currentTotal = currentExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Calculate previous month dates
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const prevStartDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() - 1, startDateObj.getDate());
      const prevEndDate = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - 1, endDateObj.getDate());

      const prevExpenses = await this.getExpenses(
        prevStartDate.toISOString().split('T')[0],
        prevEndDate.toISOString().split('T')[0]
      );
      const prevTotal = prevExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      const difference = currentTotal - prevTotal;
      const percentageChange = prevTotal > 0 ? (difference / prevTotal) * 100 : 0;

      return {
        currentMonth: currentTotal,
        previousMonth: prevTotal,
        difference,
        percentageChange,
      };
    } catch (error) {
      console.error('Error calculating monthly comparison:', error);
      return {
        currentMonth: 0,
        previousMonth: 0,
        difference: 0,
        percentageChange: 0,
      };
    }
  }

  async getTrips(startDate: string, endDate: string): Promise<any[]> {
    // myprio doesn't provide trip data
    return [];
  }

  async getEarnings(startDate: string, endDate: string): Promise<any> {
    // myprio doesn't provide earnings data
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
    // myprio doesn't provide driver data
    return [];
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

