import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb as db } from '@/lib/firebaseAdmin';
import formidable from 'formidable';
import fs from 'fs';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { getWeekDates } from '@/lib/utils/date-helpers';
import { updateDataSource, createWeeklyDataSources, WeeklyDataSources } from '@/schemas/weekly-data-sources';
import { RawFileArchiveEntry } from '@/schemas/raw-file-archive';
import { createWeeklyNormalizedData, WeeklyNormalizedData } from '@/schemas/data-weekly';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export const config = {
  api: {
    bodyParser: false,
  },
};

type Platform = 'uber' | 'bolt' | 'myprio' | 'viaverde';

interface DriverInfo {
  id: string;
  name: string;
  type: 'affiliate' | 'renter';
  rentalFee: number;
  iban?: string | null;
  vehiclePlate?: string | null;
  uberKey?: string | null;
  boltKey?: string | null;
  myprioCard?: string | null;
  viaverdeKey?: string | null;
}

interface DriverMaps {
  byUber: Map<string, DriverInfo>;
  byBolt: Map<string, DriverInfo>;
  byMyPrio: Map<string, DriverInfo>;
  byPlate: Map<string, DriverInfo>;
  byViaVerde: Map<string, DriverInfo>;
}

interface AggregatedEntry {
  referenceId: string;
  referenceLabel?: string;
  totalValue: number;
  totalTrips: number;
  driver?: DriverInfo;
}

interface AggregationResult {
  entries: AggregatedEntry[];
  warnings: string[];
}

interface ProcessSummary {
  platform: Platform;
  rawDataDocId: string;
  normalizedEntries: WeeklyNormalizedData[];
  driverMatches: number;
  recordsCount: number;
  warnings: string[];
  error?: string;
}

interface ImportResultsSummary {
  success: string[];
  errors: Array<{ platform: Platform; error: string }>;
  warnings: string[];
}

