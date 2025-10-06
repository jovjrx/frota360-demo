import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  calculateDriverWeeklyRecord, 
  generateWeeklyRecordId,
  getWeekId,
  DriverWeeklyRecord 
} from '@/schemas/driver-weekly-record';
import { updateDataSource } from '@/schemas/weekly-data-sources';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação admin
    const session = await getSession(req, res);
    if (!session?.isLoggedIn) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { importId } = req.body;

    if (!importId) {
      return res.status(400).json({ error: 'importId é obrigatório' });
    }

    const db = getFirestore();

    // Buscar todas as importações com este importId que ainda não foram processadas
    const importsSnapshot = await db.collection('weeklyDataImports')
      .where('importId', '==', importId)
      .where('processed', '==', false)
      .get();

    if (importsSnapshot.empty) {
      return res.status(404).json({ error: 'Nenhuma importação pendente encontrada' });
    }

    const results = {
      success: [] as string[],
      errors: [] as { platform: string; error: string }[],
      warnings: [] as string[],
    };

    // Obter semana da primeira importação
    const firstImport = importsSnapshot.docs[0].data();
    const weekStart = firstImport.weekStart;
    const weekEnd = firstImport.weekEnd;
    const weekId = getWeekId(new Date(weekStart));

    // Buscar todos os motoristas ativos
    const driversSnapshot = await db.collection('drivers')
      .where('status', '==', 'active')
      .get();

    const driversMap = new Map();
    driversSnapshot.forEach(doc => {
      driversMap.set(doc.id, { id: doc.id, ...doc.data() });
    });

    // Mapas para acumular dados de cada plataforma
    const dataByDriver = new Map<string, {
      driverId: string;
      driverName: string;
      uberTotal: number;
      boltTotal: number;
      combustivel: number;
      viaverde: number;
      aluguel: number;
      iban?: string;
      type: 'affiliate' | 'renter';
      rentalFee: number;
    }>();

    // Processar cada importação
    for (const doc of importsSnapshot.docs) {
      const importData = doc.data();
      const platform = importData.platform;

      try {
        if (platform === 'uber') {
          await processUberData(importData, driversMap, dataByDriver, results.warnings);
          results.success.push(`Uber: processado com sucesso`);
        } else if (platform === 'bolt') {
          await processBoltData(importData, driversMap, dataByDriver, results.warnings);
          results.success.push(`Bolt: processado com sucesso`);
        } else if (platform === 'myprio') {
          await processMyprioData(importData, driversMap, dataByDriver, results.warnings);
          results.success.push(`myprio: processado com sucesso`);
        } else if (platform === 'viaverde') {
          await processViaverdeData(importData, driversMap, dataByDriver, results.warnings);
          results.success.push(`ViaVerde: processado com sucesso`);
        }

        // Marcar como processado
        await doc.ref.update({
          processed: true,
          processedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Error processing ${platform}:`, error);
        results.errors.push({
          platform,
          error: error instanceof Error ? error.message : 'Erro no processamento',
        });
      }
    }

    // Criar/atualizar registros semanais para cada motorista
    let recordsCreated = 0;
    for (const [driverId, data] of dataByDriver.entries()) {
      const recordId = generateWeeklyRecordId(driverId, weekId);

      const record = calculateDriverWeeklyRecord(
        {
          id: recordId,
          driverId: data.driverId,
          driverName: data.driverName,
          weekId,
          weekStart,
          weekEnd,
          uberTotal: data.uberTotal,
          boltTotal: data.boltTotal,
          combustivel: data.combustivel,
          viaverde: data.viaverde,
          aluguel: data.aluguel,
          iban: data.iban,
          dataSource: 'manual',
        },
        {
          type: data.type,
          rentalFee: data.rentalFee,
        }
      );

      await db.collection('driverWeeklyRecords').doc(recordId).set(record);
      recordsCreated++;
    }

    results.success.push(`Registros criados/atualizados: ${recordsCreated} motoristas`);

    // Atualizar weeklyDataSources
    const weekDoc = await db.collection('weeklyDataSources').doc(weekId).get();
    let weekData = weekDoc.exists ? weekDoc.data() : null;

    if (!weekData) {
      const { createWeeklyDataSources } = await import('@/schemas/weekly-data-sources');
      weekData = createWeeklyDataSources(weekId, weekStart, weekEnd);
    }

    // Atualizar status de cada fonte processada
    for (const doc of importsSnapshot.docs) {
      const importData = doc.data();
      const platform = importData.platform as 'uber' | 'bolt' | 'myprio' | 'viaverde';
      
      const driversCount = Array.from(dataByDriver.values()).filter(d => {
        if (platform === 'uber') return d.uberTotal > 0;
        if (platform === 'bolt') return d.boltTotal > 0;
        if (platform === 'myprio') return d.combustivel > 0;
        if (platform === 'viaverde') return d.viaverde > 0;
        return false;
      }).length;

      weekData = updateDataSource(weekData as any, platform, {
        status: 'complete',
        origin: 'manual',
        driversCount,
        recordsCount: importData.rawData?.rows?.length || 0,
      });
    }

    await db.collection('weeklyDataSources').doc(weekId).set(weekData);

    return res.status(200).json({
      success: true,
      results,
      recordsCreated,
      weekId,
    });
  } catch (error) {
    console.error('Error processing imports:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}

/**
 * Processa dados do Uber
 */
async function processUberData(
  importData: any,
  driversMap: Map<string, any>,
  dataByDriver: Map<string, any>,
  warnings: string[]
): Promise<void> {
  const rows = importData.rawData?.rows || [];

  for (const row of rows) {
    const uuid = row['UUID do motorista'] || row['Driver UUID'];
    
    if (!uuid) {
      warnings.push('Uber: Linha sem UUID do motorista (ignorada)');
      continue;
    }

    // Buscar motorista pelo UUID
    let driver = null;
    for (const [id, d] of driversMap.entries()) {
      if (d.integrations?.uber?.uuid === uuid) {
        driver = d;
        break;
      }
    }

    if (!driver) {
      warnings.push(`Uber: Motorista com UUID ${uuid} não encontrado`);
      continue;
    }

    // Extrair valor "Pago a si"
    const pagoASi = parseFloat(row['Pago a si'] || row['Paid to you'] || '0');

    if (pagoASi <= 0) {
      continue;
    }

    // Obter ou criar entrada do motorista
    let driverData = dataByDriver.get(driver.id);
    if (!driverData) {
      driverData = {
        driverId: driver.id,
        driverName: driver.name || driver.fullName || 'Unknown',
        uberTotal: 0,
        boltTotal: 0,
        combustivel: 0,
        viaverde: 0,
        aluguel: driver.rentalFee || 0,
        iban: driver.banking?.iban,
        type: driver.type || 'affiliate',
        rentalFee: driver.rentalFee || 0,
      };
      dataByDriver.set(driver.id, driverData);
    }

    driverData.uberTotal += pagoASi;
  }
}

/**
 * Processa dados do Bolt
 */
async function processBoltData(
  importData: any,
  driversMap: Map<string, any>,
  dataByDriver: Map<string, any>,
  warnings: string[]
): Promise<void> {
  const rows = importData.rawData?.rows || [];

  for (const row of rows) {
    const driverId = row['ID do motorista'] || row['Driver ID'];
    
    if (!driverId) {
      warnings.push('Bolt: Linha sem ID do motorista (ignorada)');
      continue;
    }

    // Buscar motorista pelo ID do Bolt
    let driver = null;
    for (const [id, d] of driversMap.entries()) {
      if (d.integrations?.bolt?.id === driverId) {
        driver = d;
        break;
      }
    }

    if (!driver) {
      warnings.push(`Bolt: Motorista com ID ${driverId} não encontrado`);
      continue;
    }

    // Extrair "Ganhos brutos (total)"
    const ganhosBrutos = parseFloat(row['Ganhos brutos (total)'] || row['Gross earnings (total)'] || '0');

    if (ganhosBrutos <= 0) {
      continue;
    }

    // Obter ou criar entrada do motorista
    let driverData = dataByDriver.get(driver.id);
    if (!driverData) {
      driverData = {
        driverId: driver.id,
        driverName: driver.name || driver.fullName || 'Unknown',
        uberTotal: 0,
        boltTotal: 0,
        combustivel: 0,
        viaverde: 0,
        aluguel: driver.rentalFee || 0,
        iban: driver.banking?.iban,
        type: driver.type || 'affiliate',
        rentalFee: driver.rentalFee || 0,
      };
      dataByDriver.set(driver.id, driverData);
    }

    driverData.boltTotal += ganhosBrutos;
  }
}

/**
 * Processa dados do myprio
 */
async function processMyprioData(
  importData: any,
  driversMap: Map<string, any>,
  dataByDriver: Map<string, any>,
  warnings: string[]
): Promise<void> {
  const rows = importData.rawData?.rows || [];

  for (const row of rows) {
    const cardNumber = row['Número do cartão'] || row['Card number'] || row['Cartão'];
    const valor = parseFloat(row['Valor'] || row['Amount'] || '0');
    
    if (!cardNumber) {
      warnings.push('myprio: Transação sem número de cartão (ignorada)');
      continue;
    }

    if (valor <= 0) {
      continue;
    }

    // Buscar motorista pelo cartão
    let driver = null;
    for (const [id, d] of driversMap.entries()) {
      if (d.cards?.myprio === cardNumber) {
        driver = d;
        break;
      }
    }

    if (!driver) {
      warnings.push(`myprio: Motorista com cartão ${cardNumber} não encontrado`);
      continue;
    }

    // Obter ou criar entrada do motorista
    let driverData = dataByDriver.get(driver.id);
    if (!driverData) {
      driverData = {
        driverId: driver.id,
        driverName: driver.name || driver.fullName || 'Unknown',
        uberTotal: 0,
        boltTotal: 0,
        combustivel: 0,
        viaverde: 0,
        aluguel: driver.rentalFee || 0,
        iban: driver.banking?.iban,
        type: driver.type || 'affiliate',
        rentalFee: driver.rentalFee || 0,
      };
      dataByDriver.set(driver.id, driverData);
    }

    driverData.combustivel += valor;
  }
}

/**
 * Processa dados do ViaVerde
 */
async function processViaverdeData(
  importData: any,
  driversMap: Map<string, any>,
  dataByDriver: Map<string, any>,
  warnings: string[]
): Promise<void> {
  const rows = importData.rawData?.rows || [];

  for (const row of rows) {
    const plate = row['Matrícula'] || row['License Plate'] || row['Placa'];
    const valor = parseFloat(row['Valor'] || row['Amount'] || '0');
    
    if (!plate) {
      warnings.push('ViaVerde: Transação sem matrícula (ignorada)');
      continue;
    }

    if (valor <= 0) {
      continue;
    }

    // Buscar motorista pela matrícula
    let driver = null;
    for (const [id, d] of driversMap.entries()) {
      if (d.vehicle?.plate === plate) {
        driver = d;
        break;
      }
    }

    if (!driver) {
      warnings.push(`ViaVerde: Motorista com matrícula ${plate} não encontrado`);
      continue;
    }

    // Obter ou criar entrada do motorista
    let driverData = dataByDriver.get(driver.id);
    if (!driverData) {
      driverData = {
        driverId: driver.id,
        driverName: driver.name || driver.fullName || 'Unknown',
        uberTotal: 0,
        boltTotal: 0,
        combustivel: 0,
        viaverde: 0,
        aluguel: driver.rentalFee || 0,
        iban: driver.banking?.iban,
        type: driver.type || 'affiliate',
        rentalFee: driver.rentalFee || 0,
      };
      dataByDriver.set(driver.id, driverData);
    }

    driverData.viaverde += valor;
  }
}
