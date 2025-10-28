import { UberOAuthClient } from './oauth';
import { UberConfig, UberApiResponse } from './base';
import { store } from '@/lib/store';
import { TripRevenue, CreateTripRevenue } from '@/schemas/payout';

export interface UberTrip {
  request_id: string;
  status: string;
  vehicle?: {
    make?: string;
    model?: string;
    license_plate?: string;
    picture_url?: string;
  };
  driver?: {
    name?: string;
    phone_number?: string;
    picture_url?: string;
    rating?: number;
  };
  location?: {
    latitude: number;
    longitude: number;
    bearing?: number;
  };
  pickup?: {
    eta?: number;
    latitude: number;
    longitude: number;
    address?: string;
  };
  destination?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  start_time?: number;
  end_time?: number;
  fare?: {
    value: number;
    fare_id?: string;
    expires_at?: number;
    display?: string;
    currency_code: string;
  };
  distance?: number;
  duration?: number;
  surge_multiplier?: number;
}

export interface UberTripHistory {
  request_id: string;
  status: string;
  distance?: number;
  request_time?: number;
  start_time?: number;
  end_time?: number;
  start_city?: {
    latitude: number;
    longitude: number;
    display_name: string;
  };
  end_city?: {
    latitude: number;
    longitude: number;
    display_name: string;
  };
  fare?: {
    value: number;
    fare_id?: string;
    expires_at?: number;
    display?: string;
    currency_code: string;
  };
}

export interface UberReceipt {
  request_id: string;
  subtotal: string;
  total_charged: string;
  currency_code: string;
  charge_adjustments?: Array<{
    name: string;
    amount: string;
  }>;
  total_fare?: string;
  total_owed?: string;
  total_paid?: string;
  payment_method?: string;
  date?: number;
}

export class UberRidersClient extends UberOAuthClient {
  constructor(config: UberConfig) {
    super(config);
  }

  async getTripHistory(limit: number = 50, offset: number = 0): Promise<UberApiResponse<UberTripHistory[]>> {
    return this.makeRequest<UberTripHistory[]>('GET', '/v1.2/history', undefined, {
      limit,
      offset,
    });
  }

  async getTripDetails(requestId: string): Promise<UberApiResponse<UberTrip>> {
    return this.makeRequest<UberTrip>('GET', `/v1.2/requests/${requestId}`);
  }

  async getReceipt(requestId: string): Promise<UberApiResponse<UberReceipt>> {
    return this.makeRequest<UberReceipt>('GET', `/v1.2/requests/${requestId}/receipt`);
  }

  async getCurrentTrip(): Promise<UberApiResponse<UberTrip>> {
    return this.makeRequest<UberTrip>('GET', '/v1.2/requests/current');
  }

  async requestRide(
    productId: string,
    startLatitude: number,
    startLongitude: number,
    endLatitude?: number,
    endLongitude?: number
  ): Promise<UberApiResponse<UberTrip>> {
    const data: any = {
      product_id: productId,
      start_latitude: startLatitude,
      start_longitude: startLongitude,
    };

    if (endLatitude && endLongitude) {
      data.end_latitude = endLatitude;
      data.end_longitude = endLongitude;
    }

    return this.makeRequest<UberTrip>('POST', '/v1.2/requests', data);
  }

  async cancelRide(requestId: string): Promise<UberApiResponse<any>> {
    return this.makeRequest('DELETE', `/v1.2/requests/${requestId}`);
  }

  async getProducts(latitude: number, longitude: number): Promise<UberApiResponse<any[]>> {
    return this.makeRequest<any[]>('GET', '/v1/products', undefined, {
      latitude,
      longitude,
    });
  }

  async getPriceEstimates(
    startLatitude: number,
    startLongitude: number,
    endLatitude: number,
    endLongitude: number
  ): Promise<UberApiResponse<any[]>> {
    return this.makeRequest<any[]>('GET', '/v1/estimates/price', undefined, {
      start_latitude: startLatitude,
      start_longitude: startLongitude,
      end_latitude: endLatitude,
      end_longitude: endLongitude,
    });
  }

  async getTimeEstimates(latitude: number, longitude: number): Promise<UberApiResponse<any[]>> {
    return this.makeRequest<any[]>('GET', '/v1/estimates/time', undefined, {
      latitude,
      longitude,
    });
  }

  async getPlaces(placeType: 'home' | 'work'): Promise<UberApiResponse<any>> {
    return this.makeRequest('GET', '/v1/places', undefined, {
      type: placeType,
    });
  }

