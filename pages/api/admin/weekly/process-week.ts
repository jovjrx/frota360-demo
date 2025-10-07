import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb as db } from '@/lib/firebaseAdmin';
import { DriverWeeklyRecord, createDriverWeeklyRecord, getWeekId } from '@/schemas/driver-weekly-record';
import { WeeklyPlatformAggregates } from '@/schemas/weekly-platform-aggregates';
import { Driver } from '@/schemas/driver';

/**
 * GET /api/admin/weekly/process-week (ou POST para compatibilidade)
 * Busca WeeklyPlatformAggregates, amarra com motoristas e retorna registros calculados por motorista.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let weekStart: string;
  let weekEnd: string;

  if (req.method === 'GET') {
    weekStart = req.query.weekStart as string;
    weekEnd = req.query.weekEnd as string;
  } else { // POST
    weekStart = req.body.weekStart;
    weekEnd = req.body.weekEnd;
  }

  if (!weekStart || !weekEnd) {
    return res.status(400).json({ error: 'weekStart e weekEnd são obrigatórios' });
  }

  const weekId = getWeekId(new Date(weekStart));

  try {
    // 1. Buscar todos os motoristas ativos
    const driversSnapshot = await db
      .collection('drivers')
      .where('status', '==', 'active')
      .get();
    const drivers: Driver[] = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Driver }));

    // 2. Buscar todos os WeeklyPlatformAggregates para a semana
    const aggregatesSnapshot = await db
      .collection('weeklyPlatformAggregates')
      .where('weekId', '==', weekId)
      .get();
    const aggregates: WeeklyPlatformAggregates[] = aggregatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as WeeklyPlatformAggregates }));

    const records: DriverWeeklyRecord[] = [];

    // Mapear agregados por plataforma e chave de integração para fácil acesso
    const aggregatedData: { [driverId: string]: { [platform: string]: { totalValue: number; totalTrips: number } } } = {};

    drivers.forEach(driver => {
      if (driver.id) {
        aggregatedData[driver.id] = {
          uber: { totalValue: 0, totalTrips: 0 },
          bolt: { totalValue: 0, totalTrips: 0 },
          myprio: { totalValue: 0, totalTrips: 0 },
          viaverde: { totalValue: 0, totalTrips: 0 },
        };
      }
    });

    aggregates.forEach(aggregate => {
      // Encontrar o motorista correspondente para cada agregado
      const driverMatch = drivers.find(d => {
        switch (aggregate.platform) {
          case 'uber': return d.integrations?.uber?.key === aggregate.integrationKey;
          case 'bolt': return d.integrations?.bolt?.key === aggregate.integrationKey;
          case 'myprio': return d.integrations?.myprio?.key === aggregate.integrationKey;
          case 'viaverde': return d.integrations?.viaverde?.key === aggregate.integrationKey;
          default: return false;
        }
      });

      if (driverMatch && driverMatch.id) {
        aggregatedData[driverMatch.id][aggregate.platform].totalValue += aggregate.totalValue;
        aggregatedData[driverMatch.id][aggregate.platform].totalTrips += aggregate.totalTrips;
      }
    });

    // 3. Calcular DriverWeeklyRecord para cada motorista
    for (const driverId in aggregatedData) {
      const driver = drivers.find(d => d.id === driverId);
      if (!driver) continue;

      const data = aggregatedData[driverId];

      const record: DriverWeeklyRecord = createDriverWeeklyRecord({
        driverId: driver.id!,
        driverName: driver.fullName,
        driverEmail: driver.email,
        weekId,
        weekStart,
        weekEnd,
        uberTotal: data.uber.totalValue,
        boltTotal: data.bolt.totalValue,
        myprioTotal: data.myprio.totalValue,
        viaverdeTotal: data.viaverde.totalValue,
        uberTrips: data.uber.totalTrips,
        boltTrips: data.bolt.totalTrips,
        isLocatario: driver.type === 'renter',
        aluguel: driver.rentalFee || 0,
        combustivel: data.myprio.totalValue,
        viaVerde: data.viaverde.totalValue,
        iban: driver.banking?.iban || null,
      }, { type: driver.type, rentalFee: driver.rentalFee });

      records.push(record);
    }

    // Para compatibilidade com a interface, adicionar campos calculados se necessário
    const formattedRecords = records.map(record => ({
      ...record,
      ganhosTotal: record.uberTotal + record.boltTotal, // Exemplo de cálculo, se não estiver já no record
      iva: record.ivaValor, // Mapear para o nome esperado no frontend
      ganhosMenosIva: record.ganhosMenosIVA,
      despesasAdm: record.despesasAdm,
      combustivel: record.combustivel,
      portagens: record.viaverde, // ViaVerde é portagens
      aluguel: record.aluguel,
      valorLiquido: record.repasse,
      driverType: record.isLocatario ? 'renter' : 'affiliate', // Mapear tipo de motorista
      vehicle: drivers.find(d => d.id === record.driverId)?.vehicle?.plate || 'N/A', // Buscar do driver original
      status: record.paymentStatus, // Mapear status de pagamento
    }));

    return res.status(200).json({
      success: true,
      records: formattedRecords,
      weekStart,
      weekEnd,
    });
  } catch (error: any) {
    console.error('Erro ao buscar registros semanais:', error);
    return res.status(500).json({ error: error.message });
  }
}

