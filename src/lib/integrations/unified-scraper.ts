// Scrapers são importados dinamicamente para evitar problemas com puppeteer no build
// import { ViaVerdeScraper } from './viaverde/scraper';
// import { MyprioScraper } from './myprio/scraper';

// Nota: Bolt, Uber e Cartrack agora usam APIs oficiais via factory functions
// Não precisam mais de scrapers

export interface UnifiedMetrics {
  // Receitas
  totalEarnings: number;
  totalTrips: number;
  totalTips: number;
  
  // Despesas
  totalFuelCost: number;
  totalTollsCost: number;
  totalMaintenanceCost: number;
  totalTaxes: number;
  totalExpenses: number;
  
  // Frota
  activeVehicles: number;
  totalVehicles: number;
  totalDistance: number;
  
  // Lucro
  netProfit: number;
  
  // Detalhes por plataforma
  platforms: {
    uber?: any;
    bolt?: any;
    cartrack?: any;
    fonoa?: any;
    viaverde?: any;
    myprio?: any;
  };
  
  // Metadados
  period: {
    year: number;
    month: number;
    startDate: string;
    endDate: string;
  };
  
  errors: Array<{
    platform: string;
    error: string;
  }>;
  
  timestamp: string;
}

export class UnifiedScraper {
  private viaverde: any; // ViaVerdeScraper - lazy loaded
  private myprio: any; // MyprioScraper - lazy loaded

  constructor() {
    // ViaVerde e Myprio scrapers são carregados sob demanda
  }

  async getMonthlyMetrics(year: number, month: number): Promise<UnifiedMetrics> {
    console.log(`\n=== Iniciando coleta de dados: ${year}-${String(month).padStart(2, '0')} ===\n`);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // Executar apenas scrapers restantes (ViaVerde, Myprio)
    const results = await Promise.allSettled([
      this.syncViaVerde(year, month),
      this.syncMyprio(year, month)
    ]);

    // Extrair dados ou erros
    const viaverde = results[0].status === 'fulfilled' ? results[0].value : null;
    const myprio = results[1].status === 'fulfilled' ? results[1].value : null;

    // Coletar erros
    const errors: Array<{ platform: string; error: string }> = [];
    const platforms = ['viaverde', 'myprio'];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        errors.push({
          platform: platforms[index],
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    // Calcular métricas consolidadas (apenas scrapers restantes)
    const totalFuelCost = myprio?.totalFuel || 0;
    const totalTollsCost = viaverde?.totalTolls || 0;
    const totalMaintenanceCost = myprio?.totalMaintenance || 0;
    const totalExpenses = totalFuelCost + totalTollsCost + totalMaintenanceCost;

    console.log('\n=== Resumo das Métricas (Scrapers) ===');
    console.log(`Despesas: €${totalExpenses.toFixed(2)}`);
    console.log(`Erros: ${errors.length}\n`);

    return {
      totalEarnings: 0, // Calculado via factory functions
      totalTrips: 0, // Calculado via factory functions
      totalTips: 0, // Calculado via factory functions
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      totalTollsCost: Math.round(totalTollsCost * 100) / 100,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      totalTaxes: 0, // FONOA removido
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      activeVehicles: 0, // Calculado via factory functions
      totalVehicles: 0, // Calculado via factory functions
      totalDistance: 0, // Calculado via factory functions
      netProfit: 0, // Calculado via factory functions
      platforms: {
        viaverde,
        myprio
      },
      period: {
        year,
        month,
        startDate,
        endDate
      },
      errors,
      timestamp: new Date().toISOString()
    };
  }

  private async syncViaVerde(year: number, month: number): Promise<any> {
    console.log('[ViaVerde] Iniciando sincronização...');
    try {
      const result = await this.viaverde.getMonthlyData(year, month);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      console.log(`[ViaVerde] ✓ €${result.data?.totalAmount.toFixed(2)} em transações`);
      
      return result.data;
    } catch (error: any) {
      console.error(`[ViaVerde] ✗ Erro: ${error.message}`);
      throw error;
    } finally {
      await this.viaverde.close();
    }
  }

  private async syncMyprio(year: number, month: number): Promise<any> {
    console.log('[myprio] Iniciando sincronização...');
    try {
      const result = await this.myprio.getMonthlyData(year, month);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      console.log(`[myprio] ✓ €${result.data?.totalExpenses.toFixed(2)} em despesas`);
      
      return result.data;
    } catch (error: any) {
      console.error(`[myprio] ✗ Erro: ${error.message}`);
      throw error;
    } finally {
      await this.myprio.close();
    }
  }

  async close(): Promise<void> {
    // Fechar apenas scrapers ativos (ViaVerde e Myprio tem puppeteer)
    if (this.viaverde?.close) await this.viaverde.close();
    if (this.myprio?.close) await this.myprio.close();
  }
}

export const createUnifiedScraper = () => new UnifiedScraper();

