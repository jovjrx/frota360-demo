import type { NextApiResponse } from 'next';
import formidable from 'formidable';
import * as fs from 'fs';
import * as path from 'path';
import { adminDb } from '@/lib/firebaseAdmin';
import { withIronSessionApiRoute, sessionOptions, SessionRequest } from '@/lib/session/ironSession';
import { RawFileArchiveEntry } from '@/schemas/raw-file-archive';
import { getWeekId } from '@/lib/utils/date-helpers';
import * as XLSX from 'xlsx';
import { parse as parseCsv } from 'csv-parse/sync';
import { DataSourceStatus, WeeklyDataSources, createWeeklyDataSources, updateDataSource } from '@/schemas/weekly-data-sources';
import { createWeeklyNormalizedData, WeeklyNormalizedData } from '@/schemas/data-weekly';
import { updatePlatformImported } from '@/schemas/weekly';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Desabilitar o body parser padrão do Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};

// Normaliza dados brutos para um formato consistente por plataforma (mesma lógica do endpoint legacy /weekly/import)
function normalizeRawDataForStorage(
  platform: string,
  data: { headers: string[]; rows: any[] }
): { headers: string[]; rows: any[] } {
  switch (platform) {
    case 'uber': {
      const essentialHeaders = ['UUID do motorista', 'Pago a si', 'Viagens', 'Nome do motorista'];
      const normalizedRows = data.rows.map((row) => {
        const uuid = extractFirstAvailable(row, ['UUID do motorista', 'UUID', 'Driver UUID', 'driver_uuid', 'UUID Motorista']) || '';
        const pagoASi = extractFirstAvailable(row, ['Pago a si', 'Pago a si (€)', 'Paid to you', 'Net amount', 'Net earnings']) || '0';
        const viagens = extractFirstAvailable(row, ['Viagens', 'Trips', 'Viagens (total)']) || 0;
        const nome = extractFirstAvailable(row, ['Nome do motorista', 'Driver name', 'Motorista', 'Nome próprio do motorista']) || '';
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
        const ganhos = extractFirstAvailable(row, ['Ganhos brutos (total)|€', 'Ganhos brutos (total)', 'Total Earnings', 'Ganhos brutos (€)']) || '0';
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
      // Minimal required fields for processing: CARTAO and TOTAL (numeric)
      const essentialHeaders = ['CARTAO', 'TOTAL'];
      const normalizedRows = data.rows.map((row) => {
        const cartao = extractFirstAvailable(row, ['CARTAO', 'CARTÃO', 'Cartão', 'Card', 'CARD']) || '';
        const valorBruto = extractFirstAvailable(row, [
          'VALOR LÍQUIDO', 'VALOR LIQUIDO', 'Valor líquido', 'Valor Liquido', 'Líquido', 'Liquido',
          'TOTAL', 'Total', 'Valor', 'Valor Total', 'TOTAL (EUR)'
        ]) || '0';
        const totalNumber = parseNumber(valorBruto);
        return { 'CARTAO': cartao, 'TOTAL': totalNumber };
      });
      return { headers: essentialHeaders, rows: normalizedRows };
    }

    case 'viaverde': {
      // Minimal fields required now: plate from License* and Value as number
      const essentialHeaders = ['Matrícula', 'Value'];
      const normalizedRows = data.rows.map((row) => {
        const license = extractFirstAvailable(row, [
          'License Pl', 'License PI', 'License Plate', 'Licence Plate', 'License', 'License  ', 'License P', 'License PL',
          'Matrícula', 'MATRICULA', 'Matricula', 'PLACA', 'Placa'
        ]) || '';
        const valueRaw = extractFirstAvailable(row, ['Value', 'Liquid Val', 'Liquid Value', 'Valor', 'Amount', 'Total', 'TOTAL']) || '0';
        const valueNum = parseNumber(valueRaw);
        return {
          'Matrícula': license,
          'Value': valueNum,
        };
      });
      return { headers: essentialHeaders, rows: normalizedRows };
    }

    default:
      return data;
  }
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

// ===== Helpers para auto-processamento (espelhando lógica do weekly/import.ts) =====
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
    if (driver.uberKey) byUber.set(normalizeKey(driver.uberKey), driver);
    if (driver.boltKey) byBolt.set(normalizeKey(driver.boltKey), driver);
    if (driver.myprioCard) byMyPrio.set(normalizeKey(driver.myprioCard), driver);
    if (driver.vehiclePlate) byPlate.set(normalizePlate(driver.vehiclePlate), driver);
    if (driver.viaverdeKey) byViaVerde.set(normalizeKey(driver.viaverdeKey), driver);
  });

  return { byUber, byBolt, byMyPrio, byPlate, byViaVerde };
}

