import type { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getSession } from '@/lib/session';

// Interfaces
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

interface CartrackAPITrip {
  trip_id: number;
  vehicle_id: number;
  registration: string;
  driver_id?: number;
  driver_name?: string;
  driver_surname?: string;
  start_time: string;
  end_time: string;
  duration?: number;
  start_address?: string;
  end_address?: string;
  distance?: number;
  max_speed?: number;
  harsh_braking?: number;
  harsh_cornering?: number;
  harsh_acceleration?: number;
  speeding?: number;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
}

async function fetchCartrackTrips(
  baseUrl: string,
  username: string,
  apiKey: string,
  startDate: string,
  endDate: string
): Promise<CartracTrip[]> {
  try {
    // Endpoint da API Cartrack para buscar viagens
    const url = `${baseUrl}/trips`;
    
    const auth = Buffer.from(`${username}:${apiKey}`).toString('base64');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
      }),
    });

    if (!response.ok) {
      console.error('Cartrack API error:', response.status, response.statusText);
      throw new Error(`Cartrack API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Transformar dados da API Cartrack para o formato esperado
    const trips: CartracTrip[] = (data.trips || data.data || []).map((trip: CartrackAPITrip) => {
      const duration = trip.duration || 0;
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      
      return {
        trip_id: trip.trip_id,
        vehicle_id: trip.vehicle_id,
        registration: trip.registration || 'N/A',
        driver_name: trip.driver_name || 'Desconhecido',
        driver_surname: trip.driver_surname || '',
        start_timestamp: trip.start_time,
        end_timestamp: trip.end_time,
        trip_duration: `${hours}h ${minutes}m`,
        trip_duration_seconds: duration,
        start_location: trip.start_address || 'Localização desconhecida',
        end_location: trip.end_address || 'Localização desconhecida',
        trip_distance: trip.distance || 0,
        max_speed: trip.max_speed || 0,
        harsh_braking_events: trip.harsh_braking || 0,
        harsh_cornering_events: trip.harsh_cornering || 0,
        harsh_acceleration_events: trip.harsh_acceleration || 0,
        road_speeding_events: trip.speeding || 0,
        start_coordinates: {
          latitude: trip.start_lat || 38.7223,
          longitude: trip.start_lng || -9.1393,
        },
        end_coordinates: {
          latitude: trip.end_lat || 38.7223,
          longitude: trip.end_lng || -9.1393,
        },
      };
    });

    return trips;
  } catch (error) {
    console.error('Error fetching Cartrack trips:', error);
    throw error;
  }
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

    // Buscar credenciais da integração Cartrack
    const integrationDoc = await db.collection('integrations').doc('cartrack').get();

    if (!integrationDoc.exists) {
      return res.status(404).json({ error: 'Cartrack integration not configured' });
    }

    const integration = integrationDoc.data();

    if (!integration?.enabled) {
      return res.status(400).json({ error: 'Cartrack integration is disabled' });
    }

    const { username, apiKey } = integration.credentials || {};
    const { baseUrl } = integration.config || {};

    if (!username || !apiKey || !baseUrl) {
      return res.status(400).json({ error: 'Cartrack credentials not configured' });
    }

    // Buscar viagens dos últimos 7 dias
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const formatDate = (date: Date) => {
      return date.toISOString().replace('T', ' ').substring(0, 19);
    };

    let trips: CartracTrip[] = [];

    try {
      trips = await fetchCartrackTrips(
        baseUrl,
        username,
        apiKey,
        formatDate(startDate),
        formatDate(endDate)
      );

      // Atualizar lastSync na integração
      await db.collection('integrations').doc('cartrack').update({
        lastSync: new Date().toISOString(),
        status: 'connected',
        errorMessage: null,
      });
    } catch (apiError) {
      console.error('Error calling Cartrack API:', apiError);
      
      // Atualizar status de erro
      await db.collection('integrations').doc('cartrack').update({
        status: 'error',
        errorMessage: apiError instanceof Error ? apiError.message : 'Unknown error',
      });

      // Retornar dados vazios em vez de erro para não quebrar a interface
      trips = [];
    }

    const cartrackData: CartrackData = {
      platform: 'Cartrack',
      lastUpdate: new Date().toISOString(),
      count: trips.length,
      summary: {
        totalTrips: trips.length,
        totalVehicles: new Set(trips.map(t => t.vehicle_id)).size,
        totalDistance: trips.reduce((sum, t) => sum + t.trip_distance, 0),
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
      trips,
    };

    return res.status(200).json({ data: cartrackData });
  } catch (error) {
    console.error('Error in Cartrack data handler:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
