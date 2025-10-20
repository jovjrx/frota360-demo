import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { DataSourceStatus, WeeklyDataSources, createWeeklyDataSources, updateDataSource } from '@/schemas/weekly-data-sources';
import { RawFileArchiveEntry } from '@/schemas/raw-file-archive';
import { createWeeklyDriverPlatformData, WeeklyDriverPlatformData } from '@/schemas/weekly-driver-platform-data';
import { createWeeklyNormalizedData, WeeklyNormalizedData } from '@/schemas/data-weekly';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

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

interface PlatformProcessingStats {
  records: number;
  driverMatches: number;
  warnings: Set<string>;
}

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

    const driversSnapshot = await adminDb.collection('drivers').where('status', '==', 'active').get();
    const drivers = driversSnapshot.docs.map(buildDriverInfo);
    const driverMaps = buildDriverMaps(drivers);

    console.log(`Semana: ${weekId} (${weekStart} a ${weekEnd})`);

    const dataWeeklyEntries: WeeklyNormalizedData[] = [];
    const platformsProcessed = new Set<Platform>();
    const platformStats: Partial<Record<Platform, PlatformProcessingStats>> = {};
    const platformArchiveRefs: Partial<Record<Platform, Set<string>>> = {};
    const platformAggregates: { [driver_platform_week_key: string]: WeeklyDriverPlatformData } = {};

    for (const entry of rawFileEntries) {
      const platform = entry.platform as Platform;
      platformsProcessed.add(platform);

      console.log(`Processando plataforma: ${entry.platform} do arquivo ${entry.fileName}`);
      const rawDataRows = entry.rawData?.rows;

      if (!rawDataRows) {
        console.warn(`Nenhum dado bruto encontrado para a entrada ${entry.id}. Pulando.`);
        continue;
      }

      if (!platformArchiveRefs[platform]) {
        platformArchiveRefs[platform] = new Set<string>();
      }
      if (entry.id) {
        platformArchiveRefs[platform]!.add(entry.id);
      }

      const aggregation = aggregatePlatformData(platform, rawDataRows, driverMaps);

      const platformStat = platformStats[platform] ?? {
        records: 0,
        driverMatches: 0,
        warnings: new Set<string>(),
      };
      const warningsBefore = new Set(platformStat.warnings);
      platformStat.records += aggregation.entries.length;
      platformStat.driverMatches += aggregation.entries.reduce(
        (total, aggregated) => (aggregated.driver ? total + 1 : total),
        0,
      );
      aggregation.warnings.forEach((warning) => platformStat.warnings.add(warning));
      platformStats[platform] = platformStat;

      aggregation.warnings
        .filter((warning) => !warningsBefore.has(warning))
        .forEach((warning) => console.warn(`⚠️  ${platform.toUpperCase()}: ${warning}`));

      aggregation.entries.forEach((aggregated) => {
        const driverKey = aggregated.driver?.id ?? aggregated.referenceId;
        const aggregateId = `${platform}-${driverKey}`;

        const aggregateDocId = `${driverKey}_${weekId}_${platform}`;

        if (!platformAggregates[aggregateId]) {
          const aggregateData = createWeeklyDriverPlatformData({
            driverId: driverKey,
            weekId,
            platform,
            rawDataRef: entry.id,
          });
          aggregateData.id = aggregateDocId;
          platformAggregates[aggregateId] = aggregateData;
        }

        const aggregateData = platformAggregates[aggregateId];
        const now = new Date().toISOString();
        aggregateData.totalValue = Number((aggregateData.totalValue + aggregated.totalValue).toFixed(2));
        aggregateData.totalTrips += aggregated.totalTrips;
        if (entry.id) {
          aggregateData.rawDataRef = mergeRawDataRefs(aggregateData.rawDataRef, entry.id);
        }
        aggregateData.updatedAt = now;

        const dataWeeklyEntry = createWeeklyNormalizedData({
          id: buildDataWeeklyId(weekId, platform, aggregated.referenceId),
          weekId,
          weekStart,
          weekEnd,
          platform,
          referenceId: aggregated.referenceId,
          referenceLabel: aggregated.referenceLabel,
          driverId: aggregated.driver?.id ?? null,
          driverName: aggregated.driver?.name ?? null,
          vehiclePlate: aggregated.driver?.vehiclePlate ?? null,
          totalValue: Number(aggregated.totalValue.toFixed(2)),
          totalTrips: aggregated.totalTrips,
          rawDataRef: entry.id,
        });

        dataWeeklyEntries.push(dataWeeklyEntry);
      });
    }

    const consolidatedDataWeeklyEntries = consolidateDataWeeklyEntries(dataWeeklyEntries);

    for (const platform of platformsProcessed) {
      await deleteExistingDataWeekly(weekId, platform);
    }

    // Salvar os agregados por plataforma na coleção 'weeklyDriverPlatformData'
    const batch = adminDb.batch();
    for (const key in platformAggregates) {
      const aggregate = platformAggregates[key];
      const aggregateId = aggregate.id ?? `${aggregate.driverId}_${aggregate.weekId}_${aggregate.platform}`;
      const docRef = adminDb.collection('weeklyDriverPlatformData').doc(aggregateId);
      batch.set(docRef, { ...aggregate, id: aggregateId }, { merge: true });
    }

    // Atualizar o status das fontes de dados na coleção 'weeklyDataSources'
    const weeklyDataSourcesRef = adminDb.collection('weeklyDataSources').doc(weekId);
    const weeklyDataSourcesDoc = await weeklyDataSourcesRef.get();
    let currentWeeklyDataSources: WeeklyDataSources;

    if (!weeklyDataSourcesDoc.exists) {
      currentWeeklyDataSources = createWeeklyDataSources(weekId, weekStart, weekEnd);
    } else {
      currentWeeklyDataSources = {
        id: weeklyDataSourcesDoc.id,
        ...(weeklyDataSourcesDoc.data() as WeeklyDataSources),
      };
    }

    Object.entries(platformStats).forEach(([platformKey, stats]) => {
      if (!stats) {
        return;
      }
      const platform = platformKey as Platform;
      const archiveRefs = Array.from(platformArchiveRefs[platform] ?? new Set<string>());
      const archiveRef = archiveRefs.length > 0 ? archiveRefs.join(',') : undefined;

      const updatePayload: Partial<DataSourceStatus> = {
        status: 'complete',
        origin: 'manual',
        recordsCount: stats.records,
        driversCount: stats.driverMatches,
      };

      if (archiveRef) {
        updatePayload.archiveRef = archiveRef;
      }

      currentWeeklyDataSources = updateDataSource(currentWeeklyDataSources, platform, updatePayload);
    });

    batch.set(weeklyDataSourcesRef, currentWeeklyDataSources, { merge: true });

    // Marcar entradas de rawFileArchive como processadas
    for (const entry of rawFileEntries) {
      batch.update(adminDb.collection('rawFileArchive').doc(entry.id!), { processed: true, processedAt: new Date().toISOString() });
    }

    await batch.commit();

    await saveDataWeeklyEntries(consolidatedDataWeeklyEntries);

    const warnings = Object.entries(platformStats)
      .filter(([, stats]) => stats && stats.warnings.size > 0)
      .flatMap(([platformKey, stats]) => {
        if (!stats) {
          return [];
        }
        const platformLabel = platformKey.toUpperCase();
        return Array.from(stats.warnings).map((warning) => `${platformLabel}: ${warning}`);
      });

    const responseSummary = {
      weekId,
      platformsProcessed: Array.from(platformsProcessed),
      dataWeeklyDocs: consolidatedDataWeeklyEntries.length,
      warnings,
    };

    console.log('🎉 Processamento de dados brutos para agregados de plataforma concluído com sucesso!', responseSummary);
    return res.status(200).json({
      message: 'Raw data processed to platform aggregates successfully',
      ...responseSummary,
    });
  } catch (error: any) {
    console.error('❌ Erro no processamento da importação:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message, stack: error.stack });
  }
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

function consolidateDataWeeklyEntries(entries: WeeklyNormalizedData[]): WeeklyNormalizedData[] {
  if (entries.length === 0) {
    return [];
  }

  const merged = new Map<string, WeeklyNormalizedData>();

  entries.forEach((entry) => {
    const existing = merged.get(entry.id);
    if (!existing) {
      merged.set(entry.id, entry);
      return;
    }

    const now = new Date().toISOString();
    const totalValue = Number((existing.totalValue + entry.totalValue).toFixed(2));
    const totalTrips = existing.totalTrips + entry.totalTrips;
    const mergedEntry: WeeklyNormalizedData = {
      ...existing,
      totalValue,
      totalTrips,
      updatedAt: now,
    };

    if (!mergedEntry.driverId && entry.driverId) {
      mergedEntry.driverId = entry.driverId;
    }
    if (!mergedEntry.driverName && entry.driverName) {
      mergedEntry.driverName = entry.driverName;
    }
    if (!mergedEntry.vehiclePlate && entry.vehiclePlate) {
      mergedEntry.vehiclePlate = entry.vehiclePlate;
    }
    if (!mergedEntry.referenceLabel && entry.referenceLabel) {
      mergedEntry.referenceLabel = entry.referenceLabel;
    }

    const mergedRawDataRef = mergeRawDataRefs(existing.rawDataRef, entry.rawDataRef);
    if (mergedRawDataRef) {
      mergedEntry.rawDataRef = mergedRawDataRef;
    } else {
      delete (mergedEntry as any).rawDataRef;
    }

    merged.set(entry.id, mergedEntry);
  });

  return Array.from(merged.values());
}

function mergeRawDataRefs(existing?: string, next?: string): string | undefined {
  const refs = new Set<string>();
  [existing, next].forEach((value) => {
    if (!value) {
      return;
    }
    value
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .forEach((part) => refs.add(part));
  });

  return refs.size > 0 ? Array.from(refs).join(',') : undefined;
}

async function deleteExistingDataWeekly(weekId: string, platform: Platform) {
  const snapshot = await adminDb
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
    const batch = adminDb.batch();
    docs.slice(i, i + chunkSize).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }
}

async function saveDataWeeklyEntries(entries: WeeklyNormalizedData[]) {
  if (entries.length === 0) {
    console.log('ℹ️ Nenhum registro dataWeekly para salvar.');
    return;
  }

  const chunkSize = 400;
  for (let i = 0; i < entries.length; i += chunkSize) {
    const batch = adminDb.batch();
    entries.slice(i, i + chunkSize).forEach((entry) => {
      const docRef = adminDb.collection('dataWeekly').doc(entry.id);
      batch.set(docRef, entry, { merge: true });
    });
    await batch.commit();
  }

  console.log(`✅ ${entries.length} registro(s) salvos/atualizados em dataWeekly.`);
}

