import { UberClient } from './uber/client';
import { BoltScraper } from './bolt/scraper';
import { CartrackClient } from './cartrack/client';
import { FONOAClient } from './fonoa/client';
import { ViaVerdeScraper } from './viaverde/scraper';
import { MyprioScraper } from './myprio/scraper';

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
  private uber: UberClient;
  private bolt: BoltScraper;
  private cartrack: CartrackClient;
  private fonoa: FONOAClient;
  private viaverde: ViaVerdeScraper;
  private myprio: MyprioScraper;

  constructor() {
    this.uber = new UberClient({
      clientId: process.env.UBER_CLIENT_ID || '',
      clientSecret: process.env.UBER_CLIENT_SECRET || '',
      orgUuid: process.env.UBER_ORG_UUID || ''
    });
    this.bolt = new BoltScraper();
    this.cartrack = new CartrackClient({
      username: process.env.CARTRACK_USERNAME || 'ALVO00008',
      password: process.env.CARTRACK_PASSWORD || 'Alvorada2025@'
    });
    this.fonoa = new FONOAClient({
      email: process.env.FONOA_EMAIL || 'info@alvoradamagistral.eu',
      password: process.env.FONOA_PASSWORD || 'Muffin@2017'
    });
    this.viaverde = new ViaVerdeScraper();
    this.myprio = new MyprioScraper();
  }

  async getMonthlyMetrics(year: number, month: number): Promise<UnifiedMetrics> {
    console.log(`\n=== Iniciando coleta de dados: ${year}-${String(month).padStart(2, '0')} ===\n`);

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // Executar todas as integrações em paralelo
    const results = await Promise.allSettled([
      this.syncUber(year, month),
      this.syncBolt(year, month),
      this.syncCartrack(year, month),
      this.syncFonoa(year, month),
      this.syncViaVerde(year, month),
      this.syncMyprio(year, month)
    ]);

    // Extrair dados ou erros
    const uber = results[0].status === 'fulfilled' ? results[0].value : null;
    const bolt = results[1].status === 'fulfilled' ? results[1].value : null;
    const cartrack = results[2].status === 'fulfilled' ? results[2].value : null;
    const fonoa = results[3].status === 'fulfilled' ? results[3].value : null;
    const viaverde = results[4].status === 'fulfilled' ? results[4].value : null;
    const myprio = results[5].status === 'fulfilled' ? results[5].value : null;

    // Coletar erros
    const errors: Array<{ platform: string; error: string }> = [];
    const platforms = ['uber', 'bolt', 'cartrack', 'fonoa', 'viaverde', 'myprio'];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        errors.push({
          platform: platforms[index],
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    // Calcular métricas consolidadas
    const totalEarnings = (uber?.totalEarnings || 0) + (bolt?.totalEarnings || 0);
    const totalTrips = (uber?.totalTrips || 0) + (bolt?.totalTrips || 0);
    const totalTips = (uber?.totalTips || 0) + (bolt?.totalTips || 0);
    
    const totalFuelCost = (cartrack?.totalFuelCost || 0) + (myprio?.totalFuel || 0);
    const totalTollsCost = (uber?.totalTolls || 0) + (viaverde?.totalTolls || 0);
    const totalMaintenanceCost = myprio?.totalMaintenance || 0;
    const totalTaxes = fonoa?.totalTaxes || 0;
    const totalExpenses = totalFuelCost + totalTollsCost + totalMaintenanceCost + totalTaxes;
    
    const netProfit = totalEarnings + totalTips - totalExpenses;

    console.log('\n=== Resumo das Métricas ===');
    console.log(`Receitas: €${totalEarnings.toFixed(2)}`);
    console.log(`Viagens: ${totalTrips}`);
    console.log(`Gorjetas: €${totalTips.toFixed(2)}`);
    console.log(`Despesas: €${totalExpenses.toFixed(2)}`);
    console.log(`Lucro Líquido: €${netProfit.toFixed(2)}`);
    console.log(`Erros: ${errors.length}\n`);

    return {
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalTrips,
      totalTips: Math.round(totalTips * 100) / 100,
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      totalTollsCost: Math.round(totalTollsCost * 100) / 100,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      totalTaxes: Math.round(totalTaxes * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      activeVehicles: cartrack?.activeVehicles || 0,
      totalVehicles: cartrack?.totalVehicles || 0,
      totalDistance: cartrack?.totalDistance || 0,
      netProfit: Math.round(netProfit * 100) / 100,
      platforms: {
        uber,
        bolt,
        cartrack,
        fonoa,
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

  private async syncUber(year: number, month: number): Promise<any> {
    console.log('[Uber] Iniciando sincronização...');
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

      await this.uber.authenticate();
      const trips = await this.uber.getTrips(startDate, endDate);
      
      const totalTrips = trips.length;
      const totalEarnings = trips.reduce((sum, t: any) => sum + (parseFloat(t.fare?.subtotal) || parseFloat(t.amount) || 0), 0);
      const totalTips = trips.reduce((sum, t: any) => sum + (parseFloat(t.fare?.tip) || parseFloat(t.tip) || 0), 0);
      const totalTolls = trips.reduce((sum, t: any) => sum + (parseFloat(t.fare?.tolls) || parseFloat(t.tolls) || 0), 0);

      console.log(`[Uber] ✓ ${totalTrips} viagens, €${totalEarnings.toFixed(2)}`);
      
      return {
        totalTrips,
        totalEarnings,
        totalTips,
        totalTolls,
        trips
      };
    } catch (error: any) {
      console.error(`[Uber] ✗ Erro: ${error.message}`);
      throw error;
    }
  }

  private async syncBolt(year: number, month: number): Promise<any> {
    console.log('[Bolt] Iniciando sincronização...');
    try {
      const result = await this.bolt.getMonthlyData(year, month);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      console.log(`[Bolt] ✓ ${result.data?.totalTrips} viagens, €${result.data?.totalEarnings.toFixed(2)}`);
      
      return result.data;
    } catch (error: any) {
      console.error(`[Bolt] ✗ Erro: ${error.message}`);
      throw error;
    } finally {
      await this.bolt.close();
    }
  }

  private async syncCartrack(year: number, month: number): Promise<any> {
    console.log('[Cartrack] Iniciando sincronização...');
    try {
      const result = await this.cartrack.getMonthlyData(year, month);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      console.log(`[Cartrack] ✓ ${result.data?.vehicles.active} veículos ativos`);
      
      return {
        activeVehicles: result.data?.vehicles.active,
        totalVehicles: result.data?.vehicles.total,
        totalDistance: result.data?.trips.totalDistance,
        totalFuelCost: result.data?.fuel.totalCost
      };
    } catch (error: any) {
      console.error(`[Cartrack] ✗ Erro: ${error.message}`);
      throw error;
    }
  }

  private async syncFonoa(year: number, month: number): Promise<any> {
    console.log('[FONOA] Iniciando sincronização...');
    try {
      const result = await this.fonoa.getMonthlyData(year, month);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      console.log(`[FONOA] ✓ €${result.data?.totalTaxes.toFixed(2)} em impostos`);
      
      return result.data;
    } catch (error: any) {
      console.error(`[FONOA] ✗ Erro: ${error.message}`);
      throw error;
    }
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
    await Promise.all([
      this.bolt.close(),
      this.viaverde.close(),
      this.myprio.close()
    ]);
  }
}

export const createUnifiedScraper = () => new UnifiedScraper();
