import { UberBaseClient, UberConfig, UberApiResponse } from './base';

export interface UberBusinessTrip {
  trip_id: string;
  trip_uuid: string;
  status: string;
  fare?: {
    value: number;
    currency_code: string;
  };
  distance?: number;
  duration?: number;
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
  driver?: {
    name?: string;
    phone_number?: string;
    picture_url?: string;
    rating?: number;
  };
  vehicle?: {
    make?: string;
    model?: string;
    license_plate?: string;
  };
}

export interface UberBusinessReceipt {
  receipt_id: string;
  trip_id: string;
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
  expense_codes?: string[];
}

export interface UberBusinessProfile {
  org_name: string;
  org_uuid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  picture_url?: string;
}

export class UberBusinessClient extends UberBaseClient {
  private orgUuid: string;

  constructor(config: UberConfig) {
    super(config);
    this.orgUuid = config.orgUuid || '';
  }

  async getBusinessProfile(): Promise<UberApiResponse<UberBusinessProfile>> {
    return this.makeRequest<UberBusinessProfile>('GET', `/v1/organizations/${this.orgUuid}/profile`);
  }

  async getBusinessTrips(
    limit: number = 50,
    offset: number = 0,
    startTime?: number,
    endTime?: number
  ): Promise<UberApiResponse<UberBusinessTrip[]>> {
    const params: any = {
      limit,
      offset,
    };

    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;

    return this.makeRequest<UberBusinessTrip[]>('GET', `/v1/organizations/${this.orgUuid}/trips`, undefined, params);
  }

  async getBusinessTripDetails(tripId: string): Promise<UberApiResponse<UberBusinessTrip>> {
    return this.makeRequest<UberBusinessTrip>('GET', `/v1/organizations/${this.orgUuid}/trips/${tripId}`);
  }

  async getBusinessReceipt(receiptId: string): Promise<UberApiResponse<UberBusinessReceipt>> {
    return this.makeRequest<UberBusinessReceipt>('GET', `/v1/organizations/${this.orgUuid}/receipts/${receiptId}`);
  }

  async getBusinessReceipts(
    limit: number = 50,
    offset: number = 0,
    startTime?: number,
    endTime?: number
  ): Promise<UberApiResponse<UberBusinessReceipt[]>> {
    const params: any = {
      limit,
      offset,
    };

    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;

    return this.makeRequest<UberBusinessReceipt[]>('GET', `/v1/organizations/${this.orgUuid}/receipts`, undefined, params);
  }

  async getBusinessTripSummary(
    startTime?: number,
    endTime?: number
  ): Promise<UberApiResponse<{
    total_trips: number;
    total_fare: number;
    total_distance: number;
    total_duration: number;
    currency_code: string;
  }>> {
    const params: any = {};
    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;

    return this.makeRequest('GET', `/v1/organizations/${this.orgUuid}/trips/summary`, undefined, params);
  }

  async getBusinessUsers(): Promise<UberApiResponse<Array<{
    user_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    picture_url?: string;
  }>>> {
    return this.makeRequest('GET', `/v1/organizations/${this.orgUuid}/users`);
  }

  async getBusinessUserTrips(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    startTime?: number,
    endTime?: number
  ): Promise<UberApiResponse<UberBusinessTrip[]>> {
    const params: any = {
      limit,
      offset,
    };

    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;

    return this.makeRequest<UberBusinessTrip[]>('GET', `/v1/organizations/${this.orgUuid}/users/${userId}/trips`, undefined, params);
  }

  async createBusinessTrip(
    userId: string,
    productId: string,
    startLatitude: number,
    startLongitude: number,
    endLatitude?: number,
    endLongitude?: number,
    fareId?: string
  ): Promise<UberApiResponse<UberBusinessTrip>> {
    const data: any = {
      user_id: userId,
      product_id: productId,
      start_latitude: startLatitude,
      start_longitude: startLongitude,
    };

    if (endLatitude && endLongitude) {
      data.end_latitude = endLatitude;
      data.end_longitude = endLongitude;
    }

    if (fareId) {
      data.fare_id = fareId;
    }

    return this.makeRequest<UberBusinessTrip>('POST', `/v1/organizations/${this.orgUuid}/trips`, data);
  }

