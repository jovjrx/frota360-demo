import puppeteer, { Browser, Page } from 'puppeteer';

interface MyprioExpense {
  date: string;
  category: string;
  description: string;
  amount: number;
  vehicle: string;
}

interface MyprioMonthlyData {
  success: boolean;
  data?: {
    totalFuel: number;
    totalMaintenance: number;
    totalOther: number;
    totalExpenses: number;
    expenses: MyprioExpense[];
  };
  error?: string;
  timestamp: string;
}

export class MyprioScraper {
  private browser?: Browser;
  private page?: Page;
  private username: string;
  private password: string;

  constructor() {
    this.username = process.env.MYPRIO_USERNAME || '606845';
    this.password = process.env.MYPRIO_PASSWORD || 'Alvorada25@';
  }

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async login(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      console.log('[myprio] Navegando para página de login...');
      // URL pode precisar ser ajustada
      await this.page.goto('https://myprio.com/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await this.page.waitForSelector('input[name="username"], input[type="text"]', { timeout: 10000 });

      console.log('[myprio] Preenchendo credenciais...');
      await this.page.type('input[name="username"], input[type="text"]', this.username, { delay: 100 });
      await this.page.type('input[type="password"], input[name="password"]', this.password, { delay: 100 });

      console.log('[myprio] Submetendo formulário...');
      await Promise.all([
        this.page.click('button[type="submit"], input[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      ]);

      const url = this.page.url();
      const isLoggedIn = !url.includes('/login');

      if (isLoggedIn) {
        console.log('[myprio] Login bem-sucedido!');
        return true;
      } else {
        console.error('[myprio] Login falhou');
        return false;
      }
    } catch (error) {
      console.error('[myprio] Erro durante login:', error);
      return false;
    }
  }

  async getMonthlyData(year: number, month: number): Promise<MyprioMonthlyData> {
    try {
      if (!this.browser) {
        await this.init();
      }

      const loginSuccess = await this.login();
      if (!loginSuccess) {
        return {
          success: false,
          error: 'Login failed',
          timestamp: new Date().toISOString()
        };
      }

      if (!this.page) {
        throw new Error('Page not initialized');
      }

      console.log('[myprio] Navegando para despesas...');
      await this.page.goto('https://myprio.com/expenses', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Aplicar filtro de data
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      console.log(`[myprio] Aplicando filtro: ${startDate} a ${endDate}`);

      // Extrair despesas
      const expenses = await this.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr, div[class*="expense"]'));
        
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td, div[class*="cell"]'));
          
          if (cells.length >= 4) {
            const category = cells[1]?.textContent?.trim().toLowerCase() || '';
            
            return {
              date: cells[0]?.textContent?.trim() || '',
              category: category,
              description: cells[2]?.textContent?.trim() || '',
              amount: parseFloat(cells[3]?.textContent?.replace(/[^0-9.]/g, '') || '0'),
              vehicle: cells[4]?.textContent?.trim() || ''
            };
          }
          
          return null;
        }).filter(Boolean);
      });

      // Calcular totais por categoria
      const totalFuel = expenses
        .filter((e: any) => e.category.includes('combust') || e.category.includes('fuel'))
        .reduce((sum: number, e: any) => sum + e.amount, 0);
      
      const totalMaintenance = expenses
        .filter((e: any) => e.category.includes('manuten') || e.category.includes('maintenance') || e.category.includes('repair'))
        .reduce((sum: number, e: any) => sum + e.amount, 0);
      
      const totalOther = expenses
        .filter((e: any) => {
          const cat = e.category;
          return !cat.includes('combust') && !cat.includes('fuel') && 
                 !cat.includes('manuten') && !cat.includes('maintenance') && !cat.includes('repair');
        })
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      const totalExpenses = totalFuel + totalMaintenance + totalOther;

      console.log(`[myprio] Dados extraídos: ${expenses.length} despesas`);

      return {
        success: true,
        data: {
          totalFuel: Math.round(totalFuel * 100) / 100,
          totalMaintenance: Math.round(totalMaintenance * 100) / 100,
          totalOther: Math.round(totalOther * 100) / 100,
          totalExpenses: Math.round(totalExpenses * 100) / 100,
          expenses
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[myprio] Erro ao extrair dados:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
      this.page = undefined;
    }
  }
}

export const createMyprioScraper = () => new MyprioScraper();
