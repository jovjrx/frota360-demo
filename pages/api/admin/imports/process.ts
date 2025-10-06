import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { getFirestore } from 'firebase-admin/firestore';
import { 
  WeeklyDataImport, 
  ProcessedWeeklyRecord, 
  createEmptyWeeklyRecord, 
  calculateWeeklyTotals 
} from '@/schemas/weekly-data-import';

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

    // Processar cada importação
    for (const doc of importsSnapshot.docs) {
      const importData = doc.data() as WeeklyDataImport;

      try {
        const processResult = await processImport(importData, session.userId || 'unknown');
        
        if (processResult.success) {
          results.success.push(`${importData.platform}: ${processResult.recordsProcessed} motoristas`);
          
          // Marcar como processado
          await doc.ref.update({
            processed: true,
            processedAt: new Date().toISOString(),
          });
        } else {
          results.errors.push({
            platform: importData.platform,
            error: processResult.error || 'Erro desconhecido',
          });
        }

        if (processResult.warnings && processResult.warnings.length > 0) {
          results.warnings.push(...processResult.warnings);
        }
      } catch (error) {
        console.error(`Error processing ${importData.platform}:`, error);
        results.errors.push({
          platform: importData.platform,
          error: error instanceof Error ? error.message : 'Erro no processamento',
        });
      }
    }

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error processing imports:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Processa uma importação de dados
 */
