import puppeteer, { Browser, Page } from 'puppeteer';

interface ViaVerdeTransaction {
  date: string;
  type: string; // 'toll', 'parking', 'fuel'
  location: string;
  amount: number;
  vehicle: string;
}

interface ViaVerdeMonthlyData {
  success: boolean;
  data?: {
    totalTolls: number;
    totalParking: number;
    totalFuel: number;
    totalAmount: number;
    transactions: ViaVerdeTransaction[];
  };
  error?: string;
  timestamp: string;
}

export class ViaVerdeScraper {
  private browser?: Browser;
  private page?: Page;
  private email: string;
  private password: string;

  constructor() {
    this.email = process.env.VIAVERDE_EMAIL || 'info@alvoradamagistral.eu';
    this.password = process.env.VIAVERDE_PASSWORD || 'Alvorada2025@';
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
      console.log('[ViaVerde] Navegando para página de login...');
      await this.page.goto('https://www.viaverde.pt/particulares/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await this.page.waitForSelector('input[type="email"], input[name="email"], input[name="username"]', { timeout: 10000 });

      console.log('[ViaVerde] Preenchendo credenciais...');
      await this.page.type('input[type="email"], input[name="email"], input[name="username"]', this.email, { delay: 100 });
      await this.page.type('input[type="password"], input[name="password"]', this.password, { delay: 100 });

      console.log('[ViaVerde] Submetendo formulário...');
      await Promise.all([
        this.page.click('button[type="submit"], input[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      ]);

      const url = this.page.url();
      const isLoggedIn = !url.includes('/login');

      if (isLoggedIn) {
        console.log('[ViaVerde] Login bem-sucedido!');
        return true;
      } else {
        console.error('[ViaVerde] Login falhou');
        return false;
      }
    } catch (error) {
      console.error('[ViaVerde] Erro durante login:', error);
      return false;
    }
  }

  async getMonthlyData(year: number, month: number): Promise<ViaVerdeMonthlyData> {
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

      console.log('[ViaVerde] Navegando para movimentos/transações...');
      await this.page.goto('https://www.viaverde.pt/particulares/movimentos', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Aplicar filtro de data
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      console.log(`[ViaVerde] Aplicando filtro: ${startDate} a ${endDate}`);

      // Extrair transações
      const transactions = await this.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr, div[class*="transaction"]'));
        
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td, div[class*="cell"]'));
          
          if (cells.length >= 4) {
            const type = cells[1]?.textContent?.toLowerCase() || '';
            let transactionType = 'toll';
            if (type.includes('estacion') || type.includes('parking')) transactionType = 'parking';
            if (type.includes('combust') || type.includes('fuel')) transactionType = 'fuel';
            
            return {
              date: cells[0]?.textContent?.trim() || '',
              type: transactionType,
              location: cells[2]?.textContent?.trim() || '',
              amount: parseFloat(cells[3]?.textContent?.replace(/[^0-9.]/g, '') || '0'),
              vehicle: cells[4]?.textContent?.trim() || ''
            };
          }
          
          return null;
        }).filter(Boolean);
      });

      // Calcular totais por tipo
      const totalTolls = transactions
        .filter((t: any) => t.type === 'toll')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      const totalParking = transactions
        .filter((t: any) => t.type === 'parking')
        .reduce((sum: number, t: any) => sum + t.amount, 0);
      
      const totalFuel = transactions
        .filter((t: any) => t.type === 'fuel')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const totalAmount = totalTolls + totalParking + totalFuel;

      console.log(`[ViaVerde] Dados extraídos: ${transactions.length} transações`);

      return {
        success: true,
        data: {
          totalTolls: Math.round(totalTolls * 100) / 100,
          totalParking: Math.round(totalParking * 100) / 100,
          totalFuel: Math.round(totalFuel * 100) / 100,
          totalAmount: Math.round(totalAmount * 100) / 100,
          transactions
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[ViaVerde] Erro ao extrair dados:', error);
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

export const createViaVerdeScraper = () => new ViaVerdeScraper();