function aggregatePlatformData(platform: Platform, rows: any[], driverMaps: DriverMaps): AggregationResult {
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
    const driverUuidRaw = extractFirstAvailable(row, ['UUID do motorista','UUID','Driver UUID','driver_uuid','UUID Motorista']);
    const normalizedUuid = normalizeKey(driverUuidRaw);
    if (!normalizedUuid) {
      warnings.add(`Linha ${index + 2}: motorista sem UUID identificado.`);
      return;
    }

    const amountRaw = extractFirstAvailable(row, ['Pago a si','Pago a si (€)','Paid to you','Net amount','Net earnings']);
    const tripsRaw = extractFirstAvailable(row, ['Viagens','Trips','Viagens (total)']);
    const driverNameRaw = extractFirstAvailable(row, ['Nome do motorista','Driver name','Motorista']);

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
    if (!entry.driver) entry.driver = driverMaps.byUber.get(key);
    aggregates.set(key, entry);
  });

  const entries = Array.from(aggregates.values());
  entries.forEach((entry) => { if (!entry.driver) warnings.add(`Motorista Uber não mapeado (${entry.referenceId}).`); });
  return { entries, warnings: Array.from(warnings) };
}

function aggregateBolt(rows: any[], driverMaps: DriverMaps): AggregationResult {
  const aggregates = new Map<string, AggregatedEntry>();
  const warnings = new Set<string>();

  rows.forEach((row, index) => {
    const emailRaw = extractFirstAvailable(row, ['Email','Driver email','Email do motorista']);
    const normalizedEmail = normalizeKey(emailRaw);
    if (!normalizedEmail) {
      warnings.add(`Linha ${index + 2}: motorista Bolt sem e-mail.`);
      return;
    }
    const amountRaw = extractFirstAvailable(row, ['Ganhos brutos (total)|€','Ganhos brutos (total)','Total Earnings','Ganhos brutos (€)']);
    const tripsRaw = extractFirstAvailable(row, ['Viagens (total)','Viagens','Trips']);
    const driverNameRaw = extractFirstAvailable(row, ['Motorista','Driver','Nome do motorista']);

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
    if (!entry.driver) entry.driver = driverMaps.byBolt.get(key);
    aggregates.set(key, entry);
  });

  const entries = Array.from(aggregates.values());
  entries.forEach((entry) => { if (!entry.driver) warnings.add(`Motorista Bolt não mapeado (${entry.referenceId}).`); });
  return { entries, warnings: Array.from(warnings) };
}

