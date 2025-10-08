import integrationService from '@/lib/integrations/integration-service';
import { CartrackClient } from '@/lib/integrations/cartrack/client';

const DEFAULT_LATITUDE = 38.7223;
const DEFAULT_LONGITUDE = -9.1393;
const DEFAULT_START_DAYS = 7;

export interface CartrackMonitorTrip {
  trip_id: number;
  vehicle_id: number;
  registration: string;
  driver_name: string;
  driver_surname: string;
  start_timestamp: string;
  end_timestamp: string;
  trip_duration: string;
  trip_duration_seconds: number;
  start_location: string;
  end_location: string;
  trip_distance: number;
  max_speed: number;
  harsh_braking_events: number;
  harsh_cornering_events: number;
  harsh_acceleration_events: number;
  road_speeding_events: number;
  start_coordinates: {
    latitude: number;
    longitude: number;
  };
  end_coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface CartrackMonitorData {
  platform: string;
  lastUpdate: string;
  count: number;
  summary: {
    totalTrips: number;
    totalVehicles: number;
    totalDistance: number;
    period: {
      start: string;
      end: string;
    };
  };
  trips: CartrackMonitorTrip[];
}

interface FetchOptions {
  start?: Date | string;
  end?: Date | string;
}

const toNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0h 0m';
  }
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const toIsoDate = (value: Date | string | undefined): string => {
  if (!value) {
    return new Date().toISOString();
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
};

const toCartrackDate = (value: Date): string => {
  const year = value.getUTCFullYear();
  const month = `${value.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${value.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeTimestamp = (value?: string | null): string => {
  if (!value) {
    return new Date().toISOString();
  }

  if (/\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  if (/\d{4}-\d{2}-\d{2} /.test(value)) {
    const normalized = value.replace(' ', 'T');
    const date = new Date(`${normalized}Z`);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const toMeters = (trip: any): number => {
  const direct = toNumber(trip?.trip_distance);
  if (direct !== undefined) {
    return direct;
  }

  const distance = toNumber(trip?.distance);
  if (distance !== undefined) {
    return distance > 0 && distance < 1000 ? distance * 1000 : distance;
  }

  const distanceKm = toNumber(trip?.distance_km ?? trip?.distanceKm);
  if (distanceKm !== undefined) {
    return distanceKm * 1000;
  }

  return 0;
};

const pickCoordinate = (value: unknown, fallback: number): number => {
  const num = toNumber(value);
  return num !== undefined ? num : fallback;
};

const mapTrip = (trip: any, index: number): CartrackMonitorTrip => {
  const durationSeconds = toNumber(trip?.trip_duration_seconds ?? trip?.duration ?? trip?.duration_seconds) ?? 0;

  const startCoords = trip?.start_coordinates ?? trip?.startCoordinates ?? {};
  const endCoords = trip?.end_coordinates ?? trip?.endCoordinates ?? {};

  const startLatitude = pickCoordinate(startCoords.latitude ?? startCoords.lat ?? trip?.start_lat, DEFAULT_LATITUDE);
  const startLongitude = pickCoordinate(startCoords.longitude ?? startCoords.lng ?? trip?.start_lng, DEFAULT_LONGITUDE);
  const endLatitude = pickCoordinate(endCoords.latitude ?? endCoords.lat ?? trip?.end_lat, DEFAULT_LATITUDE);
  const endLongitude = pickCoordinate(endCoords.longitude ?? endCoords.lng ?? trip?.end_lng, DEFAULT_LONGITUDE);

  const harshBraking = toNumber(trip?.harsh_braking_events ?? trip?.harsh_braking) ?? 0;
  const harshCornering = toNumber(trip?.harsh_cornering_events ?? trip?.harsh_cornering) ?? 0;
  const harshAcceleration = toNumber(trip?.harsh_acceleration_events ?? trip?.harsh_acceleration) ?? 0;
  const speeding = toNumber(trip?.road_speeding_events ?? trip?.speeding ?? trip?.speeding_events) ?? 0;

  const driverName = (trip?.driver_name ?? trip?.driver?.name ?? 'Desconhecido').toString();
  const driverSurname = (trip?.driver_surname ?? trip?.driver?.surname ?? '').toString();

  return {
    trip_id: toNumber(trip?.trip_id ?? trip?.id) ?? index,
    vehicle_id: toNumber(trip?.vehicle_id) ?? 0,
    registration: (trip?.registration ?? trip?.vehicle_registration ?? 'N/A').toString(),
    driver_name: driverName,
    driver_surname: driverSurname,
    start_timestamp: normalizeTimestamp(trip?.start_timestamp ?? trip?.start_time ?? trip?.start),
    end_timestamp: normalizeTimestamp(trip?.end_timestamp ?? trip?.end_time ?? trip?.end),
    trip_duration: formatDuration(durationSeconds),
    trip_duration_seconds: durationSeconds,
    start_location: (trip?.start_location ?? trip?.start_address ?? 'Localização desconhecida').toString(),
    end_location: (trip?.end_location ?? trip?.end_address ?? 'Localização desconhecida').toString(),
    trip_distance: toMeters(trip),
    max_speed: toNumber(trip?.max_speed ?? trip?.max_speed_kph ?? trip?.speed_max) ?? 0,
    harsh_braking_events: harshBraking,
    harsh_cornering_events: harshCornering,
    harsh_acceleration_events: harshAcceleration,
    road_speeding_events: speeding,
    start_coordinates: {
      latitude: startLatitude,
      longitude: startLongitude,
    },
    end_coordinates: {
      latitude: endLatitude,
      longitude: endLongitude,
    },
  };
};

export async function fetchCartrackMonitorData(options: FetchOptions = {}): Promise<CartrackMonitorData> {
  const integration = await integrationService.getIntegration('cartrack');

  if (!integration) {
    throw new Error('Cartrack integration not configured');
  }

  if (!integration.enabled) {
    throw new Error('Cartrack integration disabled');
  }

  const username = integration.credentials?.username;
  const apiKey = integration.credentials?.apiKey;
  const baseUrl = integration.config?.baseUrl;

  if (!username || !apiKey) {
    throw new Error('Cartrack credentials are incomplete');
  }

  const client = new CartrackClient({
    username,
    apiKey,
    baseUrl,
  });

  const endDate = options.end ? new Date(options.end) : new Date();
  const startDate = options.start ? new Date(options.start) : new Date(endDate.getTime() - DEFAULT_START_DAYS * 24 * 60 * 60 * 1000);

  const startDateStr = toCartrackDate(startDate);
  const endDateStr = toCartrackDate(endDate);

  const rawTrips = await client.getTrips(startDateStr, endDateStr);

  const trips = rawTrips
    .map((trip, index) => mapTrip(trip, index))
    .sort((a, b) => new Date(b.start_timestamp).getTime() - new Date(a.start_timestamp).getTime());

  const totalDistance = trips.reduce((sum, trip) => sum + trip.trip_distance, 0);
  const totalVehicles = new Set(trips.map((trip) => trip.vehicle_id)).size;

  return {
    platform: client.getPlatformName(),
    lastUpdate: new Date().toISOString(),
    count: trips.length,
    summary: {
      totalTrips: trips.length,
      totalVehicles,
      totalDistance,
      period: {
        start: toIsoDate(startDate),
        end: toIsoDate(endDate),
      },
    },
    trips,
  };
}
