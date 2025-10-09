import {
  BaseIntegrationClient,
  IntegrationCredentials,
  ConnectionTestResult,
  Trip,
  Earnings,
  Driver,
} from '../base-client';

interface BoltClientOptions extends IntegrationCredentials {
  clientId: string;
  clientSecret: string;
  apiBaseUrl?: string;
  authUrl?: string;
  scope?: string;
  audience?: string;
  defaultPageSize?: number;
}

interface BoltAuthResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
  scope?: string;
}

interface BoltOrdersResponse {
  orders?: BoltTripPayload[];
  data?: {
    orders?: BoltTripPayload[];
    [key: string]: unknown;
  };
  result?: {
    orders?: BoltTripPayload[];
    [key: string]: unknown;
  };
  pagination?: {
    cursor?: string;
    nextCursor?: string;
    next_page_token?: string;
    nextPageToken?: string;
    continuationToken?: string;
    hasMore?: boolean;
    has_more?: boolean;
  };
  nextCursor?: string;
  next_cursor?: string;
  next_page_token?: string;
  nextPageToken?: string;
  continuationToken?: string;
  hasMore?: boolean;
  has_more?: boolean;
  [key: string]: unknown;
}

interface BoltDriversResponse {
  drivers?: BoltDriverPayload[];
  data?: {
    drivers?: BoltDriverPayload[];
    [key: string]: unknown;
  };
  result?: {
    drivers?: BoltDriverPayload[];
    [key: string]: unknown;
  };
  pagination?: {
    cursor?: string;
    nextCursor?: string;
    next_page_token?: string;
    nextPageToken?: string;
    continuationToken?: string;
    hasMore?: boolean;
    has_more?: boolean;
  };
  nextCursor?: string;
  next_cursor?: string;
  next_page_token?: string;
  nextPageToken?: string;
  continuationToken?: string;
  hasMore?: boolean;
  has_more?: boolean;
  [key: string]: unknown;
}

type BoltTripPayload = Record<string, any>;
type BoltDriverPayload = Record<string, any>;

interface CachedToken {
  value: string;
  tokenType: string;
  expiresAt: number;
  raw: BoltAuthResponse;
}

