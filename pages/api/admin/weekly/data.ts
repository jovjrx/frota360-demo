import { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';
import { createDriverWeeklyRecord, DriverWeeklyRecord } from '@/schemas/driver-weekly-record';
import { WeeklyNormalizedData } from '@/schemas/data-weekly';
import { getWeekDates, generateWeeklyRecordId } from '@/lib/utils/date-helpers';

type Platform = 'uber' | 'bolt' | 'myprio' | 'viaverde';

interface DriverInfo {
  id: string;
  name: string;
  type: 'affiliate' | 'renter';
  rentalFee: number;
  iban?: string | null;
  email?: string | null;
  vehiclePlate?: string | null;
  integrations?: {
    uber?: string | null;
    bolt?: string | null;
    myprio?: string | null;
    viaverde?: string | null;
  };
}

interface DriverMaps {
  byId: Map<string, DriverInfo>;
  byUber: Map<string, DriverInfo>;
  byBolt: Map<string, DriverInfo>;
  byMyPrio: Map<string, DriverInfo>;
  byPlate: Map<string, DriverInfo>;
  byViaVerde: Map<string, DriverInfo>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { weekId } = req.query;

  if (!weekId || typeof weekId !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid weekId' });
  }

  try {
    const { start: weekStart, end: weekEnd } = getWeekDates(weekId);

    const normalizedSnapshot = await adminDb
      .collection('dataWeekly')
      .where('weekId', '==', weekId)
      .get();

    const normalizedData: WeeklyNormalizedData[] = normalizedSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as WeeklyNormalizedData),
    }));

    const driversSnapshot = await adminDb.collection('drivers').get();
    const drivers = driversSnapshot.docs.map((doc) => buildDriverInfo(doc.id, doc.data() as any));
    const driverMaps = buildDriverMaps(drivers);

    const aggregation = aggregateWeeklyRecords(normalizedData, driverMaps, weekId, weekStart, weekEnd);

    return res.status(200).json(aggregation);
  } catch (error: any) {
    console.error('Error fetching weekly data:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}

function buildDriverInfo(id: string, data: any): DriverInfo {
  return {
    id,
    name: data.fullName || data.name || data.email || 'Motorista sem nome',
    type: data.type === 'renter' ? 'renter' : 'affiliate',
    rentalFee: typeof data.rentalFee === 'number' ? data.rentalFee : 0,
    iban: data.banking?.iban ?? null,
    email: data.email ?? null,
    vehiclePlate: data.vehicle?.plate ?? data.integrations?.viaverde?.key ?? null,
    integrations: {
      uber: data.integrations?.uber?.key ?? null,
      bolt: data.integrations?.bolt?.key ?? null,
      myprio: data.integrations?.myprio?.key ?? null,
      viaverde: data.integrations?.viaverde?.key ?? null,
    },
  };
}

function buildDriverMaps(drivers: DriverInfo[]): DriverMaps {
  const byId = new Map<string, DriverInfo>();
  const byUber = new Map<string, DriverInfo>();
  const byBolt = new Map<string, DriverInfo>();
  const byMyPrio = new Map<string, DriverInfo>();
  const byPlate = new Map<string, DriverInfo>();
  const byViaVerde = new Map<string, DriverInfo>();

  drivers.forEach((driver) => {
    byId.set(driver.id, driver);
    if (driver.integrations?.uber) {
      byUber.set(normalizeKey(driver.integrations.uber), driver);
    }
    if (driver.integrations?.bolt) {
      byBolt.set(normalizeKey(driver.integrations.bolt), driver);
    }
    if (driver.integrations?.myprio) {
      byMyPrio.set(normalizeKey(driver.integrations.myprio), driver);
    }
    if (driver.vehiclePlate) {
      byPlate.set(normalizePlate(driver.vehiclePlate), driver);
    }
    if (driver.integrations?.viaverde) {
      byViaVerde.set(normalizeKey(driver.integrations.viaverde), driver);
    }
  });

  return { byId, byUber, byBolt, byMyPrio, byPlate, byViaVerde };
}

function aggregateWeeklyRecords(
  normalizedData: WeeklyNormalizedData[],
  driverMaps: DriverMaps,
  weekId: string,
  weekStart: string,
  weekEnd: string
) {
  const totals = new Map<string, {
    driver: DriverInfo;
    uber: number;
    bolt: number;
    combustivel: number;
    viaverde: number;
    references: WeeklyNormalizedData[];
  }>();
  const unassigned: WeeklyNormalizedData[] = [];

  normalizedData.forEach((entry) => {
    const driver = resolveDriver(entry, driverMaps);

    if (!driver) {
      unassigned.push(entry);
      return;
    }

    const existing = totals.get(driver.id) ?? {
      driver,
      uber: 0,
      bolt: 0,
      combustivel: 0,
      viaverde: 0,
      references: [],
    };

    switch (entry.platform as Platform) {
      case 'uber':
        existing.uber += entry.totalValue || 0;
        break;
      case 'bolt':
        existing.bolt += entry.totalValue || 0;
        break;
      case 'myprio':
        existing.combustivel += entry.totalValue || 0;
        break;
      case 'viaverde':
        existing.viaverde += entry.totalValue || 0;
        break;
      default:
        break;
    }

    existing.references.push(entry);
    totals.set(driver.id, existing);
  });

  const records = Array.from(totals.values()).map(({ driver, uber, bolt, combustivel, viaverde, references }) => {
    const record = createDriverWeeklyRecord(
      {
        id: generateWeeklyRecordId(driver.id, weekId),
        driverId: driver.id,
        driverName: driver.name,
        driverEmail: driver.email ?? '',
        weekId,
        weekStart,
        weekEnd,
        combustivel,
        viaverde,
        isLocatario: driver.type === 'renter',
        aluguel: driver.type === 'renter' ? driver.rentalFee : 0,
        iban: driver.iban ?? undefined,
      },
      { uber, bolt },
      { type: driver.type, rentalFee: driver.rentalFee }
    );

    return {
      ...record,
      driverType: driver.type,
      vehicle: driver.vehiclePlate ?? '',
      platformData: references,
    } as DriverWeeklyRecord & {
      driverType: 'affiliate' | 'renter';
      vehicle: string;
      platformData: WeeklyNormalizedData[];
    };
  });

  return {
    weekId,
    weekStart,
    weekEnd,
    records,
    unassigned,
  };
}

function resolveDriver(entry: WeeklyNormalizedData, driverMaps: DriverMaps): DriverInfo | undefined {
  if (entry.driverId) {
    const driver = driverMaps.byId.get(entry.driverId);
    if (driver) {
      return driver;
    }
  }

  switch (entry.platform as Platform) {
    case 'uber':
      return driverMaps.byUber.get(normalizeKey(entry.referenceId)) ?? undefined;
    case 'bolt':
      return driverMaps.byBolt.get(normalizeKey(entry.referenceId)) ?? undefined;
    case 'myprio': {
      const cardMatch = driverMaps.byMyPrio.get(normalizeKey(entry.referenceId));
      if (cardMatch) return cardMatch;
      return driverMaps.byPlate.get(normalizePlate(entry.referenceLabel || entry.referenceId));
    }
    case 'viaverde': {
      const plateMatch = driverMaps.byPlate.get(normalizePlate(entry.referenceLabel || entry.referenceId));
      if (plateMatch) return plateMatch;
      return driverMaps.byViaVerde.get(normalizeKey(entry.referenceId));
    }
    default:
      return undefined;
  }
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

