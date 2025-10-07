import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb as db } from '@/lib/firebaseAdmin';

/**
 * POST /api/admin/weekly/process-week
 * Processa dados brutos das 4 collections e retorna registros calculados por motorista
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { weekStart, weekEnd } = req.body;

    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart e weekEnd são obrigatórios' });
    }

    // Buscar todos os motoristas ativos
    const driversSnapshot = await db
      .collection('drivers')
      .where('status', '==', 'active')
      .get();

    const drivers = driversSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Buscar dados brutos das 4 collections
    const [uberSnapshot, boltSnapshot, prioSnapshot, viaverdeSnapshot] = await Promise.all([
      db.collection('raw_uber')
        .where('weekStart', '==', weekStart)
        .where('weekEnd', '==', weekEnd)
        .get(),
      db.collection('raw_bolt')
        .where('weekStart', '==', weekStart)
        .where('weekEnd', '==', weekEnd)
        .get(),
      db.collection('raw_prio')
        .where('weekStart', '==', weekStart)
        .where('weekEnd', '==', weekEnd)
        .get(),
      db.collection('raw_viaverde')
        .where('weekStart', '==', weekStart)
        .where('weekEnd', '==', weekEnd)
        .get(),
    ]);

    // Organizar dados por chave
    const uberData = new Map<string, number>();
    uberSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const existing = uberData.get(data.driverUuid) || 0;
      uberData.set(data.driverUuid, existing + (data.paidToYou || 0));
    });

    const boltData = new Map<string, number>();
    boltSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const existing = boltData.get(data.driverEmail) || 0;
      boltData.set(data.driverEmail, existing + (data.grossEarningsTotal || 0));
    });

    const prioData = new Map<string, number>();
    prioSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const existing = prioData.get(data.cardNumber) || 0;
      prioData.set(data.cardNumber, existing + (data.totalValue || 0));
    });

    const viaverdeData = new Map<string, number>();
    viaverdeSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const existing = viaverdeData.get(data.licensePlate) || 0;
      viaverdeData.set(data.licensePlate, existing + (data.liquidValue || 0));
    });

    // Processar cada motorista
    const records = [];

    for (const driver of drivers) {
      const integrations = driver.integrations || {};

      // Buscar dados do motorista usando integrations
      let uberTotal = 0;
      if (integrations.uber?.enabled && integrations.uber?.key) {
        uberTotal = uberData.get(integrations.uber.key) || 0;
      }

      let boltTotal = 0;
      if (integrations.bolt?.enabled && integrations.bolt?.key) {
        boltTotal = boltData.get(integrations.bolt.key) || 0;
      }

      let combustivel = 0;
      if (integrations.myprio?.enabled && integrations.myprio?.key) {
        combustivel = prioData.get(integrations.myprio.key) || 0;
      }

      let portagens = 0;
      if (integrations.viaverde?.enabled && integrations.viaverde?.key) {
        portagens = viaverdeData.get(integrations.viaverde.key) || 0;
      }

      // Calcular valores
      const ganhosTotal = uberTotal + boltTotal;
      const iva = ganhosTotal * 0.06;
      const ganhosMenosIva = ganhosTotal - iva;
      const despesasAdm = ganhosMenosIva * 0.07;
      const aluguel = driver.type === 'renter' ? 290 : 0;
      const valorLiquido = ganhosMenosIva - despesasAdm - combustivel - portagens - aluguel;

      // Só incluir se tiver algum dado
      if (ganhosTotal > 0 || combustivel > 0 || portagens > 0) {
        records.push({
          driverId: driver.id,
          driverName: driver.name || driver.fullName,
          driverType: driver.type || 'affiliate',
          vehicle: driver.vehicle?.plate || 'N/A',
          weekStart,
          weekEnd,
          uberTotal,
          boltTotal,
          ganhosTotal,
          iva,
          ganhosMenosIva,
          despesasAdm,
          combustivel,
          portagens,
          aluguel,
          valorLiquido,
          iban: driver.banking?.iban || 'N/A',
          status: 'pending',
        });
      }
    }

    return res.status(200).json({
      success: true,
      records,
      weekStart,
      weekEnd,
    });
  } catch (error: any) {
    console.error('Erro ao processar semana:', error);
    return res.status(500).json({ error: error.message });
  }
}
