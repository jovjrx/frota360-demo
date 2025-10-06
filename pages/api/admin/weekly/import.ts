import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/firebase-admin';
import formidable from 'formidable';
import fs from 'fs';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  calculateDriverWeeklyRecord, 
  generateWeeklyRecordId,
  getWeekId,
  getWeekDates 
} from '@/schemas/driver-weekly-record';
import { updateDataSource } from '@/schemas/weekly-data-sources';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ProcessedData {
  uber: Map<string, number>;
  bolt: Map<string, number>;
  myprio: Map<string, number>;
  viaverde: Map<string, number>;
}

/**
 * POST /api/admin/weekly/import
 * Processa importação de arquivos semanais
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = formidable({ multiples: true });
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const weekId = Array.isArray(fields.weekId) ? fields.weekId[0] : fields.weekId;
    
    if (!weekId) {
      return res.status(400).json({ error: 'weekId é obrigatório' });
    }

    const { start, end } = getWeekDates(weekId);

    // Buscar todos os motoristas
    const driversSnapshot = await db.collection('drivers').where('status', '==', 'active').get();
    const drivers = driversSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    // Processar arquivos
    const processedData: ProcessedData = {
      uber: new Map(),
      bolt: new Map(),
      myprio: new Map(),
      viaverde: new Map(),
    };

    const results = {
      success: [] as string[],
      errors: [] as Array<{ platform: string; error: string }>,
      warnings: [] as string[],
    };

    // Processar Uber
    if (files.uber) {
      try {
        const uberFile = Array.isArray(files.uber) ? files.uber[0] : files.uber;
        const content = fs.readFileSync(uberFile.filepath, 'utf-8');
        const parsed = Papa.parse(content, { header: true });
        
        parsed.data.forEach((row: any) => {
          const uuid = row['UUID do motorista'] || row['Driver UUID'];
          const pagoASi = parseFloat(row['Pago a si'] || row['Paid to you'] || '0');
          
          if (uuid && pagoASi > 0) {
            processedData.uber.set(uuid, pagoASi);
          }
        });
        
        results.success.push(`Uber: ${processedData.uber.size} motoristas processados`);
      } catch (error: any) {
        results.errors.push({ platform: 'Uber', error: error.message });
      }
    }

    // Processar Bolt
    if (files.bolt) {
      try {
        const boltFile = Array.isArray(files.bolt) ? files.bolt[0] : files.bolt;
        const content = fs.readFileSync(boltFile.filepath, 'utf-8');
        const parsed = Papa.parse(content, { header: true });
        
        parsed.data.forEach((row: any) => {
          const driverId = row['ID do motorista'] || row['Driver ID'];
          const ganhosBrutos = parseFloat(row['Ganhos brutos (total)'] || row['Gross earnings (total)'] || '0');
          
          if (driverId && ganhosBrutos > 0) {
            processedData.bolt.set(driverId, ganhosBrutos);
          }
        });
        
        results.success.push(`Bolt: ${processedData.bolt.size} motoristas processados`);
      } catch (error: any) {
        results.errors.push({ platform: 'Bolt', error: error.message });
      }
    }

    // Processar myprio
    if (files.myprio) {
      try {
        const myprioFile = Array.isArray(files.myprio) ? files.myprio[0] : files.myprio;
        const workbook = XLSX.readFile(myprioFile.filepath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        data.forEach((row: any) => {
          const cardNumber = row['Número do cartão'] || row['Card number'] || row['Cartão'];
          const valor = parseFloat(row['Valor'] || row['Amount'] || '0');
          
          if (cardNumber && valor > 0) {
            const existing = processedData.myprio.get(cardNumber) || 0;
            processedData.myprio.set(cardNumber, existing + valor);
          }
        });
        
        results.success.push(`myprio: ${processedData.myprio.size} cartões processados`);
      } catch (error: any) {
        results.errors.push({ platform: 'myprio', error: error.message });
      }
    }

    // Processar ViaVerde
    if (files.viaverde) {
      try {
        const viaverdeFile = Array.isArray(files.viaverde) ? files.viaverde[0] : files.viaverde;
        const workbook = XLSX.readFile(viaverdeFile.filepath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        data.forEach((row: any) => {
          const plate = row['Matrícula'] || row['License Plate'] || row['Placa'];
          const valor = parseFloat(row['Valor'] || row['Amount'] || '0');
          
          if (plate && valor > 0) {
            const existing = processedData.viaverde.get(plate) || 0;
            processedData.viaverde.set(plate, existing + valor);
          }
        });
        
        results.success.push(`ViaVerde: ${processedData.viaverde.size} matrículas processadas`);
      } catch (error: any) {
        results.errors.push({ platform: 'ViaVerde', error: error.message });
      }
    }

    // Criar/atualizar registros semanais
    const recordsCreated = [];
    
    for (const driver of drivers) {
      const recordId = generateWeeklyRecordId(driver.id, weekId);
      
      // Buscar dados do motorista
      const uberTotal = processedData.uber.get(driver.integrations?.uber?.uuid) || 0;
      const boltTotal = processedData.bolt.get(driver.integrations?.bolt?.id) || 0;
      const combustivel = processedData.myprio.get(driver.cards?.myprio) || 0;
      const viaverde = processedData.viaverde.get(driver.vehicle?.plate) || 0;
      
      // Só criar registro se tiver algum dado
      if (uberTotal > 0 || boltTotal > 0 || combustivel > 0 || viaverde > 0) {
        const record = calculateDriverWeeklyRecord(
          {
            id: recordId,
            driverId: driver.id,
            driverName: driver.name || driver.fullName,
            weekId,
            weekStart: start,
            weekEnd: end,
            uberTotal,
            boltTotal,
            combustivel,
            viaverde,
            aluguel: driver.rentalFee || 0,
            iban: driver.banking?.iban,
            dataSource: 'manual',
          },
          {
            type: driver.type || 'affiliate',
            rentalFee: driver.rentalFee || 0,
          }
        );
        
        await db.collection('driverWeeklyRecords').doc(recordId).set(record);
        recordsCreated.push(driver.name);
      }
    }

    // Atualizar weeklyDataSources
    const weekDoc = await db.collection('weeklyDataSources').doc(weekId).get();
    let weekData = weekDoc.exists ? weekDoc.data() : null;
    
    if (!weekData) {
      const { createWeeklyDataSources } = await import('@/schemas/weekly-data-sources');
      weekData = createWeeklyDataSources(weekId, start, end);
    }

    // Atualizar status de cada fonte
    if (processedData.uber.size > 0) {
      weekData = updateDataSource(weekData as any, 'uber', {
        status: 'complete',
        origin: 'manual',
        driversCount: processedData.uber.size,
        recordsCount: processedData.uber.size,
      });
    }

    if (processedData.bolt.size > 0) {
      weekData = updateDataSource(weekData as any, 'bolt', {
        status: 'complete',
        origin: 'manual',
        driversCount: processedData.bolt.size,
        recordsCount: processedData.bolt.size,
      });
    }

    if (processedData.myprio.size > 0) {
      weekData = updateDataSource(weekData as any, 'myprio', {
        status: 'complete',
        origin: 'manual',
        recordsCount: processedData.myprio.size,
      });
    }

    if (processedData.viaverde.size > 0) {
      weekData = updateDataSource(weekData as any, 'viaverde', {
        status: 'complete',
        origin: 'manual',
        recordsCount: processedData.viaverde.size,
      });
    }

    await db.collection('weeklyDataSources').doc(weekId).set(weekData);

    results.success.push(`Registros criados: ${recordsCreated.length} motoristas`);

    return res.status(200).json({
      success: true,
      results,
      recordsCreated: recordsCreated.length,
      weekId,
    });
  } catch (error: any) {
    console.error('Erro ao processar importação:', error);
    return res.status(500).json({ error: error.message });
  }
}