  async savePlace(
    placeType: 'home' | 'work',
    address: string,
    latitude: number,
    longitude: number
  ): Promise<UberApiResponse<any>> {
    const data = {
      type: placeType,
      address,
      latitude,
      longitude,
    };

    return this.makeRequest('PUT', '/v1/places', data);
  }

  async syncTripRevenues(driverId: string, limit: number = 100): Promise<{
    synced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const historyResponse = await this.getTripHistory(limit, 0);
      
      if (historyResponse.error) {
        errors.push(`Failed to fetch trip history: ${historyResponse.error}`);
        return { synced, errors };
      }

      const trips = historyResponse.data || [];
      
      for (const trip of trips) {
        try {
          // Check if trip revenue already exists
          const existingRevenues = await store.tripRevenues.findByDriverId(driverId);
          const exists = existingRevenues.some(rev => rev.tripId === trip.request_id);
          
          if (exists) {
            continue;
          }

          // Get detailed trip info and receipt
          const [tripDetailsResponse, receiptResponse] = await Promise.all([
            this.getTripDetails(trip.request_id),
            this.getReceipt(trip.request_id),
          ]);

          let grossCents = 0;
          let tripDate = trip.start_time || trip.request_time || Date.now();

          // Try to get amount from receipt first
          if (receiptResponse.data && !receiptResponse.error) {
            grossCents = Math.round(parseFloat(receiptResponse.data.total_charged || '0') * 100);
          } else if (tripDetailsResponse.data && !tripDetailsResponse.error) {
            // Fallback to trip details
            grossCents = Math.round((tripDetailsResponse.data.fare?.value || 0) * 100);
          } else if (trip.fare?.value) {
            // Fallback to trip history fare
            grossCents = Math.round(trip.fare.value * 100);
          }

          if (grossCents > 0) {
            const tripRevenueData: CreateTripRevenue = {
              driverId,
              tripId: trip.request_id,
              source: 'uber',
              grossCents,
              currency: 'EUR',
              date: tripDate,
              meta: {
                status: trip.status,
                distance: trip.distance,
                duration: trip.end_time && trip.start_time ? trip.end_time - trip.start_time : undefined,
                startCity: trip.start_city,
                endCity: trip.end_city,
                surgeMultiplier: tripDetailsResponse.data?.surge_multiplier,
              },
            };

            await store.tripRevenues.create(tripRevenueData);
            synced++;
          }
        } catch (error: any) {
          errors.push(`Failed to sync trip ${trip.request_id}: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`Failed to sync trip revenues: ${error.message}`);
    }

    return { synced, errors };
  }

  async getTripRevenueSummary(driverId: string, startDate?: number, endDate?: number): Promise<{
    totalTrips: number;
    totalRevenue: number;
    averageRevenue: number;
    period: {
      start: number;
      end: number;
    };
  }> {
    const tripRevenues = await store.tripRevenues.findByDriverId(driverId);
    
    let filteredRevenues = tripRevenues;
    if (startDate && endDate) {
      filteredRevenues = tripRevenues.filter(trip => 
        trip.date >= startDate && trip.date <= endDate
      );
    }

    const totalTrips = filteredRevenues.length;
    const totalRevenue = filteredRevenues.reduce((sum, trip) => sum + trip.grossCents, 0);
    const averageRevenue = totalTrips > 0 ? totalRevenue / totalTrips : 0;

    return {
      totalTrips,
      totalRevenue: totalRevenue / 100, // Convert to EUR
      averageRevenue: averageRevenue / 100,
      period: {
        start: startDate || (filteredRevenues.length > 0 ? Math.min(...filteredRevenues.map(t => t.date)) : Date.now()),
        end: endDate || (filteredRevenues.length > 0 ? Math.max(...filteredRevenues.map(t => t.date)) : Date.now()),
      },
    };
  }
}

export function createUberRidersClient(): UberRidersClient {
  const config = {
    clientId: process.env.UBER_CLIENT_ID || '',
    clientSecret: process.env.UBER_CLIENT_SECRET || '',
    redirectUri: process.env.UBER_REDIRECT_URI || '',
    orgUuid: process.env.UBER_ORG_UUID,
    webhookSecret: process.env.UBER_WEBHOOK_SECRET,
    useSandbox: process.env.UBER_USE_SANDBOX === 'true',
  };

  return new UberRidersClient(config);
}

