import { UberBaseClient, UberConfig, UberTokens, UberApiResponse } from './base';
import { encrypt, decrypt } from '@/lib/crypto/secretBox';

export interface UberUserProfile {
  first_name: string;
  last_name: string;
  email: string;
  picture?: string;
  promo_code?: string;
}

export class UberOAuthClient extends UberBaseClient {
  private static readonly RIDERS_SCOPES = [
    'profile',
    'history',
    'history_lite',
    'places',
    'request',
    'request_receipt',
  ];

  private static readonly BUSINESS_SCOPES = [
    'business.profile',
    'business.trips',
    'business.trips.summary',
    'business.receipts',
  ];

  constructor(config: UberConfig) {
    super(config);
  }

  getRidersAuthUrl(state?: string): string {
    return this.buildAuthUrl(UberOAuthClient.RIDERS_SCOPES, state);
  }

  getBusinessAuthUrl(state?: string): string {
    return this.buildAuthUrl(UberOAuthClient.BUSINESS_SCOPES, state);
  }

  async exchangeCodeForTokens(code: string): Promise<UberApiResponse<UberTokens>> {
    const result = await super.exchangeCodeForTokens(code);
    
    if (result.data) {
      await this.setTokens(result.data);
    }
    
    return result;
  }

  async getUserProfile(): Promise<UberApiResponse<UberUserProfile>> {
    return this.makeRequest<UberUserProfile>('GET', '/v1/me');
  }

  async getTripHistory(limit: number = 10, offset: number = 0): Promise<UberApiResponse<any>> {
    return this.makeRequest('GET', '/v1.2/history', undefined, {
      limit,
      offset,
    });
  }

  async getTripDetails(tripId: string): Promise<UberApiResponse<any>> {
    return this.makeRequest('GET', `/v1.2/history/${tripId}`);
  }

  async getReceipt(tripId: string): Promise<UberApiResponse<any>> {
    return this.makeRequest('GET', `/v1.2/requests/${tripId}/receipt`);
  }

  async getCurrentTrip(): Promise<UberApiResponse<any>> {
    return this.makeRequest('GET', '/v1.2/requests/current');
  }

  async requestRide(
    productId: string,
    startLatitude: number,
    startLongitude: number,
    endLatitude?: number,
    endLongitude?: number
  ): Promise<UberApiResponse<any>> {
    const data: any = {
      product_id: productId,
      start_latitude: startLatitude,
      start_longitude: startLongitude,
    };

    if (endLatitude && endLongitude) {
      data.end_latitude = endLatitude;
      data.end_longitude = endLongitude;
    }

    return this.makeRequest('POST', '/v1.2/requests', data);
  }

  async cancelRide(requestId: string): Promise<UberApiResponse<any>> {
    return this.makeRequest('DELETE', `/v1.2/requests/${requestId}`);
  }

  async getProducts(latitude: number, longitude: number): Promise<UberApiResponse<any>> {
    return this.makeRequest('GET', '/v1/products', undefined, {
      latitude,
      longitude,
    });
  }

  async getPriceEstimates(
    startLatitude: number,
    startLongitude: number,
    endLatitude: number,
    endLongitude: number
  ): Promise<UberApiResponse<any>> {
    return this.makeRequest('GET', '/v1/estimates/price', undefined, {
      start_latitude: startLatitude,
      start_longitude: startLongitude,
      end_latitude: endLatitude,
      end_longitude: endLongitude,
    });
  }

  async getTimeEstimates(latitude: number, longitude: number): Promise<UberApiResponse<any>> {
    return this.makeRequest('GET', '/v1/estimates/time', undefined, {
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
}

export function createUberOAuthClient(): UberOAuthClient {
  const config = {
    clientId: process.env.UBER_CLIENT_ID || '',
    clientSecret: process.env.UBER_CLIENT_SECRET || '',
    redirectUri: process.env.UBER_REDIRECT_URI || '',
    orgUuid: process.env.UBER_ORG_UUID,
    webhookSecret: process.env.UBER_WEBHOOK_SECRET,
    useSandbox: process.env.UBER_USE_SANDBOX === 'true',
  };

  return new UberOAuthClient(config);
}

export async function storeUberTokens(userId: string, tokens: UberTokens): Promise<void> {
  const store = (await import('@/lib/store')).store;
  
  const encryptedTokens = {
    ...tokens,
    accessToken: encrypt(tokens.accessToken),
    refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
  };

  await store.drivers.update(userId, {
    uberTokens: encryptedTokens,
  });
}

export async function getUberTokens(userId: string): Promise<UberTokens | null> {
  const store = (await import('@/lib/store')).store;
  const driver = await store.drivers.findByUserId(userId);
  
  if (!driver?.uberTokens) {
    return null;
  }

  return {
    ...driver.uberTokens,
    accessToken: decrypt(driver.uberTokens.accessToken),
    refreshToken: driver.uberTokens.refreshToken ? decrypt(driver.uberTokens.refreshToken) : undefined,
  };
}

