import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { WeeklyDataSources, createWeeklyDataSources, updateDataSource } from '@/schemas/weekly-data-sources';
import { DriverWeeklyRecord, createDriverWeeklyRecord, getWeekId } from '@/schemas/driver-weekly-record';
import { Driver } from '@/schemas/driver';
import { RawFileArchiveEntry } from '@/schemas/raw-file-archive';

interface ProcessedDriverData {
  [driverId: string]: {
    driver: Driver;
    uberTotal: number;
    boltTotal: number;
    myprioTotal: number;
    viaverdeTotal: number;
    uberTrips: number;
    boltTrips: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { weekId, rawDataDocIds } = req.body; // Agora recebemos weekId e rawDataDocIds

  if (!weekId || !rawDataDocIds || !Array.isArray(rawDataDocIds) || rawDataDocIds.length === 0) {
    return res.status(400).json({ message: 'Missing weekId or rawDataDocIds' });
  }

  console.log(`Iniciando processamento para a semana: ${weekId} com arquivos: ${rawDataDocIds.join(', ')}`);

  try {
    // 1. Buscar as entradas de rawFileArchive
    const rawFileEntries: RawFileArchiveEntry[] = [];
    for (const docId of rawDataDocIds) {
      const doc = await adminDb.collection('rawFileArchive').doc(docId).get();
      if (doc.exists) {
        rawFileEntries.push({ id: doc.id, ...doc.data() as RawFileArchiveEntry });
      } else {
        console.warn(`Documento rawFileArchive ${docId} não encontrado. Pulando.`);
      }
    }

    if (rawFileEntries.length === 0) {
      console.error(`Nenhuma entrada de rawFileArchive válida encontrada para os IDs fornecidos.`);
      return res.status(404).json({ message: 'No valid rawFileArchive entries found' });
    }

    const { weekStart, weekEnd } = rawFileEntries[0]; // Assumindo que todos são da mesma semana

    console.log(`Semana: ${weekId} (${weekStart} a ${weekEnd})`);

    // 2. Buscar todos os motoristas ativos
    const driversSnapshot = await adminDb.collection('drivers').where('status', '==', 'active').get();
    const drivers: Driver[] = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Driver }));

    console.log(`Encontrados ${drivers.length} motoristas ativos.`);
    drivers.forEach(d => {
      console.log(`- Motorista: ${d.fullName}, ID: ${d.id}, Uber Key: ${d.integrations?.uber?.key}, Bolt Key: ${d.integrations?.bolt?.key}, Myprio Key: ${d.integrations?.myprio?.key}, ViaVerde Key: ${d.integrations?.viaverde?.key}`);
    });

    const processedDriverData: ProcessedDriverData = {};

    drivers.forEach(driver => {
      if (driver.id) {
        processedDriverData[driver.id] = {
          driver,
          uberTotal: 0,
          boltTotal: 0,
          myprioTotal: 0,
          viaverdeTotal: 0,
          uberTrips: 0,
          boltTrips: 0,
        };
      } else {
        console.warn(`Motorista ${driver.fullName} (${driver.email}) sem ID, não será processado.`);
      }
    });

    // 3. Processar cada arquivo bruto importado
    for (const entry of rawFileEntries) {
      console.log(`Processando plataforma: ${entry.platform} do arquivo ${entry.fileName}`);
      const rawDataRows = entry.rawData?.rows;

      if (!rawDataRows) {
        console.warn(`Nenhum dado bruto encontrado para a entrada ${entry.id}. Pulando.`);
        continue;
      }

      switch (entry.platform) {
        case 'uber':
          rawDataRows.forEach((row: any) => {
            const driverUuid = row['UUID do motorista'];
            const driverMatch = drivers.find(d => d.integrations?.uber?.key === driverUuid);
            if (driverMatch && driverMatch.id) {
              const total = parseFloat(row['Pago a si']?.replace(',', '.') || '0');
              const trips = parseInt(row['Viagens'] || '0');
              processedDriverData[driverMatch.id].uberTotal += total;
              processedDriverData[driverMatch.id].uberTrips += trips;
              console.log(`Match Uber: ${driverMatch.fullName} - ${formatCurrency(total)}`);
            }
          });
          break;
        case 'bolt':
          rawDataRows.forEach((row: any) => {
            const driverEmail = row['Email'];
            const driverMatch = drivers.find(d => d.integrations?.bolt?.key === driverEmail);
            if (driverMatch && driverMatch.id) {
              const total = parseFloat(row['Ganhos brutos (total)|€']?.replace(',', '.') || '0');
              const trips = parseInt(row['Viagens (total)'] || '0');
              processedDriverData[driverMatch.id].boltTotal += total;
              processedDriverData[driverMatch.id].boltTrips += trips;
              console.log(`Match Bolt: ${driverMatch.fullName} - ${formatCurrency(total)}`);
            }
          });
          break;
        case 'myprio':
          rawDataRows.forEach((row: any) => {
            const myprioCard = String(row['CARTÃO']);
            const driverMatch = drivers.find(d => d.integrations?.myprio?.key === myprioCard);
            if (driverMatch && driverMatch.id) {
              const total = parseFloat(String(row['TOTAL'])?.replace(',', '.') || '0');
              processedDriverData[driverMatch.id].myprioTotal += total;
              console.log(`Match Myprio: ${driverMatch.fullName} - ${formatCurrency(total)}`);
            }
          });
          break;
        case 'viaverde':
          rawDataRows.forEach((row: any) => {
            const viaverdeOBU = String(row['OBU']);
            const driverMatch = drivers.find(d => d.integrations?.viaverde?.key === viaverdeOBU);
            if (driverMatch && driverMatch.id) {
              const total = parseFloat(String(row['Value'])?.replace(',', '.') || '0');
              processedDriverData[driverMatch.id].viaverdeTotal += total;
              console.log(`Match ViaVerde: ${driverMatch.fullName} - ${formatCurrency(total)}`);
            }
          });
          break;
      }
    }

    // 4. Atualizar/Criar WeeklyDataSources (agora WeeklyReports) e DriverWeeklyRecords
    let weeklyReportDoc = await adminDb.collection('weeklyReports').doc(weekId).get();
    let currentWeeklyReport: WeeklyDataSources; // Reutilizando a interface por enquanto

    if (!weeklyReportDoc.exists) {
      currentWeeklyReport = createWeeklyDataSources(weekId, weekStart, weekEnd);
    } else {
      currentWeeklyReport = { id: weeklyReportDoc.id, ...weeklyReportDoc.data() as WeeklyDataSources };
    }

    // Atualizar status de cada fonte processada no weeklyReport
    for (const entry of rawFileEntries) {
      currentWeeklyReport = updateDataSource(currentWeeklyReport, entry.platform as any, {
        status: 'completed', // Assumimos completo se processado
        origin: 'manual',
        importedAt: new Date().toISOString(),
        archiveRef: entry.id, // Referência ao documento em rawFileArchive
      });
    }

    await adminDb.collection('weeklyReports').doc(weekId).set(currentWeeklyReport, { merge: true });

    console.log('Iniciando gravação dos registros semanais dos motoristas...');
    for (const driverId in processedDriverData) {
      if (!driverId || driverId === 'undefined') {
        console.error('ID de motorista inválido encontrado. Pulando registro.', processedDriverData[driverId]?.driver);
        continue;
      }

      const data = processedDriverData[driverId];
      const driver = data.driver;

      const record: DriverWeeklyRecord = createDriverWeeklyRecord({
        driverId: driver.id!,
        driverName: driver.fullName,
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
        isLocatario: driver.type === 'renter',
        aluguel: driver.rentalFee || 0,
        combustivel: data.myprioTotal,
        viaVerde: data.viaverdeTotal,
      });

      const recordId = `${weekId}-${driver.id}`;
      console.log(`Gravando registro para ${driver.fullName} (ID: ${recordId})`);
      // Salvar na subcoleção driverRecords dentro de weeklyReports
      await adminDb.collection('weeklyReports').doc(weekId).collection('driverRecords').doc(driver.id).set(record, { merge: true });
    }

    // Marcar entradas de rawFileArchive como processadas
    const batch = adminDb.batch();
    for (const entry of rawFileEntries) {
      batch.update(adminDb.collection('rawFileArchive').doc(entry.id!), { processed: true, processedAt: new Date().toISOString() });
    }
    await batch.commit();

    console.log('🎉 Processamento concluído com sucesso!');
    return res.status(200).json({ message: 'Importation processed successfully', weekId });
  } catch (error: any) {
    console.error('❌ Erro no processamento da importação:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message, stack: error.stack });
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
}

