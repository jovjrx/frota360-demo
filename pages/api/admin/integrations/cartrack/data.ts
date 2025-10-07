
import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getSession } from '@/lib/session';

// Interfaces (copiadas de monitor.tsx para consistência)
interface CartracTrip {
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

interface CartrackData {
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
  trips: CartracTrip[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    data?: CartrackData;
    error?: string;
  }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const session = await getSession(req, res);

    if (!session?.isLoggedIn || session.role !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = getFirestore();
    const auth = getAuth();

    // TODO: Implementar a lógica real para buscar dados do Cartrack
    // Isso pode envolver:
    // 1. Chamar uma API externa do Cartrack (com credenciais)
    // 2. Buscar dados de uma collection 'raw_cartrack' no Firebase (se os dados forem importados)
    // Por enquanto, vamos simular alguns dados.

    const simulatedTrips: CartracTrip[] = [
      {
        trip_id: 1,
        vehicle_id: 101,
        registration: 'AA-00-BB',
        driver_name: 'João',
        driver_surname: 'Silva',
        start_timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
        end_timestamp: new Date().toISOString(),
        trip_duration: '1h 0m',
        trip_duration_seconds: 3600,
        start_location: 'Rua A, Lisboa',
        end_location: 'Rua B, Porto',
        trip_distance: 300000,
        max_speed: 120,
        harsh_braking_events: 2,
        harsh_cornering_events: 1,
        harsh_acceleration_events: 0,
        road_speeding_events: 3,
        start_coordinates: { latitude: 38.7223, longitude: -9.1393 },
        end_coordinates: { latitude: 41.1579, longitude: -8.6291 },
      },
      {
        trip_id: 2,
        vehicle_id: 102,
        registration: 'CC-11-DD',
        driver_name: 'Maria',
        driver_surname: 'Sousa',
        start_timestamp: new Date(Date.now() - 7200 * 1000).toISOString(),
        end_timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
        trip_duration: '1h 0m',
        trip_duration_seconds: 3600,
        start_location: 'Rua C, Faro',
        end_location: 'Rua D, Albufeira',
        trip_distance: 50000,
        max_speed: 90,
        harsh_braking_events: 0,
        harsh_cornering_events: 0,
        harsh_acceleration_events: 0,
        road_speeding_events: 0,
        start_coordinates: { latitude: 37.0194, longitude: -7.9322 },
        end_coordinates: { latitude: 37.0883, longitude: -8.2467 },
      },
    ];

    const cartrackData: CartrackData = {
      platform: 'Cartrack',
      lastUpdate: new Date().toISOString(),
      count: simulatedTrips.length,
      summary: {
        totalTrips: simulatedTrips.length,
        totalVehicles: new Set(simulatedTrips.map(t => t.vehicle_id)).size,
        totalDistance: simulatedTrips.reduce((sum, t) => sum + t.trip_distance, 0),
        period: {
          start: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      },
      trips: simulatedTrips,
    };

    return res.status(200).json({ data: cartrackData });
  } catch (error) {
    console.error('Error fetching Cartrack data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

