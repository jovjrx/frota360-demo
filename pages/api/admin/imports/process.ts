import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { getSession } from 'next-auth/react';
import { WeeklyDataSources, createWeeklyDataSources, updateDataSource } from '@/schemas/weekly-data-sources';
import { DriverWeeklyRecord, createDriverWeeklyRecord, getWeekId } from '@/schemas/driver-weekly-record';
import { Driver } from '@/schemas/driver';
import { RawImportData } from '@/schemas/raw-import-data'; // Assuming this schema exists or will be created

interface ProcessedDriverData {
  [driverId: string]: {
    driver: Driver;
    uberTotal: number;
    boltTotal: number;
    myprioTotal: number;
    viaverdeTotal: number;
    uberTrips: number;
    boltTrips: number;
    uberUuid: string;
    boltEmail: string;
    myprioCard: string;
    viaverdeOBU: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Reativar autenticação
  const session = await getSession({ req });
  if (!session || session.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { importId } = req.body; // Agora recebemos um importId para processar

  if (!importId) {
    return res.status(400).json({ message: 'Missing importId' });
  }

  try {
    // 1. Buscar todas as entradas de importação para este importId
    const importEntriesSnapshot = await adminDb.collection('weeklyDataImports')
      .where('importId', '==', importId)
      .get();

    if (importEntriesSnapshot.empty) {
      return res.status(404).json({ message: 'No import entries found for this importId' });
    }

    const importEntries: RawImportData[] = importEntriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as RawImportData
    }));

    // Extrair weekId, weekStart, weekEnd do primeiro entry (assumindo consistência)
    const { weekId, weekStart, weekEnd } = importEntries[0];