function aggregateMyPrio(rows: any[], driverMaps: DriverMaps): AggregationResult {
  const aggregates = new Map<string, AggregatedEntry>();
  const warnings = new Set<string>();

  rows.forEach((row, index) => {
    const cardRaw = extractFirstAvailable(row, ['CARTAO','CARTÃO','Cartão','Card','CARD']);
    const plateRaw = extractFirstAvailable(row, [
      'DESC_CARTAO','DESC_CARTÃO','DESC. CARTAO','DESC. CARTÃO',
      'DESC CARTAO','Matrícula','MATRICULA','Matricula','License plate','Licence plate','Placa','PLACA'
    ]);
    const normalizedCard = normalizeKey(cardRaw);
    const normalizedPlate = normalizePlate(plateRaw);
    // Prefer link by plate (DESC CARTAO / Matrícula). Fallback to card number if plate is missing.
    const identifier = normalizedPlate || normalizedCard;
    if (!identifier) { warnings.add(`Linha ${index + 2}: lançamento PRIO sem cartão ou matrícula.`); return; }
    const amountRaw = extractFirstAvailable(row, [
      'VALOR LÍQUIDO','VALOR LIQUIDO','Valor líquido','Valor Liquido','Líquido','Liquido',
      'TOTAL','Total','Valor','Valor Total','TOTAL (EUR)'
    ]);

    const key = identifier;
    const entry = aggregates.get(key) ?? {
      referenceId: typeof (plateRaw || cardRaw) === 'string' ? String(plateRaw || cardRaw).trim() : key,
      referenceLabel: typeof cardRaw === 'string' ? String(cardRaw).trim() : undefined,
      totalValue: 0,
      totalTrips: 0,
      driver: (normalizedPlate && driverMaps.byPlate.get(normalizedPlate)) || (normalizedCard && driverMaps.byMyPrio.get(normalizedCard)),
    };
    entry.totalValue += parseNumber(amountRaw);
    if (!entry.driver && normalizedPlate) entry.driver = driverMaps.byPlate.get(normalizedPlate);
    if (!entry.driver && normalizedCard) entry.driver = driverMaps.byMyPrio.get(normalizedCard);
    aggregates.set(key, entry);
  });

  const entries = Array.from(aggregates.values());
  entries.forEach((entry) => { if (!entry.driver) warnings.add(`Despesa PRIO não mapeada (${entry.referenceId}).`); });
  return { entries, warnings: Array.from(warnings) };
}

