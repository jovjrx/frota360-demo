import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { WeeklyDataSources, createWeeklyDataSources, updateDataSource } from '@/schemas/weekly-data-sources';
import { RawFileArchiveEntry } from '@/schemas/raw-file-archive';
import { createWeeklyPlatformAggregates, WeeklyPlatformAggregates } from '@/schemas/weekly-platform-aggregates';
import { getWeekId } from '@/schemas/driver-weekly-record'; // Apenas para getWeekId

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { weekId, rawDataDocIds } = req.body;

  if (!weekId || !rawDataDocIds || !Array.isArray(rawDataDocIds) || rawDataDocIds.length === 0) {
    return res.status(400).json({ message: 'Missing weekId or rawDataDocIds' });
  }

  console.log(`Iniciando processamento para a semana: ${weekId} com arquivos: ${rawDataDocIds.join(', ')}`);

  try {
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

    const { weekStart, weekEnd } = rawFileEntries[0];

    console.log(`Semana: ${weekId} (${weekStart} a ${weekEnd})`);

    const platformAggregates: { [platform_key: string]: WeeklyPlatformAggregates } = {};

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
            if (driverUuid) {
              const key = `${entry.platform}-${driverUuid}`;
              if (!platformAggregates[key]) {
                platformAggregates[key] = createWeeklyPlatformAggregates({
                  weekId, weekStart, weekEnd, platform: 'uber', integrationKey: driverUuid,
                });
              }
              platformAggregates[key].totalValue += parseFloat(row['Pago a si']?.replace(',', '.') || '0');
              platformAggregates[key].totalTrips += parseInt(row['Viagens'] || '0');
            }
          });
          break;
        case 'bolt':
          rawDataRows.forEach((row: any) => {
            const driverEmail = row['Email'];
            if (driverEmail) {
              const key = `${entry.platform}-${driverEmail}`;
              if (!platformAggregates[key]) {
                platformAggregates[key] = createWeeklyPlatformAggregates({
                  weekId, weekStart, weekEnd, platform: 'bolt', integrationKey: driverEmail,
                });
              }
              platformAggregates[key].totalValue += parseFloat(row['Ganhos brutos (total)|€']?.replace(',', '.') || '0');
              platformAggregates[key].totalTrips += parseInt(row['Viagens (total)'] || '0');
            }
          });
          break;
        case 'myprio':
          rawDataRows.forEach((row: any) => {
            const myprioCard = String(row['CARTÃO']);
            if (myprioCard) {
              const key = `${entry.platform}-${myprioCard}`;
              if (!platformAggregates[key]) {
                platformAggregates[key] = createWeeklyPlatformAggregates({
                  weekId, weekStart, weekEnd, platform: 'myprio', integrationKey: myprioCard,
                });
              }
              platformAggregates[key].totalValue += parseFloat(String(row['TOTAL'])?.replace(',', '.') || '0');
            }
          });
          break;
        case 'viaverde':
          rawDataRows.forEach((row: any) => {
            const viaverdeOBU = String(row['OBU']);
            if (viaverdeOBU) {
              const key = `${entry.platform}-${viaverdeOBU}`;
              if (!platformAggregates[key]) {
                platformAggregates[key] = createWeeklyPlatformAggregates({
                  weekId, weekStart, weekEnd, platform: 'viaverde', integrationKey: viaverdeOBU,
                });
              }
              platformAggregates[key].totalValue += parseFloat(String(row['Value'])?.replace(',', '.') || '0');
            }
          });
          break;
      }
    }

    // Salvar os agregados por plataforma na coleção 'weeklyPlatformAggregates'
    const batch = adminDb.batch();
    for (const key in platformAggregates) {
      const aggregate = platformAggregates[key];
      const docRef = adminDb.collection('weeklyPlatformAggregates').doc(`${weekId}-${aggregate.platform}-${aggregate.integrationKey}`);
      batch.set(docRef, aggregate, { merge: true });
    }

    // Atualizar o status das fontes de dados na coleção 'weeklyReports'
    let weeklyReportDoc = await adminDb.collection('weeklyReports').doc(weekId).get();
    let currentWeeklyReport: WeeklyDataSources; // Reutilizando a interface por enquanto

    if (!weeklyReportDoc.exists) {
      currentWeeklyReport = createWeeklyDataSources(weekId, weekStart, weekEnd);
    } else {
      currentWeeklyReport = { id: weeklyReportDoc.id, ...weeklyReportDoc.data() as WeeklyDataSources };
    }

    for (const entry of rawFileEntries) {
      currentWeeklyReport = updateDataSource(currentWeeklyReport, entry.platform as any, {
        status: 'completed',
        origin: 'manual',
        importedAt: new Date().toISOString(),
        archiveRef: entry.id,
      });
    }
    batch.set(adminDb.collection('weeklyReports').doc(weekId), currentWeeklyReport, { merge: true });

    // Marcar entradas de rawFileArchive como processadas
    for (const entry of rawFileEntries) {
      batch.update(adminDb.collection('rawFileArchive').doc(entry.id!), { processed: true, processedAt: new Date().toISOString() });
    }

    await batch.commit();

    console.log('🎉 Processamento de dados brutos para agregados de plataforma concluído com sucesso!');
    return res.status(200).json({ message: 'Raw data processed to platform aggregates successfully', weekId });
  } catch (error: any) {
    console.error('❌ Erro no processamento da importação:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message, stack: error.stack });
  }
}

