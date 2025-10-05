import puppeteer, { Browser, Page } from 'puppeteer';

interface BoltTrip {
  date: string;
  driverName: string;
  trips: number;
  earnings: number;
  tips: number;
  total: number;
}

interface BoltMonthlyData {
  success: boolean;
  data?: {
    totalTrips: number;
    totalEarnings: number;
    totalTips: number;
    trips: BoltTrip[];
  };
  error?: string;
  timestamp: string;
}

export class BoltScraper {
  private browser?: Browser;
  private page?: Page;
  private email: string;
  private password: string;

  constructor() {
    this.email = process.env.BOLT_EMAIL || 'caroline@alvoradamagistral.eu';
    this.password = process.env.BOLT_PASSWORD || 'Muffin@2017';
  }

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }

  async login(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Browser not initialized');
    }

    try {
      console.log('[Bolt] Navegando para página de login...');
      await this.page.goto('https://fleet.bolt.eu/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Aguardar formulário de login
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

      console.log('[Bolt] Preenchendo credenciais...');
      await this.page.type('input[type="email"], input[name="email"]', this.email, { delay: 100 });
      await this.page.type('input[type="password"], input[name="password"]', this.password, { delay: 100 });

      console.log('[Bolt] Submetendo formulário...');
      await Promise.all([
        this.page.click('button[type="submit"]'),
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      ]);

      // Verificar se o login foi bem-sucedido
      const url = this.page.url();
      const isLoggedIn = !url.includes('/login') && (url.includes('/dashboard') || url.includes('/fleet'));

      if (isLoggedIn) {
        console.log('[Bolt] Login bem-sucedido!');
        return true;
      } else {
        console.error('[Bolt] Login falhou - ainda na página de login');
        return false;
      }
    } catch (error) {
      console.error('[Bolt] Erro durante login:', error);
      return false;
    }
  }

  async getMonthlyData(year: number, month: number): Promise<BoltMonthlyData> {
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

      // Navegar para página de relatórios/viagens
      console.log('[Bolt] Navegando para relatórios...');
      await this.page.goto('https://fleet.bolt.eu/reports', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Aplicar filtro de data
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      console.log(`[Bolt] Aplicando filtro de data: ${startDate} a ${endDate}`);

      // Tentar encontrar e preencher campos de data
      try {
        await this.page.waitForSelector('input[type="date"], input[name*="date"]', { timeout: 5000 });
        const dateInputs = await this.page.$$('input[type="date"], input[name*="date"]');
        
        if (dateInputs.length >= 2) {
          await dateInputs[0].type(startDate);
          await dateInputs[1].type(endDate);
          
          // Clicar no botão de aplicar filtro
          const applyButton = await this.page.$('button[type="submit"], button:has-text("Apply"), button:has-text("Aplicar")');
          if (applyButton) {
            await applyButton.click();
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      } catch (error) {
        console.log('[Bolt] Não foi possível aplicar filtro de data, continuando...');
      }

      // Extrair dados da tabela
      console.log('[Bolt] Extraindo dados...');
      const trips = await this.page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('table tbody tr, div[role="row"]'));
        
        return rows.map(row => {
          const cells = Array.from(row.querySelectorAll('td, div[role="cell"]'));
          
          if (cells.length >= 4) {
            return {
              date: cells[0]?.textContent?.trim() || '',
              driverName: cells[1]?.textContent?.trim() || '',
              trips: parseInt(cells[2]?.textContent?.replace(/[^0-9]/g, '') || '0'),
              earnings: parseFloat(cells[3]?.textContent?.replace(/[^0-9.]/g, '') || '0'),
              tips: parseFloat(cells[4]?.textContent?.replace(/[^0-9.]/g, '') || '0'),
              total: parseFloat(cells[5]?.textContent?.replace(/[^0-9.]/g, '') || '0')
            };
          }
          
          return null;
        }).filter(Boolean);
      });

      // Calcular totais
      const totalTrips = trips.reduce((sum: number, t: any) => sum + t.trips, 0);
      const totalEarnings = trips.reduce((sum: number, t: any) => sum + t.earnings, 0);
      const totalTips = trips.reduce((sum: number, t: any) => sum + t.tips, 0);

      console.log(`[Bolt] Dados extraídos: ${trips.length} registros, ${totalTrips} viagens`);

      return {
        success: true,
        data: {
          totalTrips,
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          totalTips: Math.round(totalTips * 100) / 100,
          trips
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('[Bolt] Erro ao extrair dados:', error);
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

export const createBoltScraper = () => new BoltScraper();