export class BoltClient extends BaseIntegrationClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly authUrl: string;
  private readonly scope?: string;
  private readonly audience?: string;
  private readonly defaultPageSize: number;
  private token?: CachedToken;

  constructor(options: BoltClientOptions) {
    const apiBaseUrl = (options.apiBaseUrl || 'https://node.bolt.eu/fleet-integration-gateway').replace(/\/$/, '');
    super(options, apiBaseUrl);

    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.authUrl = (options.authUrl || 'https://oidc.bolt.eu/token').replace(/\/$/, '');
    this.scope = options.scope || undefined;
    this.audience = options.audience;
    this.defaultPageSize = options.defaultPageSize && options.defaultPageSize > 0
      ? Math.min(options.defaultPageSize, 500)
      : 200;
  }

  getPlatformName(): string {
    return 'Bolt';
  }

  async authenticate(forceRefresh = false): Promise<void> {
    await this.obtainAccessToken(forceRefresh);
  }

  private isTokenValid(): boolean {
    if (!this.token) {
      return false;
    }

    return Date.now() < this.token.expiresAt - 30_000; // margem de 30s
  }

  private async obtainAccessToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.isTokenValid()) {
      this.isAuthenticated = true;
      return this.token!.value;
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    if (this.scope) {
      body.set('scope', this.scope);
    }

    if (this.audience) {
      body.set('audience', this.audience);
    }

    const response = await fetch(this.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bolt OAuth token request failed (${response.status}): ${errorText}`);
    }

    const payload: BoltAuthResponse = await response.json();

    if (!payload?.access_token) {
      throw new Error('Bolt OAuth token response is missing access_token');
    }

    const expiresInSeconds = typeof payload.expires_in === 'number' ? payload.expires_in : 3600;
    this.token = {
      value: payload.access_token,
      tokenType: payload.token_type || 'Bearer',
      expiresAt: Date.now() + expiresInSeconds * 1000,
      raw: payload,
    };
    this.isAuthenticated = true;

    return this.token.value;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await this.makeRequest<BoltDriversResponse>('POST', '/fleetIntegration/v1/getDrivers', {
        limit: 1,
      });

      const drivers = this.extractDrivers(response);

      return {
        success: true,
        lastSync: new Date().toISOString(),
        data: {
          driversFetched: drivers.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getTrips(startDate: string, endDate: string): Promise<Trip[]> {
    const from = this.toEpochMillis(startDate);
    const to = this.toEpochMillis(endDate);

    if (!from || !to) {
      throw new Error('Invalid start or end date');
    }

    const trips: Trip[] = [];
    let cursor: string | undefined;
    let page = 0;

    do {
      const payload: Record<string, any> = {
        from,
        to,
        limit: this.defaultPageSize,
      };

      if (cursor) {
        payload.cursor = cursor;
      }

      const response = await this.makeRequest<BoltOrdersResponse>(
        'POST',
        '/fleetIntegration/v1/getFleetOrders',
        payload
      );

      const orders = this.extractOrders(response);
      orders.forEach((order) => {
        const normalized = this.normalizeTrip(order);
        if (normalized) {
          trips.push(normalized);
        }
      });

      cursor = this.nextCursor(response);
      page += 1;

      if (!cursor && !this.responseHasMore(response)) {
        break;
      }

      // Safety guard to avoid infinite loops
      if (page > 50) {
        console.warn('Bolt getTrips aborted due to excessive pagination (>50 pages).');
        break;
      }
    } while (cursor);

    return trips;
  }

  async getEarnings(startDate: string, endDate: string): Promise<Earnings> {
    const trips = await this.getTrips(startDate, endDate);
    const totalEarnings = trips.reduce((sum, trip) => sum + (trip.earnings || 0), 0);

    return {
      total: totalEarnings,
      trips: trips.length,
      averagePerTrip: trips.length > 0 ? totalEarnings / trips.length : 0,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  }

  async getDrivers(updatedSince?: string): Promise<Driver[]> {
    const drivers: Driver[] = [];
    let cursor: string | undefined;
    let page = 0;

    do {
      const payload: Record<string, any> = {
        limit: this.defaultPageSize,
      };

      if (cursor) {
        payload.cursor = cursor;
      }

      if (updatedSince) {
        const timestamp = this.toEpochMillis(updatedSince);
        if (timestamp) {
          payload.updated_since = timestamp;
        }
      }

      const response = await this.makeRequest<BoltDriversResponse>(
        'POST',
        '/fleetIntegration/v1/getDrivers',
        payload
      );

      const rawDrivers = this.extractDrivers(response);
      rawDrivers.forEach((driver) => {
        const normalized = this.normalizeDriver(driver);
        if (normalized) {
          drivers.push(normalized);
        }
      });

      cursor = this.nextCursor(response);
      page += 1;

      if (!cursor && !this.responseHasMore(response)) {
        break;
      }

      if (page > 50) {
        console.warn('Bolt getDrivers aborted due to excessive pagination (>50 pages).');
        break;
      }
    } while (cursor);

    return drivers;
  }

  private extractOrders(response: BoltOrdersResponse): BoltTripPayload[] {
    if (Array.isArray(response.orders)) {
      return response.orders;
    }

    if (response.data && Array.isArray(response.data.orders)) {
      return response.data.orders;
    }

    if (response.result && Array.isArray(response.result.orders)) {
      return response.result.orders;
    }

    return [];
  }

  private extractDrivers(response: BoltDriversResponse): BoltDriverPayload[] {
    if (Array.isArray(response.drivers)) {
      return response.drivers;
    }

    if (response.data && Array.isArray(response.data.drivers)) {
      return response.data.drivers;
    }

    if (response.result && Array.isArray(response.result.drivers)) {
      return response.result.drivers;
    }

    return [];
  }

  private nextCursor(response: { [key: string]: any }): string | undefined {
    const pagination = response.pagination as Record<string, any> | undefined;

    return (
      pagination?.nextCursor ||
      pagination?.cursor ||
      pagination?.next_page_token ||
      pagination?.nextPageToken ||
      pagination?.continuationToken ||
      response.nextCursor ||
      response.next_cursor ||
      response.next_page_token ||
      response.nextPageToken ||
      response.continuationToken
    );
  }

  private responseHasMore(response: { [key: string]: any }): boolean {
    const pagination = response.pagination as Record<string, any> | undefined;

    if (typeof pagination?.hasMore === 'boolean') {
      return pagination.hasMore;
    }

    if (typeof pagination?.has_more === 'boolean') {
      return pagination.has_more;
    }

    if (typeof response.hasMore === 'boolean') {
      return response.hasMore;
    }

    if (typeof response.has_more === 'boolean') {
      return response.has_more;
    }

    return Boolean(this.nextCursor(response));
  }

  private normalizeTrip(trip: BoltTripPayload): Trip | null {
    const id = this.toStringValue(trip.id || trip.order_id || trip.orderId || trip.uuid);
    if (!id) {
      return null;
    }

    const driverId = this.toStringValue(
      trip.driver_id || trip.driverId || trip.driver?.id || trip.driver?.driverId
    ) || 'unknown';

    const startTimestamp = this.parseTimestamp(
      trip.start_time || trip.startTime || trip.started_at || trip.startedAt || trip.startTimestamp
    );
    if (!startTimestamp) {
      return null;
    }

    const endTimestamp = this.parseTimestamp(
      trip.end_time || trip.endTime || trip.finished_at || trip.finishedAt || trip.endTimestamp
    );

    const distanceMeters = this.resolveDistance(trip);
    const earningsAmount = this.resolveEarnings(trip);
    const tipAmount = this.resolveTip(trip);
    const currency = this.resolveCurrency(trip);

    const durationMinutes = endTimestamp
      ? Math.max(0, (endTimestamp - startTimestamp) / 60000)
      : 0;

    return {
      id,
      date: new Date(startTimestamp).toISOString().split('T')[0],
      startTime: new Date(startTimestamp).toISOString(),
      endTime: endTimestamp ? new Date(endTimestamp).toISOString() : '',
      distance: distanceMeters / 1000,
      duration: durationMinutes,
      earnings: earningsAmount,
      driverId,
      driver_id: driverId,
      status: this.mapTripStatus(String(trip.status || trip.order_status || 'pending')),
      fare: {
        value: earningsAmount,
        currency,
      },
      tip: tipAmount,
      currency,
      raw: trip,
    };
  }

  private normalizeDriver(driver: BoltDriverPayload): Driver | null {
    const id = this.toStringValue(driver.id || driver.driver_id || driver.uuid);
    if (!id) {
      return null;
    }

    const firstName = this.toStringValue(driver.first_name || driver.firstName || driver.given_name);
    const lastName = this.toStringValue(driver.last_name || driver.lastName || driver.family_name);
    const name = this.toStringValue(driver.name) || [firstName, lastName].filter(Boolean).join(' ').trim() || 'Sem nome';

    const email = this.toStringValue(driver.email || driver.email_address);
    const phone = this.toStringValue(driver.phone || driver.phone_number || driver.mobile);

    return {
      id,
      name,
      email,
      phone,
      status: this.mapDriverStatus(String(driver.status || driver.state || 'inactive')),
      totalTrips: typeof driver.total_rides === 'number' ? driver.total_rides : 0,
      totalEarnings: typeof driver.total_earnings === 'number' ? driver.total_earnings : 0,
    };
  }

  private parseTimestamp(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return value > 10_000_000_000 ? value : value * 1000;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();

      if (/^\d+$/.test(trimmed)) {
        const numericValue = Number(trimmed);
        return trimmed.length <= 10 ? numericValue * 1000 : numericValue;
      }

      const date = new Date(trimmed);
      if (!Number.isNaN(date.getTime())) {
        return date.getTime();
      }
    }

    return null;
  }

  private resolveDistance(trip: BoltTripPayload): number {
    const distanceValue =
      typeof trip.distance === 'number'
        ? trip.distance
        : typeof trip.distance_m === 'number'
        ? trip.distance_m
        : typeof trip.distanceMeters === 'number'
        ? trip.distanceMeters
        : typeof trip.distance_km === 'number'
        ? trip.distance_km * 1000
        : typeof trip.distanceKm === 'number'
        ? trip.distanceKm * 1000
        : typeof trip.distanceValue === 'number'
        ? trip.distanceValue
        : null;

    if (distanceValue !== null) {
      return distanceValue;
    }

    if (trip.distance && typeof trip.distance === 'object') {
      if (typeof trip.distance.value === 'number') {
        const unit = typeof trip.distance.unit === 'string' ? trip.distance.unit.toLowerCase() : 'm';
        if (unit === 'km') {
          return trip.distance.value * 1000;
        }
        return trip.distance.value;
      }
    }

    return 0;
  }

  private resolveEarnings(trip: BoltTripPayload): number {
    const price = trip.price || trip.total_price || trip.price_total || trip.fare;

    if (typeof price === 'number') {
      return price;
    }

    if (price && typeof price === 'object') {
      if (typeof price.amount === 'number') {
        return price.amount;
      }
      if (typeof price.total === 'number') {
        return price.total;
      }
      if (typeof price.value === 'number') {
        return price.value;
      }
      if (typeof price.net === 'number') {
        return price.net;
      }
    }

    if (typeof trip.earnings === 'number') {
      return trip.earnings;
    }

    return 0;
  }

  private resolveTip(trip: BoltTripPayload): number {
    if (typeof trip.tip === 'number') {
      return trip.tip;
    }

    if (trip.price && typeof trip.price === 'object' && typeof trip.price.tip === 'number') {
      return trip.price.tip;
    }

    return 0;
  }

  private resolveCurrency(trip: BoltTripPayload): string | undefined {
    const price = trip.price || trip.total_price || trip.price_total;

    if (price && typeof price === 'object') {
      if (typeof price.currency === 'string') {
        return price.currency;
      }
    }

    if (typeof trip.currency === 'string') {
      return trip.currency;
    }

    return undefined;
  }

  private mapTripStatus(boltStatus: string): 'completed' | 'cancelled' | 'pending' {
    const status = boltStatus.toLowerCase();

    if (['completed', 'finished', 'ended', 'done'].includes(status)) {
      return 'completed';
    }

    if (['cancelled', 'canceled', 'rejected'].includes(status)) {
      return 'cancelled';
    }

    return 'pending';
  }

  private mapDriverStatus(boltStatus: string): 'active' | 'inactive' | 'suspended' {
    const status = boltStatus.toLowerCase();

    if (['active', 'online', 'available'].includes(status)) {
      return 'active';
    }

    if (['suspended', 'blocked', 'banned'].includes(status)) {
      return 'suspended';
    }

    return 'inactive';
  }

  private toEpochMillis(date: string): number | null {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.getTime();
  }

  private toStringValue(value: unknown): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return undefined;
  }

  protected async makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const tokenValue = await this.obtainAccessToken(false);
    const tokenType = this.token?.tokenType || 'Bearer';

    const authHeaders = {
      Accept: 'application/json',
      Authorization: `${tokenType} ${tokenValue}`,
      ...headers,
    };

    try {
      return await super.makeRequest(method, endpoint, data, authHeaders);
    } catch (error) {
      if (error instanceof Error && /401/.test(error.message)) {
        await this.obtainAccessToken(true);
        const refreshedHeaders = {
          ...authHeaders,
          Authorization: `${this.token?.tokenType || 'Bearer'} ${this.token?.value || ''}`,
        };
        return super.makeRequest(method, endpoint, data, refreshedHeaders);
      }

      throw error;
    }
  }
}

// Factory function para criar instância com env vars
export function createBoltClient(): BoltClient {
  const clientId = process.env.BOLT_CLIENT_ID || process.env.NEXT_PUBLIC_BOLT_CLIENT_ID || '';
  const clientSecret = process.env.BOLT_SECRET || process.env.BOLT_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    throw new Error('BOLT_CLIENT_ID and BOLT_SECRET are required');
  }

  return new BoltClient({
    clientId,
    clientSecret,
    apiBaseUrl: process.env.BOLT_BASE_URL,
    authUrl: process.env.BOLT_AUTH_URL,
    scope: process.env.BOLT_SCOPE,
  });
}