  async cancelBusinessTrip(tripId: string): Promise<UberApiResponse<any>> {
    return this.makeRequest('DELETE', `/v1/organizations/${this.orgUuid}/trips/${tripId}`);
  }

  async getBusinessProducts(latitude: number, longitude: number): Promise<UberApiResponse<any[]>> {
    return this.makeRequest<any[]>('GET', `/v1/organizations/${this.orgUuid}/products`, undefined, {
      latitude,
      longitude,
    });
  }

  async getBusinessPriceEstimates(
    startLatitude: number,
    startLongitude: number,
    endLatitude: number,
    endLongitude: number
  ): Promise<UberApiResponse<any[]>> {
    return this.makeRequest<any[]>('GET', `/v1/organizations/${this.orgUuid}/estimates/price`, undefined, {
      start_latitude: startLatitude,
      start_longitude: startLongitude,
      end_latitude: endLatitude,
      end_longitude: endLongitude,
    });
  }

  async syncBusinessTripRevenues(
    limit: number = 100,
    startTime?: number,
    endTime?: number
  ): Promise<{
    synced: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const tripsResponse = await this.getBusinessTrips(limit, 0, startTime, endTime);
      
      if (tripsResponse.error) {
        errors.push(`Failed to fetch business trips: ${tripsResponse.error}`);
        return { synced, errors };
      }

      const trips = tripsResponse.data || [];
      
      for (const trip of trips) {
        try {
          // For business trips, we need to map them to drivers
          // This would require a mapping between Uber user IDs and our driver IDs
          // For now, we'll skip this or implement a basic mapping
          
          // Check if trip revenue already exists
          const existingRevenues = await (await import('@/lib/store')).store.tripRevenues.findAll();
          const exists = existingRevenues.some(rev => rev.tripId === trip.trip_id);
          
          if (exists) {
            continue;
          }

          const grossCents = Math.round((trip.fare?.value || 0) * 100);
          const tripDate = trip.start_time || trip.end_time || Date.now();

          if (grossCents > 0) {
            // Note: In a real implementation, you'd need to map the trip to a specific driver
            // For now, we'll store it with a generic driver ID or skip it
            console.log(`Business trip ${trip.trip_id} found with fare ${grossCents} cents, but no driver mapping available`);
          }
        } catch (error: any) {
          errors.push(`Failed to sync business trip ${trip.trip_id}: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`Failed to sync business trip revenues: ${error.message}`);
    }

    return { synced, errors };
  }

  async getBusinessAnalytics(
    startTime?: number,
    endTime?: number
  ): Promise<UberApiResponse<{
    total_trips: number;
    total_fare: number;
    total_distance: number;
    total_duration: number;
    average_fare: number;
    average_distance: number;
    average_duration: number;
    currency_code: string;
    trips_by_status: Record<string, number>;
  }>> {
    const summaryResponse = await this.getBusinessTripSummary(startTime, endTime);
    
    if (summaryResponse.error) {
      return {
        error: summaryResponse.error,
        status: summaryResponse.status,
      };
    }

    const summary = summaryResponse.data!;
    
    return {
      data: {
        ...summary,
        average_fare: summary.total_trips > 0 ? summary.total_fare / summary.total_trips : 0,
        average_distance: summary.total_trips > 0 ? summary.total_distance / summary.total_trips : 0,
        average_duration: summary.total_trips > 0 ? summary.total_duration / summary.total_trips : 0,
        trips_by_status: {}, // This would require additional API calls to get status breakdown
      },
      status: 200,
    };
  }

  async testConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.getBusinessProfile();
      return {
        success: response.status === 200,
        data: response.data,
        error: response.status !== 200 ? 'Failed to connect' : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }
}

export function createUberBusinessClient(): UberBusinessClient {
  const config = {
    clientId: process.env.UBER_CLIENT_ID || '',
    clientSecret: process.env.UBER_CLIENT_SECRET || '',
    redirectUri: process.env.UBER_REDIRECT_URI || '',
    orgUuid: process.env.UBER_ORG_UUID || '',
    webhookSecret: process.env.UBER_WEBHOOK_SECRET,
    useSandbox: process.env.UBER_USE_SANDBOX === 'true',
  };

  return new UberBusinessClient(config);
}