    // 2. Buscar todos os motoristas ativos
    const driversSnapshot = await adminDb.collection('drivers').where('status', '==', 'active').get();
    const drivers: Driver[] = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Driver }));

    const processedDriverData: ProcessedDriverData = {};

    // Inicializar processedDriverData com todos os motoristas
    drivers.forEach(driver => {
      processedDriverData[driver.id] = {
        driver,
        uberTotal: 0,
        boltTotal: 0,
        myprioTotal: 0,
        viaverdeTotal: 0,
        uberTrips: 0,
        boltTrips: 0,
        uberUuid: driver.integrations?.uber?.uuid || '',
        boltEmail: driver.email || '', // Usar email para Bolt
        myprioCard: driver.cards?.myprio || '',
        viaverdeOBU: driver.cards?.viaverde || '',
      };
    });

    // 3. Processar cada arquivo importado
    for (const entry of importEntries) {
      const rawDataDoc = await adminDb.collection('rawWeeklyData').doc(entry.rawDataSourceRef!).get();
      const rawData = rawDataDoc.data()?.rawData.rows; // Assumindo que rawData.rows contém os dados

      if (!rawData) {
        console.warn(`No raw data found for entry ${entry.id}`);
        continue;
      }

      switch (entry.platform) {
        case 'uber':
          rawData.forEach((row: any) => {
            const driverUuid = row['UUID do motorista'];
            const driverMatch = drivers.find(d => d.integrations?.uber?.uuid === driverUuid);
            if (driverMatch) {
              const total = parseFloat(row['Pago a si'] || '0');
              const trips = parseInt(row['Viagens'] || '0');
              processedDriverData[driverMatch.id].uberTotal += total;
              processedDriverData[driverMatch.id].uberTrips += trips;
            }
          });
          break;
        case 'bolt':
          rawData.forEach((row: any) => {
            const driverEmail = row['Email']; // Usar email para Bolt
            const driverMatch = drivers.find(d => d.email === driverEmail);
            if (driverMatch) {
              const total = parseFloat(row['Ganhos brutos (total)|€'] || '0');
              const trips = parseInt(row['Viagens (total)'] || '0');
              processedDriverData[driverMatch.id].boltTotal += total;
              processedDriverData[driverMatch.id].boltTrips += trips;
            }
          });
          break;
        case 'myprio':
          rawData.forEach((row: any) => {
            const myprioCard = String(row['CARTÃO']);
            const driverMatch = drivers.find(d => d.cards?.myprio === myprioCard);
            if (driverMatch) {
              const total = parseFloat(row['TOTAL'] || '0');
              processedDriverData[driverMatch.id].myprioTotal += total;
            }
          });
          break;
        case 'viaverde':
          rawData.forEach((row: any) => {
            const viaverdeOBU = String(row['OBU']);
            const entryDate = new Date(row['Entry Date']);
            const exitDate = new Date(row['Exit Date']);

            // Filtrar transações dentro da semana de importação
            const weekStartDate = new Date(weekStart);
            const weekEndDate = new Date(weekEnd);

            if (entryDate >= weekStartDate && exitDate <= weekEndDate) {
              const driverMatch = drivers.find(d => d.cards?.viaverde === viaverdeOBU);
              if (driverMatch) {
                const total = parseFloat(row['Value'] || '0');
                processedDriverData[driverMatch.id].viaverdeTotal += total;
              } else {
                console.warn(`Transação ViaVerde para OBU ${viaverdeOBU} não encontrada para motorista ativo.`);
              }
            } else {
              console.warn(`Transação ViaVerde (${row['Entry Date']} - ${row['Exit Date']}) fora do período da semana (${weekStart} - ${weekEnd}). Ignorando.`);
            }
          });
          break;
      }
    }

    // 4. Atualizar/Criar WeeklyDataSources e DriverWeeklyRecords
    let weeklyDataSources = await adminDb.collection('weeklyDataSources').doc(weekId).get();
    let currentSources: WeeklyDataSources;

    if (!weeklyDataSources.exists) {
      currentSources = createWeeklyDataSources(weekId, weekStart, weekEnd);
    } else {
      currentSources = { id: weeklyDataSources.id, ...weeklyDataSources.data() as WeeklyDataSources };
    }

    // Atualizar status de cada fonte processada
    for (const entry of importEntries) {
      currentSources = updateDataSource(currentSources, entry.platform as any, {
        status: 'complete', // Assumimos completo se processado
        origin: 'manual',
        importedAt: new Date().toISOString(),
        // driversCount e recordsCount podem ser calculados aqui se necessário
      });
    }

    await adminDb.collection('weeklyDataSources').doc(weekId).set(currentSources, { merge: true });

    for (const driverId in processedDriverData) {
      const data = processedDriverData[driverId];
      const driver = data.driver;

      const record: DriverWeeklyRecord = createDriverWeeklyRecord({
        driverId: driver.id,
        driverName: driver.firstName + ' ' + driver.lastName,
        driverEmail: driver.email,
        weekId,
        weekStart,
        weekEnd,
        uberTotal: data.uberTotal,
        boltTotal: data.boltTotal,
        myprioTotal: data.myprioTotal,
        viaverdeTotal: data.viaverdeTotal,
        uberTrips: data.uberTrips,
        boltTrips: data.boltTrips,
        isLocatario: driver.isLocatario || false,
        aluguel: driver.aluguel || 0,
        combustivel: data.myprioTotal, // myprioTotal é o combustível
        viaVerde: data.viaverdeTotal, // viaverdeTotal é o ViaVerde
      });

      // Salvar ou atualizar o registro semanal do motorista
      await adminDb.collection('driverWeeklyRecords').doc(`${weekId}-${driver.id}`).set(record, { merge: true });
    }

    // Marcar entradas de importação como processadas
    const batch = adminDb.batch();
    importEntriesSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { processed: true, processedAt: new Date().toISOString() });
    });
    await batch.commit();

    return res.status(200).json({ message: 'Importation processed successfully', weekId });
  } catch (error: any) {
    console.error('Error processing import:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