function aggregateViaVerde(rows: any[], driverMaps: DriverMaps): AggregationResult {
  const aggregates = new Map<string, AggregatedEntry>();
  const warnings = new Set<string>();

  rows.forEach((row, index) => {
    const plateRaw = extractFirstAvailable(row, [
      'Matrícula','MATRICULA','Matricula','Matricula ',
      'License Pl','License PI','License Plate','Licence Plate','License','License P','License PL',
      'PLACA','Placa']
    );
    const tagRaw = extractFirstAvailable(row, ['OBU','Tag','Transponder']);
    const normalizedPlate = normalizePlate(plateRaw);
    const normalizedTag = normalizeKey(tagRaw);
    const identifier = normalizedPlate || normalizedTag;
    if (!identifier) { warnings.add(`Linha ${index + 2}: lançamento ViaVerde sem matrícula ou TAG.`); return; }
    const amountRaw = extractFirstAvailable(row, ['Value','Liquid Val','Liquid Value','Valor','TOTAL','Total']);

    const key = identifier;
    const entry = aggregates.get(key) ?? {
      referenceId: typeof (plateRaw || tagRaw) === 'string' ? String(plateRaw || tagRaw).trim() : key,
      referenceLabel: typeof plateRaw === 'string' ? plateRaw.trim() : undefined,
      totalValue: 0,
      totalTrips: 0,
      driver: (normalizedPlate && driverMaps.byPlate.get(normalizedPlate)) || (normalizedTag && driverMaps.byViaVerde.get(normalizedTag)),
    };
    entry.totalValue += parseNumber(amountRaw);
    if (!entry.driver && normalizedPlate) entry.driver = driverMaps.byPlate.get(normalizedPlate);
    if (!entry.driver && normalizedTag) entry.driver = driverMaps.byViaVerde.get(normalizedTag);
    aggregates.set(key, entry);
  });

  const entries = Array.from(aggregates.values());
  entries.forEach((entry) => { if (!entry.driver) warnings.add(`Portagem ViaVerde não mapeada (${entry.referenceId}).`); });
  return { entries, warnings: Array.from(warnings) };
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (value === null || value === undefined) return 0;
  const str = String(value).trim();
  if (str.length === 0) return 0;
  let normalized = str.replace(/\s/g, '').replace(/[€$]/g, '');
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  } else {
    normalized = normalized.replace(/,/g, '');
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
function parseInteger(value: any): number { return Math.round(parseNumber(value)); }
function normalizeKey(value: any): string { return value == null ? '' : String(value).trim().toLowerCase(); }
function normalizePlate(value: any): string { return value == null ? '' : String(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); }

async function deleteExistingDataWeekly(weekId: string, platform: Platform) {
  const snapshot = await adminDb
    .collection('dataWeekly')
    .where('weekId', '==', weekId)
    .where('platform', '==', platform)
    .get();
  if (snapshot.empty) return;
  const docs = snapshot.docs;
  const chunkSize = 400;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const batch = adminDb.batch();
    docs.slice(i, i + chunkSize).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function saveDataWeeklyEntries(entries: WeeklyNormalizedData[]) {
  if (entries.length === 0) return;
  const chunkSize = 400;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const batch = adminDb.batch();
    entries.slice(i, i + chunkSize).forEach((entry) => {
      const docRef = adminDb.collection('dataWeekly').doc(entry.id);
      batch.set(docRef, entry, { merge: true });
    });
    await batch.commit();
  }
}

function buildDataWeeklyId(weekId: string, platform: Platform, referenceId: string): string {
  const sanitized = referenceId.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const safeRef = sanitized.length > 0 ? sanitized : `ref-${Date.now()}`;
  return `${weekId}_${platform}_${safeRef}`;
}

export default withIronSessionApiRoute(async function handler(req: SessionRequest, res: NextApiResponse) {
  const user = req.session.user;
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const uploadDir = path.join(process.cwd(), 'tmp');
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (e) {
    console.error('Failed to ensure upload tmp directory:', e);
  }

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ message: 'Error uploading file' });
    }

  const { platform, weekStart, weekEnd, weekId: weekIdField } = fields;
    const fileField: any = (files as any).file;
    const uploadedFile = Array.isArray(fileField) ? fileField[0] : fileField;

    if (!platform || !weekStart || !weekEnd || !uploadedFile) {
      return res.status(400).json({ message: 'Missing fields or file' });
    }

    const platformStr = Array.isArray(platform) ? platform[0] : platform;
  const platformKey = String(platformStr).toLowerCase() as Platform;
    const weekStartStr = Array.isArray(weekStart) ? weekStart[0] : weekStart;
    const weekEndStr = Array.isArray(weekEnd) ? weekEnd[0] : weekEnd;
    const providedWeekId = Array.isArray(weekIdField) ? weekIdField[0] : weekIdField;
    // Prefer the weekId explicitly provided by the UI; fallback to computing from weekStart
    let weekId = String(providedWeekId || '').trim();
    if (!weekId) {
      weekId = getWeekId(new Date(weekStartStr));
    }
    const importId = `${weekId}-${new Date().getTime()}`;

    const filePath = uploadedFile.filepath;
    const safeUnlink = (p: string | undefined) => {
      try {
        if (p && fs.existsSync(p)) fs.unlinkSync(p);
      } catch (e) {
        console.warn('Warning: failed to unlink temp file:', (e as any)?.message);
      }
    };
  let headers: string[] = [];
  let rawDataRows: any[] = [];

    try {
      // Suporte a CSV e planilhas Excel; alguns navegadores no Windows usam mimetypes variados
      const mime = String(uploadedFile.mimetype || '').toLowerCase();
      if (mime.includes('csv') || uploadedFile.originalFilename?.toLowerCase().endsWith('.csv')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.slice(1);
        }
        const delimiter = detectCsvDelimiter(content);
        const records = parseCsv(content, { columns: true, skip_empty_lines: true, delimiter });
        headers = Object.keys(records[0] || {});
        rawDataRows = records;
      } else if (mime.includes('spreadsheetml') || uploadedFile.originalFilename?.toLowerCase().endsWith('.xlsx') || uploadedFile.originalFilename?.toLowerCase().endsWith('.xls')) {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

        // Detect header row for MyPrio or ViaVerde sheets that include logo/intro rows
        let headerRowIndex = 0;
        if (platformKey === 'myprio' || platformKey === 'viaverde') {
          const normalize = (v: any) => String(v ?? '').trim().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
          const looksLikeHeader = (row: any[]): boolean => {
            const cells = (row || []).map(normalize).filter(Boolean);
            if (cells.length === 0) return false;
            if (platformKey === 'myprio') {
              const hasCartao = cells.some(c => c.startsWith('cartao'));
              const hasAnyTotal = cells.some(c => c.includes('total') || c.includes('valor liquido') || c.includes('valor'));
              return hasCartao && hasAnyTotal;
            } else {
              const hasLicense = cells.some(c => c.startsWith('license') || c.includes('matricula'));
              const hasValue = cells.some(c => c === 'value' || c.includes('liquid val'));
              return hasLicense && hasValue;
            }
          };
          for (let i = 0; i < Math.min(matrix.length, 50); i++) {
            if (looksLikeHeader(matrix[i])) { headerRowIndex = i; break; }
          }
        }

        const headerRow = (matrix[headerRowIndex] || []) as string[];
        headers = headerRow.map((h) => (h == null ? '' : String(h)));
        rawDataRows = matrix.slice(headerRowIndex + 1).map((row) => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });
      } else {
        safeUnlink(filePath); // Remover arquivo temporário
        return res.status(400).json({ message: 'Unsupported file type' });
      }

      // Normalizar dados como no fluxo legado para aceitar variações de cabeçalhos
      const normalized = normalizeRawDataForStorage(platformKey, { headers, rows: rawDataRows });
      const normalizedRows = Array.isArray(normalized.rows) ? normalized.rows : [];
      if (normalizedRows.length === 0) {
        safeUnlink(filePath);
        return res.status(400).json({ message: `Nenhuma linha reconhecida para ${platformStr}. Verifique o arquivo exportado.` });
      }

      // Log sample for debugging
      try {
        if (normalizedRows.length > 0) {
          console.log(`[UPLOAD:${platformStr}] rows=${normalizedRows.length} headers=${normalized.headers.length} sample=`, JSON.stringify(normalizedRows[0]));
        } else {
          console.log(`[UPLOAD:${platformStr}] rows=0`);
        }
      } catch {}

  // Salvar dados brutos na coleção rawFileArchive
      const rawDataDocId = `${weekId}-${platformKey}-${Date.now()}`;
      const rawDataRef = adminDb.collection("rawFileArchive").doc(rawDataDocId);
      const rawFileEntry: RawFileArchiveEntry = {
        id: rawDataDocId,
        weekId: weekId,
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        platform: platformKey,
        fileName: uploadedFile.originalFilename || uploadedFile.newFilename,
        rawData: { headers: normalized.headers, rows: normalizedRows },
        importedAt: new Date().toISOString(),
        importedBy: user.id,
        processed: false,
      };
      await rawDataRef.set(rawFileEntry);

      // Auto-processar: gerar agregados e gravar em dataWeekly imediatamente
  // Mapear todos os motoristas; alguns casos tinham status diferente de 'active' e ficavam sem vínculo
  const driversSnapshot = await adminDb.collection('drivers').get();
      const drivers = driversSnapshot.docs.map(buildDriverInfo);
      const driverMaps = buildDriverMaps(drivers);

  const aggregation = aggregatePlatformData(platformKey, normalizedRows, driverMaps);
      const now = new Date().toISOString();

      // 🔥 IMPORTANTE: Filtrar APENAS os que foram mapeados (têm driver)
      // Descartar registros onde driver é null para evitar dataWeekly sem driverId
      const dataWeeklyEntries: WeeklyNormalizedData[] = aggregation.entries
        .filter((aggregated) => {
          // Aceitar APENAS se tem driver mapeado
          if (!aggregated.driver) {
            console.warn(`[UPLOAD] Descartando registro não mapeado: ${platformKey} / ${aggregated.referenceId} / ${aggregated.referenceLabel}`);
            return false;
          }
          return true;
        })
        .map((aggregated) =>
          createWeeklyNormalizedData({
            id: buildDataWeeklyId(weekId, platformKey, aggregated.referenceId),
            weekId,
            weekStart: weekStartStr,
            weekEnd: weekEndStr,
            platform: platformKey,
            referenceId: aggregated.referenceId,
            referenceLabel: aggregated.referenceLabel,
            driverId: aggregated.driver!.id, // Garantido ter driver agora
            driverName: aggregated.driver!.name,
            vehiclePlate: aggregated.driver!.vehiclePlate ?? null,
            totalValue: Number(aggregated.totalValue.toFixed(2)),
            totalTrips: aggregated.totalTrips,
            rawDataRef: rawDataDocId,
            updatedAt: now,
          })
        );

      await deleteExistingDataWeekly(weekId, platformKey);
      await saveDataWeeklyEntries(dataWeeklyEntries);

      // Sanity check: verify we actually wrote entries for this week/platform
      let wroteCount = 0;
      try {
        const verifySnap = await adminDb
          .collection('dataWeekly')
          .where('weekId', '==', weekId)
          .where('platform', '==', platformKey)
          .limit(1)
          .get();
        wroteCount = verifySnap.size;
      } catch (e) {
        console.warn('[UPLOAD] verify dataWeekly write failed:', (e as any)?.message);
      }

      // Fallback: if none returned (rare), write individually
      if (wroteCount === 0 && dataWeeklyEntries.length > 0) {
        console.warn('[UPLOAD] Batch write returned 0 on verify. Falling back to individual writes...');
        for (const entry of dataWeeklyEntries) {
          try {
            await adminDb.collection('dataWeekly').doc(entry.id).set(entry, { merge: true });
          } catch (e) {
            console.error('[UPLOAD] Individual write failed for', entry.id, (e as any)?.message);
          }
        }
      }

      // Atualizar weeklyDataSources
      const weeklyDataSourcesRef = adminDb.collection('weeklyDataSources').doc(weekId);
      const weeklyDataSourcesSnap = await weeklyDataSourcesRef.get();
      let weeklyDataSources: WeeklyDataSources = weeklyDataSourcesSnap.exists
        ? ({ id: weeklyDataSourcesSnap.id, ...(weeklyDataSourcesSnap.data() as WeeklyDataSources) })
        : createWeeklyDataSources(weekId, weekStartStr, weekEndStr);
      const hasUnmapped = (aggregation.warnings?.length || 0) > 0 || aggregation.entries.some(e => !e.driver);
      const updatePayload: Partial<DataSourceStatus> = {
        status: hasUnmapped ? 'partial' : 'complete',
        origin: 'manual',
        recordsCount: dataWeeklyEntries.length,
        driversCount: dataWeeklyEntries.reduce((acc, e) => (e.driverId ? acc + 1 : acc), 0),
        archiveRef: rawDataDocId,
        ...(hasUnmapped && aggregation.warnings?.length ? { lastError: aggregation.warnings.slice(0, 5).join('\n') } : {}),
      };
  weeklyDataSources = updateDataSource(weeklyDataSources, platformKey, updatePayload);
      await weeklyDataSourcesRef.set(weeklyDataSources, { merge: true });

      // Atualizar maestro weekly
      if (dataWeeklyEntries.length > 0) {
        const weeklyRef = adminDb.collection('weekly').doc(weekId);
        const weeklyDoc = await weeklyRef.get();
        if (weeklyDoc.exists) {
          const updated = updatePlatformImported(weeklyDoc.data() as any, platformKey, dataWeeklyEntries.length);
          await weeklyRef.update(updated);
        }
      }

      // Marcar raw como processado
      await rawDataRef.update({ processed: true, processedAt: now });

      safeUnlink(filePath); // Remover arquivo temporário após processamento

  const createdIdsPreview = dataWeeklyEntries.slice(0, 3).map(e => e.id);
  return res.status(200).json({ message: 'File uploaded and processed successfully', rawDataDocId, platform: platformKey, processed: true, dataWeekly: dataWeeklyEntries.length, createdIdsPreview, warnings: aggregation.warnings });

    } catch (parseError: any) {
      console.error('Error parsing file:', parseError);
      safeUnlink(filePath); // Remover arquivo temporário
      return res.status(500).json({ message: 'Error processing file', error: parseError.message });
    }
  });
}, sessionOptions);

// Tries to detect CSV delimiter by scanning initial lines for common separators
function detectCsvDelimiter(content: string): string | string[] {
  const sample = content.split(/\r?\n/).slice(0, 5).join('\n');
  const counts = [',', ';', '\t', '|'].map((c) => ({ c, n: (sample.match(new RegExp(`\${c}`, 'g')) || []).length }));
  counts.sort((a, b) => b.n - a.n);
  const best = counts[0];
  return best.n > 0 ? best.c : [',', ';']; // fallback: try comma or semicolon
}