const SUPPORTED_PLATFORMS: Platform[] = ['uber', 'bolt', 'myprio', 'viaverde'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    const adminIdField = Array.isArray(fields.adminId) ? fields.adminId[0] : fields.adminId;
    const adminId = typeof adminIdField === 'string' && adminIdField.trim().length > 0 ? adminIdField : 'system';

    const { start: weekStart, end: weekEnd } = getWeekDates(weekId);

    const weeklyDataSourceRef = db.collection('weeklyDataSources').doc(weekId);
    const weeklyDataSourceSnap = await weeklyDataSourceRef.get();

    let weeklyDataSources: WeeklyDataSources = weeklyDataSourceSnap.exists
      ? ({ id: weeklyDataSourceSnap.id, ...weeklyDataSourceSnap.data() } as WeeklyDataSources)
      : createWeeklyDataSources(weekId, weekStart, weekEnd);

    if (!weeklyDataSourceSnap.exists) {
      await weeklyDataSourceRef.set(weeklyDataSources);
    }

    const driversSnapshot = await db.collection('drivers').where('status', '==', 'active').get();
    const drivers = driversSnapshot.docs.map(buildDriverInfo);
    const driverMaps = buildDriverMaps(drivers);

    const filesByPlatform: Partial<Record<Platform, formidable.File>> = {};
    SUPPORTED_PLATFORMS.forEach((platform) => {
      const fileField = files[platform];
      if (Array.isArray(fileField)) {
        filesByPlatform[platform] = fileField[0];
      } else if (fileField) {
        filesByPlatform[platform] = fileField as formidable.File;
      }
    });

    const summaries: ProcessSummary[] = [];
    const resultsSummary: ImportResultsSummary = {
      success: [],
      errors: [],
      warnings: [],
    };

    for (const platform of SUPPORTED_PLATFORMS) {
      const file = filesByPlatform[platform];
      if (!file) {
        continue;
      }

      // Delete existing raw files for this platform/week before importing
      await deleteExistingRawFiles(weekId, platform);

      const summary = await processAndArchiveFile({
        platform,
        file,
        weekId,
        weekStart,
        weekEnd,
        adminId,
        driverMaps,
      });

      summaries.push(summary);

      if (summary.error) {
        resultsSummary.errors.push({ platform, error: summary.error });
      } else {
        resultsSummary.success.push(
          `${platform.toUpperCase()}: ${summary.recordsCount} registros processados (${summary.driverMatches} motoristas mapeados).`
        );
      }

      if (summary.warnings.length > 0) {
        resultsSummary.warnings.push(
          ...summary.warnings.map((warning) => `${platform.toUpperCase()}: ${warning}`)
        );
      }

      const updateData: any = {
        status: summary.error ? 'partial' : 'complete',
        origin: 'manual',
        recordsCount: summary.recordsCount,
        driversCount: summary.driverMatches,
      };

      // Only set these fields if they have values (avoid undefined in Firestore)
      if (summary.rawDataDocId) {
        updateData.archiveRef = summary.rawDataDocId;
      }
      if (summary.error) {
        updateData.lastError = summary.error;
      }

      weeklyDataSources = updateDataSource(weeklyDataSources, platform, updateData);
    }

    await weeklyDataSourceRef.set(weeklyDataSources, { merge: true });

    console.log('✅ Import completed successfully:', {
      weekId,
      platformsProcessed: summaries.length,
      totalRecords: summaries.reduce((sum, s) => sum + s.recordsCount, 0),
      errors: resultsSummary.errors.length,
    });

    return res.status(200).json({
      success: resultsSummary.errors.length === 0,
      weekId,
      summaries: summaries.map((summary) => ({
        platform: summary.platform,
        recordsCount: summary.recordsCount,
        driverMatches: summary.driverMatches,
        warnings: summary.warnings,
        rawDataDocId: summary.rawDataDocId,
        error: summary.error,
      })),
      results: resultsSummary,
    });
  } catch (error: any) {
    console.error('❌ Fatal error in import handler:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

async function processAndArchiveFile({
  platform,
  file,
  weekId,
  weekStart,
  weekEnd,
  adminId,
  driverMaps,
}: {
  platform: Platform;
  file: formidable.File;
  weekId: string;
  weekStart: string;
  weekEnd: string;
  adminId: string;
  driverMaps: DriverMaps;
}): Promise<ProcessSummary> {
  const importedAt = new Date().toISOString();
  const summary: ProcessSummary = {
    platform,
    rawDataDocId: '',
    normalizedEntries: [],
    driverMatches: 0,
    recordsCount: 0,
    warnings: [],
  };

  // Função para normalizar dados brutos antes de salvar no Firebase
  // Mantém apenas as colunas essenciais em formato consistente
  function normalizeRawDataForStorage(
    platform: Platform,
    data: { headers: string[]; rows: any[] }
  ): { headers: string[]; rows: any[] } {
    switch (platform) {
      case 'uber': {
        const essentialHeaders = ['UUID do motorista', 'Pago a si', 'Viagens', 'Nome do motorista'];
        const normalizedRows = data.rows.map((row) => {
          const uuid = extractFirstAvailable(row, ['UUID do motorista', 'UUID', 'Driver UUID']) || '';
          const pagoASi = extractFirstAvailable(row, ['Pago a si', 'Pago a si (€)', 'Paid to you', 'Net amount']) || '0';
          const viagens = extractFirstAvailable(row, ['Viagens', 'Trips', 'Viagens (total)']) || 0;
          const nome = extractFirstAvailable(row, [
            'Nome do motorista',
            'Driver name',
            'Motorista',
            'Nome próprio do motorista',
          ]) || '';
          const apelido = extractFirstAvailable(row, ['Apelido do motorista', 'Last name']) || '';
          const nomeCompleto = apelido ? `${nome} ${apelido}`.trim() : nome;

          return {
            'UUID do motorista': uuid,
            'Pago a si': pagoASi,
            'Viagens': viagens,
            'Nome do motorista': nomeCompleto,
          };
        });
        return { headers: essentialHeaders, rows: normalizedRows };
      }

      case 'bolt': {
        const essentialHeaders = ['Email', 'Ganhos brutos (total)|€', 'Viagens (total)', 'Motorista'];
        const normalizedRows = data.rows.map((row) => {
          const email = extractFirstAvailable(row, ['Email', 'Driver email', 'Email do motorista']) || '';
          const ganhos = extractFirstAvailable(row, [
            'Ganhos brutos (total)|€',
            'Ganhos brutos (total)',
            'Total Earnings',
          ]) || '0';
          const viagens = extractFirstAvailable(row, ['Viagens (total)', 'Viagens', 'Trips']) || 0;
          const motorista = extractFirstAvailable(row, ['Motorista', 'Driver', 'Nome do motorista']) || '';

          return {
            'Email': email,
            'Ganhos brutos (total)|€': ganhos,
            'Viagens (total)': viagens,
            'Motorista': motorista,
          };
        });
        return { headers: essentialHeaders, rows: normalizedRows };
      }

      case 'myprio': {
        const essentialHeaders = ['CARTAO', 'TOTAL'];
        const normalizedRows = data.rows.map((row) => {
          const cartao = extractFirstAvailable(row, ['CARTAO', 'CARTÃO', 'Card', 'Número do cartão']) || '';
          const total = extractFirstAvailable(row, ['TOTAL', 'Total', 'Valor', 'Amount']) || '0';

          return {
            'CARTAO': cartao,
            'TOTAL': total,
          };
        });
        return { headers: essentialHeaders, rows: normalizedRows };
      }

      case 'viaverde': {
        const essentialHeaders = ['OBU', 'Value'];
        const normalizedRows = data.rows.map((row) => {
          const obu = extractFirstAvailable(row, ['OBU', 'Dispositivo', 'Device']) || '';
          const value = extractFirstAvailable(row, ['Value', 'Valor', 'Amount', 'Total']) || '0';

          return {
            'OBU': obu,
            'Value': value,
          };
        });
        return { headers: essentialHeaders, rows: normalizedRows };
      }

      default:
        return data;
    }
  }

  try {
    const { headers, rows } = await readUploadedFile(file);

    console.log(`📊 ${platform.toUpperCase()}: Read ${rows.length} rows with ${headers.length} columns`);

    // Normalizar dados para formato consistente antes de salvar
    const normalizedData = normalizeRawDataForStorage(platform, { headers, rows });
    
    console.log(`✅ ${platform.toUpperCase()}: Normalized to ${normalizedData.rows.length} rows with ${normalizedData.headers.length} columns`);
    if (normalizedData.rows.length > 0) {
      console.log(`📋 First row sample:`, JSON.stringify(normalizedData.rows[0]));
    }

    const rawDataDocId = buildRawArchiveId(weekId, platform);
    summary.rawDataDocId = rawDataDocId;

    const rawFileEntry: RawFileArchiveEntry = {
      id: rawDataDocId,
      weekId,
      weekStart,
      weekEnd,
      platform,
      fileName: file.originalFilename || file.newFilename,
      rawData: normalizedData,
      importedAt,
      importedBy: adminId,
      processed: false,
    };
    
    console.log(`💾 Saving to rawFileArchive: ${rawDataDocId}`);

    await db.collection('rawFileArchive').doc(rawDataDocId).set(rawFileEntry);

    if (rows.length === 0) {
      console.warn(`⚠️  ${platform.toUpperCase()}: Arquivo vazio, nenhum dado para processar`);
      summary.warnings.push(`Arquivo ${platform.toUpperCase()} está vazio ou não possui dados válidos.`);
      // Mark as processed even if empty
      await db.collection('rawFileArchive').doc(rawDataDocId).update({
        processed: false, // Mudado para false - não processar arquivo vazio
        processedAt: new Date().toISOString(),
      });
      return summary;
    }

    // Não processar automaticamente - apenas contar registros para feedback
    summary.recordsCount = normalizedData.rows.length;
    console.log(`✅ ${platform.toUpperCase()}: Saved ${summary.recordsCount} rows to rawFileArchive (pending processing)`);

    // O processamento será feito quando o usuário clicar em "Processar"
    // await db.collection('rawFileArchive').doc(rawDataDocId).update({
    //   processed: false, // Aguardando processamento manual
    // });
  } catch (error: any) {
    summary.error = error.message || 'Erro desconhecido';
    console.error(`Erro ao processar arquivo da plataforma ${platform}:`, error);
  } finally {
    if (file && file.filepath && fs.existsSync(file.filepath)) {
      fs.unlinkSync(file.filepath);
    }
  }

  return summary;
}

async function readUploadedFile(file: formidable.File): Promise<{ headers: string[]; rows: any[] }> {
  const filePath = file.filepath;
  const mimetype = file.mimetype || '';
  const originalName = file.originalFilename?.toLowerCase() || '';

  console.log('📖 Reading file:', { originalName, mimetype, filePath });

  if (mimetype.includes('csv') || originalName.endsWith('.csv')) {
    let content = fs.readFileSync(filePath, 'utf8');
    console.log('📄 CSV file size:', content.length, 'bytes');
    
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }
    const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
    const headers = parsed.meta.fields || [];
    const rows = Array.isArray(parsed.data) ? (parsed.data as any[]) : [];
    
    console.log('✅ CSV parsed:', { headers: headers.length, rows: rows.length });
    return { headers, rows };
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
  
  // Find the first row with more than 1 non-empty column (that's the header)
  let headerRowIndex = -1;
  for (let i = 0; i < json.length; i++) {
    const row = json[i];
    const nonEmptyCells = row.filter((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== '');
    if (nonEmptyCells.length > 1) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    console.warn('⚠️  No valid header row found in XLSX file');
    return { headers: [], rows: [] };
  }

  const headers = (json[headerRowIndex] || []) as string[];
  const rows = json.slice(headerRowIndex + 1)
    .filter((row) => {
      // Skip completely empty rows
      const nonEmptyCells = row.filter((cell: any) => cell !== null && cell !== undefined && String(cell).trim() !== '');
      return nonEmptyCells.length > 0;
    })
    .map((row) => {
      const rowObject: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (header && String(header).trim() !== '') {
          rowObject[header] = row[index];
        }
      });
      return rowObject;
    });

  console.log('✅ XLSX parsed:', { sheetName, headerRowIndex, headers: headers.length, rows: rows.length });
  return { headers, rows };
}

function buildDriverInfo(doc: QueryDocumentSnapshot): DriverInfo {
  const data = doc.data() as any;
  return {
    id: doc.id,
    name: data.fullName || data.name || data.email || 'Motorista sem nome',
    type: data.type === 'affiliate' || data.type === 'renter' ? data.type : 'affiliate',
    rentalFee: typeof data.rentalFee === 'number' ? data.rentalFee : 0,
    iban: data.banking?.iban ?? null,
    vehiclePlate: data.vehicle?.plate ?? data.integrations?.viaverde?.key ?? null,
    uberKey: data.integrations?.uber?.key ?? null,
    boltKey: data.integrations?.bolt?.key ?? null,
    myprioCard: data.integrations?.myprio?.key ?? null,
    viaverdeKey: data.integrations?.viaverde?.key ?? null,
  };
}

function buildDriverMaps(drivers: DriverInfo[]): DriverMaps {
  const byUber = new Map<string, DriverInfo>();
  const byBolt = new Map<string, DriverInfo>();
  const byMyPrio = new Map<string, DriverInfo>();
  const byPlate = new Map<string, DriverInfo>();
  const byViaVerde = new Map<string, DriverInfo>();

  drivers.forEach((driver) => {
    if (driver.uberKey) {
      byUber.set(normalizeKey(driver.uberKey), driver);
    }
    if (driver.boltKey) {
      byBolt.set(normalizeKey(driver.boltKey), driver);
    }
    if (driver.myprioCard) {
      byMyPrio.set(normalizeKey(driver.myprioCard), driver);
    }
    if (driver.vehiclePlate) {
      byPlate.set(normalizePlate(driver.vehiclePlate), driver);
    }
    if (driver.viaverdeKey) {
      byViaVerde.set(normalizeKey(driver.viaverdeKey), driver);
    }
  });

  return { byUber, byBolt, byMyPrio, byPlate, byViaVerde };
}

function aggregatePlatformData(
  platform: Platform,
  rows: any[],
  driverMaps: DriverMaps
): AggregationResult {
  switch (platform) {
    case 'uber':
      return aggregateUber(rows, driverMaps);
    case 'bolt':
      return aggregateBolt(rows, driverMaps);
    case 'myprio':
      return aggregateMyPrio(rows, driverMaps);
    case 'viaverde':
      return aggregateViaVerde(rows, driverMaps);
    default:
      return { entries: [], warnings: [] };
  }
}

function aggregateUber(rows: any[], driverMaps: DriverMaps): AggregationResult {
  const aggregates = new Map<string, AggregatedEntry>();
  const warnings = new Set<string>();

  rows.forEach((row, index) => {
    const driverUuidRaw = extractFirstAvailable(row, [
      'UUID do motorista',
      'UUID',
      'Driver UUID',
      'driver_uuid',
      'UUID Motorista',
    ]);
    const normalizedUuid = normalizeKey(driverUuidRaw);
    if (!normalizedUuid) {
      warnings.add(`Linha ${index + 2}: motorista sem UUID identificado.`);
      return;
    }

    const amountRaw = extractFirstAvailable(row, [
      'Pago a si',
      'Pago a si (€)',
      'Paid to you',
      'Net amount',
      'Net earnings',
    ]);
    const tripsRaw = extractFirstAvailable(row, ['Viagens', 'Trips', 'Viagens (total)']);
    const driverNameRaw = extractFirstAvailable(row, [
      'Nome do motorista',
      'Driver name',
      'Motorista',
    ]);

    const key = normalizedUuid;
    const entry = aggregates.get(key) ?? {
      referenceId: typeof driverUuidRaw === 'string' ? driverUuidRaw.trim() : key,
      referenceLabel: typeof driverNameRaw === 'string' ? driverNameRaw.trim() : undefined,
      totalValue: 0,
      totalTrips: 0,
      driver: driverMaps.byUber.get(key),
    };

    entry.totalValue += parseNumber(amountRaw);
    entry.totalTrips += parseInteger(tripsRaw);
    if (!entry.driver) {
      entry.driver = driverMaps.byUber.get(key);
    }

    aggregates.set(key, entry);
  });

  const entries = Array.from(aggregates.values());
  entries.forEach((entry) => {
    if (!entry.driver) {
      warnings.add(`Motorista Uber não mapeado (${entry.referenceId}).`);
    }
  });

  return { entries, warnings: Array.from(warnings) };
}

function aggregateBolt(rows: any[], driverMaps: DriverMaps): AggregationResult {
  const aggregates = new Map<string, AggregatedEntry>();
  const warnings = new Set<string>();

  rows.forEach((row, index) => {
    const emailRaw = extractFirstAvailable(row, ['Email', 'Driver email', 'Email do motorista']);
    const normalizedEmail = normalizeKey(emailRaw);
    if (!normalizedEmail) {
      warnings.add(`Linha ${index + 2}: motorista Bolt sem e-mail.`);
      return;
    }

    const amountRaw = extractFirstAvailable(row, [
      'Ganhos brutos (total)|€',
      'Ganhos brutos (total)',
      'Total Earnings',
      'Ganhos brutos (€)',
    ]);
    const tripsRaw = extractFirstAvailable(row, ['Viagens (total)', 'Viagens', 'Trips']);
    const driverNameRaw = extractFirstAvailable(row, ['Motorista', 'Driver', 'Nome do motorista']);

    const key = normalizedEmail;
    const entry = aggregates.get(key) ?? {
      referenceId: typeof emailRaw === 'string' ? emailRaw.trim() : key,
      referenceLabel: typeof driverNameRaw === 'string' ? driverNameRaw.trim() : undefined,
      totalValue: 0,
      totalTrips: 0,
      driver: driverMaps.byBolt.get(key),
    };

    entry.totalValue += parseNumber(amountRaw);
    entry.totalTrips += parseInteger(tripsRaw);
    if (!entry.driver) {
      entry.driver = driverMaps.byBolt.get(key);
    }

    aggregates.set(key, entry);
  });

  const entries = Array.from(aggregates.values());
  entries.forEach((entry) => {
    if (!entry.driver) {
      warnings.add(`Motorista Bolt não mapeado (${entry.referenceId}).`);
    }
  });

  return { entries, warnings: Array.from(warnings) };
}

function aggregateMyPrio(rows: any[], driverMaps: DriverMaps): AggregationResult {
  const aggregates = new Map<string, AggregatedEntry>();
  const warnings = new Set<string>();

  rows.forEach((row, index) => {
    const cardRaw = extractFirstAvailable(row, ['CARTAO', 'CARTÃO', 'Cartão', 'Card', 'CARD']);
    const plateRaw = extractFirstAvailable(row, [
      'DESC CARTAO',
      'Matrícula',
      'MATRICULA',
      'Matricula',
      'License plate',
      'Licence plate',
      'Placa',
      'PLACA',
    ]);

    const normalizedCard = normalizeKey(cardRaw);
    const normalizedPlate = normalizePlate(plateRaw);

    const identifier = normalizedCard || normalizedPlate;
    if (!identifier) {
      warnings.add(`Linha ${index + 2}: lançamento PRIO sem cartão ou matrícula.`);
      return;
    }

    const amountRaw = extractFirstAvailable(row, ['TOTAL', 'Total', 'Valor', 'Valor Total', 'TOTAL (EUR)']);

    const key = identifier;
    const entry = aggregates.get(key) ?? {
      referenceId:
        typeof (cardRaw || plateRaw) === 'string'
          ? String(cardRaw || plateRaw).trim()
          : key,
      referenceLabel: typeof plateRaw === 'string' ? plateRaw.trim() : undefined,
      totalValue: 0,
      totalTrips: 0,
      driver:
        (normalizedCard && driverMaps.byMyPrio.get(normalizedCard)) ||
        (normalizedPlate && driverMaps.byPlate.get(normalizedPlate)),
    };

    entry.totalValue += parseNumber(amountRaw);
    if (!entry.driver && normalizedCard) {
      entry.driver = driverMaps.byMyPrio.get(normalizedCard);
    }
    if (!entry.driver && normalizedPlate) {
      entry.driver = driverMaps.byPlate.get(normalizedPlate);
    }

    aggregates.set(key, entry);
  });

  const entries = Array.from(aggregates.values());
  entries.forEach((entry) => {
    if (!entry.driver) {
      warnings.add(`Despesa PRIO não mapeada (${entry.referenceId}).`);
    }
  });

  return { entries, warnings: Array.from(warnings) };
}

function aggregateViaVerde(rows: any[], driverMaps: DriverMaps): AggregationResult {
  const aggregates = new Map<string, AggregatedEntry>();
  const warnings = new Set<string>();

  rows.forEach((row, index) => {
    const plateRaw = extractFirstAvailable(row, [
      'Matrícula',
      'MATRICULA',
      'Matricula',
      'Matricula ',
      'License Plate',
      'Licence Plate',
      'PLACA',
      'Placa',
    ]);
    const tagRaw = extractFirstAvailable(row, ['OBU', 'Tag', 'Transponder']);

    const normalizedPlate = normalizePlate(plateRaw);
    const normalizedTag = normalizeKey(tagRaw);

    const identifier = normalizedPlate || normalizedTag;
    if (!identifier) {
      warnings.add(`Linha ${index + 2}: lançamento ViaVerde sem matrícula ou TAG.`);
      return;
    }

    const amountRaw = extractFirstAvailable(row, ['Value', 'Valor', 'TOTAL', 'Total']);

    const key = identifier;
    const entry = aggregates.get(key) ?? {
      referenceId:
        typeof (plateRaw || tagRaw) === 'string'
          ? String(plateRaw || tagRaw).trim()
          : key,
      referenceLabel: typeof plateRaw === 'string' ? plateRaw.trim() : undefined,
      totalValue: 0,
      totalTrips: 0,
      driver:
        (normalizedPlate && driverMaps.byPlate.get(normalizedPlate)) ||
        (normalizedTag && driverMaps.byViaVerde.get(normalizedTag)),
    };

    entry.totalValue += parseNumber(amountRaw);
    if (!entry.driver && normalizedPlate) {
      entry.driver = driverMaps.byPlate.get(normalizedPlate);
    }
    if (!entry.driver && normalizedTag) {
      entry.driver = driverMaps.byViaVerde.get(normalizedTag);
    }

    aggregates.set(key, entry);
  });

  const entries = Array.from(aggregates.values());
  entries.forEach((entry) => {
    if (!entry.driver) {
      warnings.add(`Portagem ViaVerde não mapeada (${entry.referenceId}).`);
    }
  });

  return { entries, warnings: Array.from(warnings) };
}

async function deleteExistingDataWeekly(weekId: string, platform: Platform) {
  const snapshot = await db
    .collection('dataWeekly')
    .where('weekId', '==', weekId)
    .where('platform', '==', platform)
    .get();

  if (snapshot.empty) {
    return;
  }

  const docs = snapshot.docs;
  const chunkSize = 400;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const batch = db.batch();
    docs.slice(i, i + chunkSize).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function deleteExistingRawFiles(weekId: string, platform: Platform) {
  const snapshot = await db
    .collection('rawFileArchive')
    .where('weekId', '==', weekId)
    .where('platform', '==', platform)
    .get();

  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  
  console.log(`🗑️  Deleted ${snapshot.docs.length} existing raw file(s) for ${platform} week ${weekId}`);
}

async function saveNormalizedEntries(entries: WeeklyNormalizedData[]) {
  if (entries.length === 0) {
    return;
  }

  const chunkSize = 400;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    const batch = db.batch();
    chunk.forEach((entry) => {
      const docRef = db.collection('dataWeekly').doc(entry.id);
      batch.set(docRef, entry, { merge: true });
    });
    await batch.commit();
  }
}

function buildDataWeeklyId(weekId: string, platform: Platform, referenceId: string): string {
  const sanitized = referenceId
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const safeRef = sanitized.length > 0 ? sanitized : `ref-${Date.now()}`;
  return `${weekId}_${platform}_${safeRef}`;
}

function buildRawArchiveId(weekId: string, platform: Platform): string {
  return `${weekId}-${platform}-${Date.now()}`;
}

function parseNumber(value: any): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (value === null || value === undefined) {
    return 0;
  }
  const str = String(value).trim();
  if (str.length === 0) {
    return 0;
  }
  let normalized = str.replace(/\s/g, '').replace(/[€$]/g, '');
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = normalized.replace(/,/g, '');
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseInteger(value: any): number {
  return Math.round(parseNumber(value));
}

function normalizeKey(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toLowerCase();
}

function normalizePlate(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function extractFirstAvailable(row: any, keys: string[]): any {
  if (!row) return undefined;
  for (const key of keys) {
    if (key in row && row[key] !== undefined && row[key] !== null && String(row[key]).toString().trim() !== '') {
      return row[key];
    }
  }
  return undefined;
}