async function processImport(importData: WeeklyDataImport, adminId: string): Promise<{
  success: boolean;
  recordsProcessed: number;
  error?: string;
  warnings?: string[];
}> {
  const db = getFirestore();
  const warnings: string[] = [];
  let recordsProcessed = 0;

  // Processar conforme a plataforma
  switch (importData.platform) {
    case 'uber':
      const uberResult = await processUberImport(importData, db, warnings);
      recordsProcessed = uberResult;
      break;

    case 'bolt':
      const boltResult = await processBoltImport(importData, db, warnings);
      recordsProcessed = boltResult;
      break;

    case 'myprio':
      const myprioResult = await processMyprioImport(importData, db, warnings);
      recordsProcessed = myprioResult;
      break;

    case 'viaverde':
      const viaverdeResult = await processViaverdeImport(importData, db, warnings);
      recordsProcessed = viaverdeResult;
      break;

    default:
      return {
        success: false,
        recordsProcessed: 0,
        error: `Plataforma ${importData.platform} não suportada`,
      };
  }

  return {
    success: true,
    recordsProcessed,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Processa importação do Uber
 */
async function processUberImport(
  importData: WeeklyDataImport,
  db: FirebaseFirestore.Firestore,
  warnings: string[]
): Promise<number> {
  const rows = importData.rawData.rows || [];
  let processed = 0;

  for (const row of rows) {
    try {
      const uberUuid = row['UUID do motorista'];
      
      if (!uberUuid) {
        warnings.push('Uber: Linha sem UUID do motorista (ignorada)');
        continue;
      }

      // Buscar motorista pelo UUID do Uber
      const driversSnapshot = await db.collection('drivers')
        .where('integrations.uber.uuid', '==', uberUuid)
        .limit(1)
        .get();

      if (driversSnapshot.empty) {
        warnings.push(`Uber: Motorista com UUID ${uberUuid} não encontrado`);
        continue;
      }

      const driverDoc = driversSnapshot.docs[0];
      const driver = driverDoc.data();

      // Extrair valores do Uber
      const earnings = parseFloat(row['Pago a si:Os seus rendimentos:Tarifa:Tarifa'] || '0');
      const tips = parseFloat(row['Pago a si:Os seus rendimentos:Tarifa:Gorjetas'] || '0');
      const tolls = parseFloat(row['Pago a si:Os seus rendimentos:Tarifa:Portagens'] || '0');

      // Buscar ou criar registro semanal
      await upsertWeeklyRecord(
        db,
        driverDoc.id,
        driver.name || driver.fullName || 'Unknown',
        importData.weekStart,
        importData.weekEnd,
        {
          uber: {
            earnings,
            tips,
            tolls,
            importId: importData.id,
          },
        },
        driver.banking?.iban || ''
      );

      processed++;
    } catch (error) {
      console.error('Error processing Uber row:', error);
      warnings.push(`Uber: Erro ao processar linha (${error})`);
    }
  }

  return processed;
}

/**
 * Processa importação do Bolt
 */
async function processBoltImport(
  importData: WeeklyDataImport,
  db: FirebaseFirestore.Firestore,
  warnings: string[]
): Promise<number> {
  const rows = importData.rawData.rows || [];
  let processed = 0;

  for (const row of rows) {
    try {
      const boltId = row['Driver ID'] || row['driver_id'];
      
      if (!boltId) {
        warnings.push('Bolt: Linha sem Driver ID (ignorada)');
        continue;
      }

      // Buscar motorista pelo ID do Bolt
      const driversSnapshot = await db.collection('drivers')
        .where('integrations.bolt.id', '==', boltId)
        .limit(1)
        .get();

      if (driversSnapshot.empty) {
        warnings.push(`Bolt: Motorista com ID ${boltId} não encontrado`);
        continue;
      }

      const driverDoc = driversSnapshot.docs[0];
      const driver = driverDoc.data();

      // Extrair valores do Bolt
      const earnings = parseFloat(row['Earnings'] || row['Total'] || '0');
      const tips = parseFloat(row['Tips'] || '0');
      const tolls = 0; // Bolt geralmente não tem portagens separadas

      // Buscar ou criar registro semanal
      await upsertWeeklyRecord(
        db,
        driverDoc.id,
        driver.name || driver.fullName || 'Unknown',
        importData.weekStart,
        importData.weekEnd,
        {
          bolt: {
            earnings,
            tips,
            tolls,
            importId: importData.id,
          },
        },
        driver.banking?.iban || ''
      );

      processed++;
    } catch (error) {
      console.error('Error processing Bolt row:', error);
      warnings.push(`Bolt: Erro ao processar linha (${error})`);
    }
  }

  return processed;
}

/**
 * Processa importação do myprio
 */
async function processMyprioImport(
  importData: WeeklyDataImport,
  db: FirebaseFirestore.Firestore,
  warnings: string[]
): Promise<number> {
  const rows = importData.rawData.rows || [];
  let processed = 0;

  for (const row of rows) {
    try {
      const cardNumber = row['Cartão'] || row['Card'];
      const amount = parseFloat(row['Valor'] || row['Amount'] || '0');
      
      if (!cardNumber) {
        warnings.push('myprio: Transação sem número de cartão (ignorada)');
        continue;
      }

      // Buscar motorista pelo cartão myprio
      const driversSnapshot = await db.collection('drivers')
        .where('cards.myprio', '==', cardNumber)
        .limit(1)
        .get();

      if (driversSnapshot.empty) {
        warnings.push(`myprio: Motorista com cartão ${cardNumber} não encontrado`);
        continue;
      }

      const driverDoc = driversSnapshot.docs[0];
      const driver = driverDoc.data();

      // Buscar registro existente para agregar transações
      const recordId = `${driverDoc.id}_${importData.weekStart}`;
      const existingRecordDoc = await db.collection('driverWeeklyRecords').doc(recordId).get();
      const existingRecord = existingRecordDoc.data() as ProcessedWeeklyRecord | undefined;

      const currentFuelAmount = existingRecord?.fuel?.amount || 0;
      const currentFuelTransactions = existingRecord?.fuel?.transactions || 0;

      // Buscar ou criar registro semanal
      await upsertWeeklyRecord(
        db,
        driverDoc.id,
        driver.name || driver.fullName || 'Unknown',
        importData.weekStart,
        importData.weekEnd,
        {
          fuel: {
            amount: currentFuelAmount + amount,
            transactions: currentFuelTransactions + 1,
            importId: importData.id,
          },
        },
        driver.banking?.iban || ''
      );

      processed++;
    } catch (error) {
      console.error('Error processing myprio row:', error);
      warnings.push(`myprio: Erro ao processar linha (${error})`);
    }
  }

  return processed;
}

/**
 * Processa importação do ViaVerde
 */
async function processViaverdeImport(
  importData: WeeklyDataImport,
  db: FirebaseFirestore.Firestore,
  warnings: string[]
): Promise<number> {
  const rows = importData.rawData.rows || [];
  let processed = 0;

  for (const row of rows) {
    try {
      const plate = row['Matrícula'] || row['Plate'];
      const amount = parseFloat(row['Valor'] || row['Amount'] || '0');
      
      if (!plate) {
        warnings.push('ViaVerde: Transação sem matrícula (ignorada)');
        continue;
      }

      // Buscar motorista pela matrícula do veículo
      const driversSnapshot = await db.collection('drivers')
        .where('vehicle.plate', '==', plate)
        .limit(1)
        .get();

      if (driversSnapshot.empty) {
        warnings.push(`ViaVerde: Motorista com matrícula ${plate} não encontrado`);
        continue;
      }

      const driverDoc = driversSnapshot.docs[0];
      const driver = driverDoc.data();

      // Buscar registro existente para agregar transações
      const recordId = `${driverDoc.id}_${importData.weekStart}`;
      const existingRecordDoc = await db.collection('driverWeeklyRecords').doc(recordId).get();
      const existingRecord = existingRecordDoc.data() as ProcessedWeeklyRecord | undefined;

      const currentViaverdeAmount = existingRecord?.viaverde?.amount || 0;
      const currentViaverdeTransactions = existingRecord?.viaverde?.transactions || 0;

      // Buscar ou criar registro semanal
      await upsertWeeklyRecord(
        db,
        driverDoc.id,
        driver.name || driver.fullName || 'Unknown',
        importData.weekStart,
        importData.weekEnd,
        {
          viaverde: {
            amount: currentViaverdeAmount + amount,
            transactions: currentViaverdeTransactions + 1,
            importId: importData.id,
          },
        },
        driver.banking?.iban || ''
      );

      processed++;
    } catch (error) {
      console.error('Error processing ViaVerde row:', error);
      warnings.push(`ViaVerde: Erro ao processar linha (${error})`);
    }
  }

  return processed;
}

/**
 * Busca ou cria um registro semanal e atualiza com novos dados
 */
async function upsertWeeklyRecord(
  db: FirebaseFirestore.Firestore,
  driverId: string,
  driverName: string,
  weekStart: string,
  weekEnd: string,
  updates: Partial<ProcessedWeeklyRecord>,
  iban: string
): Promise<void> {
  const recordId = `${driverId}_${weekStart}`;
  const recordRef = db.collection('driverWeeklyRecords').doc(recordId);

  const doc = await recordRef.get();

  if (doc.exists) {
    // Atualizar registro existente
    const existingRecord = doc.data() as ProcessedWeeklyRecord;

    // Merge dos dados
    const updatedRecord: ProcessedWeeklyRecord = {
      ...existingRecord,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Recalcular totais
    const recalculated = calculateWeeklyTotals(updatedRecord);

    await recordRef.update(recalculated);
  } else {
    // Criar novo registro
    const newRecord = createEmptyWeeklyRecord(
      driverId,
      driverName,
      weekStart,
      weekEnd,
      iban
    );

    // Aplicar updates
    const updatedRecord: ProcessedWeeklyRecord = {
      ...newRecord,
      ...updates,
    };

    // Recalcular totais
    const recalculated = calculateWeeklyTotals(updatedRecord);

    await recordRef.set(recalculated);
  }
}
