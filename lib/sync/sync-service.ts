import {
  createUberClient,
  createBoltClient,
  createCartrackClient,
  createViaVerdeClient,
  createFonoaClient,
  createMyprioClient,
} from '@/lib/integrations';
import { db } from '@/lib/firebaseAdmin';
import { FleetRecord, calculateFleetRecord } from '@/schemas/fleet-record';
import { DriverWeeklyRecord, calculateDriverWeeklyRecord } from '@/schemas/driver-weekly-record';

export interface SyncResult {
  success: boolean;
  platform: string;
  recordsCreated: number;
  recordsUpdated: number;
  errors: string[];
  duration: number;
}

export interface SyncOptions {
  startDate: string;
  endDate: string;
  driverId?: string;
  vehicleId?: string;
  platforms?: string[];
}

export class SyncService {
  private uberClient: any = null;
  private boltClient: any = null;
  private cartrackClient: any = null;
  private viaverdeClient: any = null;
  private fonoaClient: any = null;
  private myprioClient: any = null;

  private async initClients() {
    if (!this.uberClient) {
      this.uberClient = await createUberClient();
      this.boltClient = await createBoltClient();
      this.cartrackClient = await createCartrackClient();
      this.viaverdeClient = await createViaVerdeClient();
      this.fonoaClient = await createFonoaClient();
      this.myprioClient = await createMyprioClient();
    }
  }

  /**
   * Sincroniza dados de todas as plataformas
   */
  async syncAll(options: SyncOptions): Promise<SyncResult[]> {
    await this.initClients();
    
    const platforms = options.platforms || ['uber', 'bolt', 'cartrack', 'viaverde', 'myprio', 'fonoa'];
    const results: SyncResult[] = [];

    for (const platform of platforms) {
      try {
        let result: SyncResult;
        
        switch (platform) {
          case 'uber':
            result = await this.syncUber(options);
            break;
          case 'bolt':
            result = await this.syncBolt(options);
            break;
          case 'cartrack':
            result = await this.syncCartrack(options);
            break;
          case 'viaverde':
            result = await this.syncViaVerde(options);
            break;
          case 'myprio':
            result = await this.syncMyprio(options);
            break;
          case 'fonoa':
            result = await this.syncFonoa(options);
            break;
          default:
            continue;
        }
        
        results.push(result);
        
        // Log da sincronização
        await this.logSync(result);
      } catch (error: any) {
        results.push({
          success: false,
          platform,
          recordsCreated: 0,
          recordsUpdated: 0,
          errors: [error.message],
          duration: 0,
        });
      }
    }

    return results;
  }

