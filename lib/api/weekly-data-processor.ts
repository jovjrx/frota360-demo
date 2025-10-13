import { adminDb } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';

interface DriverInfo {
  id: string;
  name: string;
  type: 'affiliate' | 'renter';
  rentalFee: number;
  integrations?: {
    uber?: string | null;
    bolt?: string | null;
    myprio?: string | null;
    viaverde?: string | null;
  };
}

/**
 * Processa dados de uma semana do dataWeekly
 * Usa a mesma lógica do endpoint /api/admin/weekly/data
 */
export async function getProcessedWeeklyRecords(weekId: string): Promise<DriverWeeklyRecord[]> {
  if (!weekId) {
    return [];
  }

  try {
    // Buscar dados normalizados da semana
    const normalizedSnapshot = await adminDb
      .collection('dataWeekly')
      .where('weekId', '==', weekId)
      .get();

    if (normalizedSnapshot.empty) {
      return [];
    }

    const normalizedData: WeeklyNormalizedData[] = normalizedSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as WeeklyNormalizedData),
    }));

    console.log(`   Dados por plataforma:`);
    const platformSummary = normalizedData.reduce((acc, entry) => {
      if (!acc[entry.platform]) acc[entry.platform] = { count: 0, total: 0 };
      acc[entry.platform].count++;
      acc[entry.platform].total += entry.totalValue || 0;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);
    
    Object.entries(platformSummary).forEach(([platform, data]) => {
      console.log(`      ${platform}: ${data.count} registros, €${data.total.toFixed(2)}`);
    });

    // Buscar motoristas
    const driversSnapshot = await adminDb.collection('drivers').get();
    const driversById = new Map<string, DriverInfo>();
    const driversByUber = new Map<string, DriverInfo>();
    const driversByBolt = new Map<string, DriverInfo>();
    const driversByMyPrio = new Map<string, DriverInfo>();
    const driversByPlate = new Map<string, DriverInfo>();

    driversSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const driver: DriverInfo = {
        id: doc.id,
        name: data.name || 'Desconhecido',
        type: data.type || 'affiliate',
        rentalFee: data.rentalFee || 0,
        integrations: data.integrations || {}
      };

      driversById.set(doc.id, driver);
      
      if (data.integrations?.uber && typeof data.integrations.uber === 'string') {
        driversByUber.set(data.integrations.uber.toLowerCase(), driver);
      }
      if (data.integrations?.bolt && typeof data.integrations.bolt === 'string') {
        driversByBolt.set(data.integrations.bolt.toLowerCase(), driver);
      }
      if (data.integrations?.myprio && typeof data.integrations.myprio === 'string') {
        driversByMyPrio.set(data.integrations.myprio.toLowerCase(), driver);
      }
      if (data.vehicle?.plate && typeof data.vehicle.plate === 'string') {
        driversByPlate.set(data.vehicle.plate.toLowerCase().replace(/[^a-z0-9]/g, ''), driver);
      }
    });

    // Buscar financiamentos ativos
    const financingSnapshot = await adminDb
      .collection('financing')
      .where('status', '==', 'active')
      .get();
    
    const financingByDriver = new Map();
    financingSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const driverId = data.driverId;
      if (!driverId) return;
      
      if (!financingByDriver.has(driverId)) {
        financingByDriver.set(driverId, []);
      }
      financingByDriver.get(driverId).push({
        type: data.type,
        amount: data.amount,
        weeks: data.weeks,
        weeklyInterest: data.weeklyInterest || 0,
        weeklyAmount: data.weeklyAmount || 0,
        remainingWeeks: data.remainingWeeks || data.weeks
      });
    });

    // Agregar dados por motorista
    const totals = new Map<string, {
      driver: DriverInfo;
      uber: number;
      bolt: number;
      combustivel: number;
      viaverde: number;
    }>();

    normalizedData.forEach((entry) => {
      let driver: DriverInfo | undefined;

      // Resolver motorista - driverId já está no entry
      if (entry.driverId) {
        driver = driversById.get(entry.driverId);
      } 
      
      // Fallback: tentar pelo referenceId (que contém o ID da plataforma)
      if (!driver && entry.referenceId) {
        if (entry.platform === 'uber') {
          driver = driversByUber.get(entry.referenceId.toLowerCase());
        } else if (entry.platform === 'bolt') {
          driver = driversByBolt.get(entry.referenceId.toLowerCase());
        } else if (entry.platform === 'myprio') {
          driver = driversByMyPrio.get(entry.referenceId.toLowerCase());
        }
      }

      // Fallback: tentar pela placa
      if (!driver && entry.vehiclePlate) {
        const cleanPlate = entry.vehiclePlate.toLowerCase().replace(/[^a-z0-9]/g, '');
        driver = driversByPlate.get(cleanPlate);
      }

      if (!driver) return;

      if (!totals.has(driver.id)) {
        totals.set(driver.id, {
          driver,
          uber: 0,
          bolt: 0,
          combustivel: 0,
          viaverde: 0
        });
      }

      const t = totals.get(driver.id)!;

      if (entry.platform === 'uber') t.uber += entry.totalValue || 0;
      else if (entry.platform === 'bolt') t.bolt += entry.totalValue || 0;
      else if (entry.platform === 'myprio') t.combustivel += entry.totalValue || 0;
      else if (entry.platform === 'viaverde') t.viaverde += entry.totalValue || 0;
    });

    // Gerar registros finais
    const records: DriverWeeklyRecord[] = [];

    totals.forEach((t, driverId) => {
      const ganhosTotal = t.uber + t.bolt;
      const ivaValor = ganhosTotal * 0.06;
      const ganhosMenosIVA = ganhosTotal - ivaValor;

      let despesasAdm = ganhosMenosIVA * 0.07; // 7% base
      let totalFinancingInterestPercent = 0;
      let totalInstallment = 0;

      // Calcular financiamento
      const driverFinancings = financingByDriver.get(driverId) || [];
      driverFinancings.forEach((f: any) => {
        if (f.weeklyInterest) totalFinancingInterestPercent += f.weeklyInterest;
        if (f.weeklyAmount) totalInstallment += f.weeklyAmount;
      });

      // Adicionar juros ao despesasAdm
      if (totalFinancingInterestPercent > 0) {
        const additionalInterest = ganhosMenosIVA * (totalFinancingInterestPercent / 100);
        despesasAdm += additionalInterest;
      }

      const aluguel = t.driver.type === 'renter' ? t.driver.rentalFee : 0;
      
      // ViaVerde só desconta de locatários
      const viaverdeDesconto = t.driver.type === 'renter' ? t.viaverde : 0;
      
      // Total despesas = combustivel + viaverde (se locatário) + aluguel
      const totalDespesas = t.combustivel + viaverdeDesconto + aluguel;
      
      // Repasse = ganhos - IVA - despesasAdm - totalDespesas
      let repasse = ganhosMenosIVA - despesasAdm - totalDespesas;
      
      // Subtrair parcela do repasse
      if (totalInstallment > 0) {
        repasse -= totalInstallment;
      }

      console.log(`   ${t.driver.name}: Ganhos=€${ganhosTotal.toFixed(2)}, Repasse=€${repasse.toFixed(2)}`);

      records.push({
        id: `${weekId}_${driverId}`,
        weekId,
        driverId,
        driverName: t.driver.name,
        ganhosTotal,
        ivaValor,
        despesasAdm,
        combustivel: t.combustivel,
        viaverde: t.viaverde,
        aluguel,
        repasse,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as DriverWeeklyRecord);
    });

    return records;
    
  } catch (error) {
    console.error(`Erro ao processar registros da semana ${weekId}:`, error);
    return [];
  }
}

/**
 * Busca os IDs das últimas N semanas disponíveis no dataWeekly
 */
export async function getAvailableWeekIds(limit: number = 10): Promise<string[]> {
  try {
    const snapshot = await adminDb
      .collection('dataWeekly')
      .orderBy('weekId', 'desc')
      .limit(100)
      .get();

    const weekIds = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.weekId) {
        weekIds.add(data.weekId);
      }
    });
    
    const sortedWeekIds = Array.from(weekIds)
      .sort()
      .reverse()
      .slice(0, limit);
    
    return sortedWeekIds;
  } catch (error) {
    console.error('Erro ao buscar semanas disponíveis:', error);
    return [];
  }
}