  /**
   * Sincroniza dados do Uber
   */
  private async syncUber(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    try {
      // Testar conexão
      const connectionTest = await this.uberClient.testConnection();
      if (!connectionTest.success) {
        throw new Error('Falha ao conectar com Uber API');
      }

      // Buscar viagens
      const tripsResponse = await this.uberClient.getTrips(options.startDate, options.endDate);
      if (!tripsResponse || !Array.isArray(tripsResponse)) {
        throw new Error('Falha ao buscar viagens do Uber');
      }

      // Buscar ganhos
      const earningsResponse = await this.uberClient.getEarnings(options.startDate, options.endDate);
      if (!earningsResponse) {
        throw new Error('Falha ao buscar ganhos do Uber');
      }

      // Agrupar por motorista e período
      const groupedData = this.groupUberDataByDriver(
        tripsResponse,
        earningsResponse,
        options.startDate,
        options.endDate
      );

      // Criar/atualizar registros
      for (const [driverId, data] of Object.entries(groupedData)) {
        try {
          const result = await this.upsertFleetRecord(driverId, data, 'uber');
          if (result.created) created++;
          else updated++;
        } catch (error: any) {
          errors.push(`Erro ao processar motorista ${driverId}: ${error.message}`);
        }
      }

      return {
        success: true,
        platform: 'uber',
        recordsCreated: created,
        recordsUpdated: updated,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        platform: 'uber',
        recordsCreated: created,
        recordsUpdated: updated,
        errors: [error.message, ...errors],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sincroniza dados do Bolt
   */
  private async syncBolt(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let created = 0;
    let updated = 0;

    try {
      const connectionTest = await this.boltClient.testConnection();
      if (!connectionTest.success) {
        throw new Error('Falha ao conectar com Bolt API');
      }

      const tripsResponse = await this.boltClient.getTrips(options.startDate, options.endDate);
      if (!tripsResponse || !Array.isArray(tripsResponse)) {
        throw new Error('Falha ao buscar viagens do Bolt');
      }

      const earningsResponse = await this.boltClient.getEarnings(options.startDate, options.endDate);
      if (!earningsResponse) {
        throw new Error('Falha ao buscar ganhos do Bolt');
      }

      const groupedData = this.groupBoltDataByDriver(
        tripsResponse,
        earningsResponse,
        options.startDate,
        options.endDate
      );

      for (const [driverId, data] of Object.entries(groupedData)) {
        try {
          const result = await this.upsertFleetRecord(driverId, data, 'bolt');
          if (result.created) created++;
          else updated++;
        } catch (error: any) {
          errors.push(`Erro ao processar motorista ${driverId}: ${error.message}`);
        }
      }

      return {
        success: true,
        platform: 'bolt',
        recordsCreated: created,
        recordsUpdated: updated,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        platform: 'bolt',
        recordsCreated: created,
        recordsUpdated: updated,
        errors: [error.message, ...errors],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sincroniza dados do Cartrack (veículos e km)
   */
  private async syncCartrack(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let updated = 0;

    try {
      const connectionTest = await this.cartrackClient.testConnection();
      if (!connectionTest.success) {
        throw new Error('Falha ao conectar com Cartrack API');
      }

      const vehiclesResponse = await this.cartrackClient.getVehicles();
      if (!vehiclesResponse || !Array.isArray(vehiclesResponse)) {
        throw new Error('Falha ao buscar veículos do Cartrack');
      }

      // Atualizar informações de veículos nos registros existentes
      for (const vehicle of vehiclesResponse) {
        try {
          await this.updateVehicleInfo(vehicle);
          updated++;
        } catch (error: any) {
          errors.push(`Erro ao atualizar veículo ${vehicle.plate}: ${error.message}`);
        }
      }

      return {
        success: true,
        platform: 'cartrack',
        recordsCreated: 0,
        recordsUpdated: updated,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        platform: 'cartrack',
        recordsCreated: 0,
        recordsUpdated: updated,
        errors: [error.message, ...errors],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sincroniza dados do ViaVerde (portagens)
   */
  private async syncViaVerde(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let updated = 0;

    try {
      const connectionTest = await this.viaverdeClient.testConnection();
      if (!connectionTest.success) {
        throw new Error('Falha ao conectar com ViaVerde');
      }

      const transactionsResponse = await this.viaverdeClient.getTransactions(
        options.startDate,
        options.endDate
      );
      
      if (!transactionsResponse || !Array.isArray(transactionsResponse)) {
        throw new Error('Falha ao buscar transações do ViaVerde');
      }

      // Agrupar portagens por veículo e período
      const groupedTolls = this.groupViaVerdeByVehicle(
        transactionsResponse,
        options.startDate,
        options.endDate
      );

      // Atualizar registros com valores de portagens
      for (const [vehicleId, tolls] of Object.entries(groupedTolls)) {
        try {
          await this.updateTollsInRecords(vehicleId, tolls, options.startDate, options.endDate);
          updated++;
        } catch (error: any) {
          errors.push(`Erro ao atualizar portagens do veículo ${vehicleId}: ${error.message}`);
        }
      }

      return {
        success: true,
        platform: 'viaverde',
        recordsCreated: 0,
        recordsUpdated: updated,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        platform: 'viaverde',
        recordsCreated: 0,
        recordsUpdated: updated,
        errors: [error.message, ...errors],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sincroniza dados do myprio (combustível e despesas)
   */
  private async syncMyprio(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let updated = 0;

    try {
      const connectionTest = await this.myprioClient.testConnection();
      if (!connectionTest.success) {
        throw new Error('Falha ao conectar com myprio');
      }

      const expensesResponse = await this.myprioClient.getExpenses(
        options.startDate,
        options.endDate
      );
      
      if (!expensesResponse || !Array.isArray(expensesResponse)) {
        throw new Error('Falha ao buscar despesas do myprio');
      }

      // Agrupar despesas por veículo e categoria
      const groupedExpenses = this.groupMyprioByVehicle(
        expensesResponse,
        options.startDate,
        options.endDate
      );

      // Atualizar registros com despesas
      for (const [vehicleId, expenses] of Object.entries(groupedExpenses)) {
        try {
          await this.updateExpensesInRecords(vehicleId, expenses, options.startDate, options.endDate);
          updated++;
        } catch (error: any) {
          errors.push(`Erro ao atualizar despesas do veículo ${vehicleId}: ${error.message}`);
        }
      }

      return {
        success: true,
        platform: 'myprio',
        recordsCreated: 0,
        recordsUpdated: updated,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        platform: 'myprio',
        recordsCreated: 0,
        recordsUpdated: updated,
        errors: [error.message, ...errors],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sincroniza dados do FONOA (impostos e faturas)
   */
  private async syncFonoa(options: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let updated = 0;

    try {
      const connectionTest = await this.fonoaClient.testConnection();
      if (!connectionTest.success) {
        throw new Error('Falha ao conectar com FONOA');
      }

      const invoicesResponse = await this.fonoaClient.getInvoices(
        options.startDate,
        options.endDate
      );
      
      if (!invoicesResponse || !Array.isArray(invoicesResponse)) {
        throw new Error('Falha ao buscar faturas do FONOA');
      }

      // Processar faturas (informativo apenas)
      for (const invoice of invoicesResponse) {
        try {
          await this.logInvoice(invoice);
          updated++;
        } catch (error: any) {
          errors.push(`Erro ao processar fatura ${invoice.id}: ${error.message}`);
        }
      }

      return {
        success: true,
        platform: 'fonoa',
        recordsCreated: 0,
        recordsUpdated: updated,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        success: false,
        platform: 'fonoa',
        recordsCreated: 0,
        recordsUpdated: updated,
        errors: [error.message, ...errors],
        duration: Date.now() - startTime,
      };
    }
  }

  // Métodos auxiliares privados

  private groupUberDataByDriver(trips: any[], earnings: any, startDate: string, endDate: string): Record<string, any> {
    const grouped: Record<string, any> = {};
    
    for (const trip of trips) {
      const driverId = trip.driver_id || 'unknown';
      if (!grouped[driverId]) {
        grouped[driverId] = {
          earningsUber: 0,
          tipsUber: 0,
          tollsUber: 0,
          tripCount: 0,
        };
      }
      
      grouped[driverId].earningsUber += trip.fare?.value || 0;
      grouped[driverId].tipsUber += trip.tip || 0;
      grouped[driverId].tollsUber += trip.tolls || 0;
      grouped[driverId].tripCount += 1;
    }
    
    return grouped;
  }

  private groupBoltDataByDriver(trips: any[], earnings: any, startDate: string, endDate: string): Record<string, any> {
    const grouped: Record<string, any> = {};
    
    for (const trip of trips) {
      const driverId = trip.driver_id || 'unknown';
      if (!grouped[driverId]) {
        grouped[driverId] = {
          earningsBolt: 0,
          tipsBolt: 0,
          tripCount: 0,
        };
      }
      
      grouped[driverId].earningsBolt += trip.fare || 0;
      grouped[driverId].tipsBolt += trip.tip || 0;
      grouped[driverId].tripCount += 1;
    }
    
    return grouped;
  }

  private groupViaVerdeByVehicle(transactions: any[], startDate: string, endDate: string): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    for (const transaction of transactions) {
      if (transaction.type === 'toll') {
        const vehicleId = transaction.vehicle_id || 'unknown';
        if (!grouped[vehicleId]) {
          grouped[vehicleId] = 0;
        }
        grouped[vehicleId] += transaction.amount || 0;
      }
    }
    
    return grouped;
  }

  private groupMyprioByVehicle(expenses: any[], startDate: string, endDate: string): Record<string, any> {
    const grouped: Record<string, any> = {};
    
    for (const expense of expenses) {
      const vehicleId = expense.vehicle_id || 'unknown';
      if (!grouped[vehicleId]) {
        grouped[vehicleId] = {
          fuel: 0,
          other: 0,
        };
      }
      
      if (expense.category === 'fuel') {
        grouped[vehicleId].fuel += expense.amount || 0;
      } else {
        grouped[vehicleId].other += expense.amount || 0;
      }
    }
    
    return grouped;
  }

  private async upsertFleetRecord(driverId: string, data: any, source: string): Promise<{ created: boolean }> {
    // Buscar registro existente
    const query = await db.collection('fleet_records')
      .where('driverId', '==', driverId)
      .where('periodStart', '==', data.periodStart)
      .where('periodEnd', '==', data.periodEnd)
      .limit(1)
      .get();

    if (query.empty) {
      // Criar novo
      await db.collection('fleet_records').add({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncedFrom: source,
      });
      return { created: true };
    } else {
      // Atualizar existente
      const doc = query.docs[0];
      await doc.ref.update({
        ...data,
        updatedAt: new Date().toISOString(),
        syncedFrom: source,
      });
      return { created: false };
    }
  }

  private async updateVehicleInfo(vehicle: any): Promise<void> {
    // Atualizar informações do veículo em todos os registros
    await db.collection('fleet_records')
      .where('vehicleId', '==', vehicle.id)
      .get()
      .then(snapshot => {
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            vehiclePlate: vehicle.plate,
            updatedAt: new Date().toISOString(),
          });
        });
        return batch.commit();
      });
  }

  private async updateTollsInRecords(vehicleId: string, tolls: number, startDate: string, endDate: string): Promise<void> {
    const snapshot = await db.collection('fleet_records')
      .where('vehicleId', '==', vehicleId)
      .where('periodStart', '>=', startDate)
      .where('periodEnd', '<=', endDate)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        tollsAdjusted: tolls,
        updatedAt: new Date().toISOString(),
      });
    });
    await batch.commit();
  }

  private async updateExpensesInRecords(vehicleId: string, expenses: any, startDate: string, endDate: string): Promise<void> {
    const snapshot = await db.collection('fleet_records')
      .where('vehicleId', '==', vehicleId)
      .where('periodStart', '>=', startDate)
      .where('periodEnd', '<=', endDate)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        fuel: expenses.fuel,
        otherExpenses: expenses.other,
        updatedAt: new Date().toISOString(),
      });
    });
    await batch.commit();
  }

  private async logSync(result: SyncResult): Promise<void> {
    await db.collection('sync_logs').add({
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  private async logInvoice(invoice: any): Promise<void> {
    await db.collection('invoices').add({
      ...invoice,
      importedAt: new Date().toISOString(),
    });
  }
}

export const syncService = new SyncService();
