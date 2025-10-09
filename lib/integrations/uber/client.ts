import {
  BaseIntegrationClient,
  ConnectionTestResult,
  Trip,
  Earnings,
  Driver,
} from '../base-client';

interface UberClientOptions {
  clientId: string;
  clientSecret: string;
  orgUuid: string;
  apiBaseUrl?: string;
  authUrl?: string;
  scope?: string;
  redirectUri?: string;
  tokens?: UberTokenSnapshot;
  onTokenUpdate?: (tokens: UberTokenSnapshot) => Promise<void> | void;
}

interface UberAuthResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

type UberTripPayload = Record<string, any>;
type UberDriverPayload = Record<string, any>;

interface UberTokenSnapshot {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: number | string | Date;
}

interface CachedToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  scope?: string;
  expiresAt: number;
}

export class UberClient extends BaseIntegrationClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly orgUuid: string;
  private readonly authUrl: string;
  private readonly scope?: string;
  private readonly redirectUri?: string;
  private readonly onTokenUpdate?: (tokens: UberTokenSnapshot & { expiresAt: number }) => Promise<void> | void;

  private token?: CachedToken;

  constructor(options: UberClientOptions) {
    const baseUrl = (options.apiBaseUrl || 'https://api.uber.com/v1').replace(/\/$/, '');
    super(
      {
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        orgUuid: options.orgUuid,
      },
      baseUrl
    );

    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.orgUuid = options.orgUuid;
    this.authUrl = (options.authUrl || 'https://login.uber.com/oauth/v2/token').replace(/\/$/, '');
    this.scope = options.scope;
    this.redirectUri = options.redirectUri;
    this.onTokenUpdate = options.onTokenUpdate;

    if (options.tokens?.accessToken) {
      this.token = {
        accessToken: options.tokens.accessToken,
        refreshToken: options.tokens.refreshToken,
        tokenType: options.tokens.tokenType || 'Bearer',
        scope: options.tokens.scope || options.scope,
        expiresAt: this.resolveExpiry(options.tokens.expiresAt),
      };
      this.isAuthenticated = this.isTokenValid();
    }
  }

  getPlatformName(): string {
    return 'Uber';
  }

  async authenticate(forceRefresh = false): Promise<void> {
    await this.ensureAccessToken(forceRefresh);
    this.isAuthenticated = true;
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const drivers = await this.getDrivers();
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
    const startSeconds = this.toEpochSeconds(startDate);
    const endSeconds = this.toEpochSeconds(endDate);

    if (startSeconds === null || endSeconds === null) {
      throw new Error('Invalid start or end date');
    }

    const limit = 200;
    let offset = 0;
    let page = 0;
    const trips: Trip[] = [];

    do {
      const params = new URLSearchParams({
        start_time: String(startSeconds),
        end_time: String(endSeconds),
        limit: String(limit),
        offset: String(offset),
      });

      const response = await this.makeRequest<Record<string, any>>(
        'GET',
        `/organizations/${this.orgUuid}/trips?${params.toString()}`
      );

      const payloadTrips = this.extractTrips(response);

      payloadTrips.forEach((tripPayload) => {
        const normalized = this.normalizeTrip(tripPayload);
        if (normalized) {
          trips.push(normalized);
        }
      });

      if (payloadTrips.length < limit) {
        break;
      }

      offset += limit;
      page += 1;

      if (page > 50) {
        console.warn('Uber getTrips aborted due to excessive pagination (>50 pages).');
        break;
      }
    } while (true);

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
    const limit = 200;
    let offset = 0;
    let page = 0;
    const drivers: Driver[] = [];

    do {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (updatedSince) {
        const timestamp = this.toEpochSeconds(updatedSince);
        if (timestamp !== null) {
          params.set('updated_since', String(timestamp));
        }
      }

      const response = await this.makeRequest<Record<string, any>>(
        'GET',
        `/organizations/${this.orgUuid}/drivers?${params.toString()}`
      );

      const payloadDrivers = this.extractDrivers(response);

      payloadDrivers.forEach((driverPayload) => {
        const normalized = this.normalizeDriver(driverPayload);
        if (normalized) {
          drivers.push(normalized);
        }
      });

      if (payloadDrivers.length < limit) {
        break;
      }

      offset += limit;
      page += 1;

      if (page > 50) {
        console.warn('Uber getDrivers aborted due to excessive pagination (>50 pages).');
        break;
      }
    } while (true);

    return drivers;
  }

  setOAuthTokens(tokens: UberTokenSnapshot): void {
    const expiresAt = this.resolveExpiry(tokens.expiresAt);
    this.token = {
      accessToken: tokens.accessToken || '',
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType || 'Bearer',
      scope: tokens.scope || this.scope,
      expiresAt,
    };
    this.isAuthenticated = this.isTokenValid();
  }

  protected async makeRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    const accessToken = await this.ensureAccessToken(false);

    const requestHeaders = {
      Accept: 'application/json',
      Authorization: `${this.token?.tokenType || 'Bearer'} ${accessToken}`,
      ...headers,
    };

    try {
      return await super.makeRequest(method, endpoint, data, requestHeaders);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/401/.test(message)) {
        await this.ensureAccessToken(true);
        const refreshedHeaders = {
          ...requestHeaders,
          Authorization: `${this.token?.tokenType || 'Bearer'} ${this.token?.accessToken || ''}`,
        };
        return super.makeRequest(method, endpoint, data, refreshedHeaders);
      }

      throw error;
    }
  }

  private async ensureAccessToken(forceRefresh: boolean): Promise<string> {
    if (!forceRefresh && this.isTokenValid()) {
      return this.token!.accessToken;
    }

    if (!forceRefresh && this.token?.refreshToken) {
      try {
        await this.refreshAccessToken();
        return this.token!.accessToken;
      } catch (error) {
        console.warn('Uber refresh token failed, falling back to client credentials:', error);
      }
    }

    await this.requestClientCredentialsToken();
    return this.token!.accessToken;
  }

  private isTokenValid(): boolean {
    if (!this.token?.accessToken) {
      return false;
    }

    return Date.now() < this.token.expiresAt - 60_000; // 60s safety margin
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.token?.refreshToken) {
      throw new Error('Refresh token not available');
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.token.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    if (this.scope) {
      params.set('scope', this.scope);
    }

    if (this.redirectUri) {
      params.set('redirect_uri', this.redirectUri);
    }

    const response = await fetch(this.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Uber token refresh failed (${response.status}): ${errorText}`);
    }

    const payload: UberAuthResponse = await response.json();
    this.storeTokenPayload(payload, payload.refresh_token || this.token.refreshToken);
  }

  private async requestClientCredentialsToken(): Promise<void> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    if (this.scope) {
      params.set('scope', this.scope);
    }

    const response = await fetch(this.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Uber authentication failed (${response.status}): ${errorText}`);
    }

    const payload: UberAuthResponse = await response.json();
    this.storeTokenPayload(payload, payload.refresh_token);
  }

  private storeTokenPayload(payload: UberAuthResponse, refreshToken?: string): void {
    const expiresInSeconds = typeof payload.expires_in === 'number' ? payload.expires_in : 3600;
    const expiresAt = Date.now() + expiresInSeconds * 1000;

    this.token = {
      accessToken: payload.access_token,
      refreshToken: refreshToken,
      tokenType: payload.token_type || 'Bearer',
      scope: payload.scope || this.scope,
      expiresAt,
    };

    this.isAuthenticated = true;

    if (this.onTokenUpdate) {
      this.onTokenUpdate({
        accessToken: this.token.accessToken,
        refreshToken: this.token.refreshToken,
        tokenType: this.token.tokenType,
        scope: this.token.scope,
        expiresAt,
      });
    }
  }

  private extractTrips(response: Record<string, any>): UberTripPayload[] {
    if (!response) {
      return [];
    }

    if (Array.isArray(response.trips)) {
      return response.trips;
    }

    if (response.data && Array.isArray(response.data.trips)) {
      return response.data.trips;
    }

    if (response.result && Array.isArray(response.result.trips)) {
      return response.result.trips;
    }

    return [];
  }

  private extractDrivers(response: Record<string, any>): UberDriverPayload[] {
    if (!response) {
      return [];
    }

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

  private normalizeTrip(trip: UberTripPayload): Trip | null {
    const id = this.toStringValue(trip.trip_id || trip.id || trip.uuid);
    if (!id) {
      return null;
    }

    const driverId = this.toStringValue(trip.driver_id || trip.driverId || trip.driver?.id) || 'unknown';
    const startTimestamp = this.parseTimestamp(trip.start_time || trip.startTime || trip.started_at);

    if (!startTimestamp) {
      return null;
    }

    const endTimestamp = this.parseTimestamp(trip.end_time || trip.endTime || trip.completed_at);

    const distanceKm = this.resolveDistance(trip);
    const fareValue = this.resolveFare(trip);
    const tipValue = this.resolveTip(trip);
    const tollsValue = this.resolveTolls(trip);
    const currency = this.resolveCurrency(trip);

    const durationMinutes = endTimestamp
      ? Math.max(0, (endTimestamp - startTimestamp) / 60000)
      : 0;

    return {
      id,
      date: new Date(startTimestamp).toISOString().split('T')[0],
      startTime: new Date(startTimestamp).toISOString(),
      endTime: endTimestamp ? new Date(endTimestamp).toISOString() : '',
      distance: distanceKm,
      duration: durationMinutes,
      earnings: fareValue,
      driverId,
      driver_id: driverId,
      status: this.mapTripStatus(String(trip.trip_status || trip.status || 'pending')),
      fare: {
        value: fareValue,
        currency,
      },
      tip: tipValue,
      tolls: tollsValue,
      currency,
      raw: trip,
    };
  }

  private normalizeDriver(driver: UberDriverPayload): Driver | null {
    const id = this.toStringValue(driver.driver_id || driver.id || driver.uuid);
    if (!id) {
      return null;
    }

    const firstName = this.toStringValue(driver.first_name || driver.firstName || driver.given_name);
    const lastName = this.toStringValue(driver.last_name || driver.lastName || driver.family_name);
    const name = this.toStringValue(driver.name) || [firstName, lastName].filter(Boolean).join(' ').trim() || 'Sem nome';

    return {
      id,
      name,
      email: this.toStringValue(driver.email || driver.email_address),
      phone: this.toStringValue(driver.phone_number || driver.phone || driver.mobile),
      status: this.mapDriverStatus(String(driver.status || driver.state || 'inactive')),
      totalTrips: typeof driver.total_trips === 'number' ? driver.total_trips : 0,
      totalEarnings: typeof driver.total_earnings === 'number' ? driver.total_earnings : 0,
    };
  }

  private mapTripStatus(uberStatus: string): 'completed' | 'cancelled' | 'pending' {
    const status = uberStatus.toLowerCase();

    if (['completed', 'finished', 'ended'].includes(status)) {
      return 'completed';
    }

    if (['cancelled', 'canceled', 'no_show', 'no-show'].includes(status)) {
      return 'cancelled';
    }

    return 'pending';
  }

  private mapDriverStatus(uberStatus: string): 'active' | 'inactive' | 'suspended' {
    const status = uberStatus.toLowerCase();

    if (['active', 'online', 'available'].includes(status)) {
      return 'active';
    }

    if (['suspended', 'blocked', 'banned'].includes(status)) {
      return 'suspended';
    }

    return 'inactive';
  }

  private resolveDistance(trip: UberTripPayload): number {
    const value = typeof trip.distance === 'number'
      ? trip.distance
      : typeof trip.distance_m === 'number'
      ? trip.distance_m
      : typeof trip.distance_km === 'number'
      ? trip.distance_km
      : typeof trip.distanceMiles === 'number'
      ? trip.distanceMiles
      : typeof trip.distanceMeters === 'number'
      ? trip.distanceMeters
      : undefined;

    const unit = this.toStringValue(
      trip.distance_unit || trip.distanceUnit || trip.distance_units || (trip.distance && trip.distance.unit)
    )?.toLowerCase();

    if (value === undefined || Number.isNaN(value)) {
      return 0;
    }

    if (unit === 'm' || unit === 'meter' || unit === 'meters') {
      return value / 1000;
    }

    if (unit === 'mi' || unit === 'mile' || unit === 'miles') {
      return value * 1.60934;
    }

    if (typeof trip.distance === 'object' && trip.distance) {
      const distanceValue = Number(trip.distance.value);
      const distanceUnit = this.toStringValue(trip.distance.unit)?.toLowerCase();
      if (!Number.isNaN(distanceValue)) {
        if (distanceUnit === 'meters' || distanceUnit === 'm') {
          return distanceValue / 1000;
        }
        if (distanceUnit === 'miles' || distanceUnit === 'mi') {
          return distanceValue * 1.60934;
        }
        if (distanceUnit === 'km' || distanceUnit === 'kilometers') {
          return distanceValue;
        }
      }
    }

    return value;
  }

  private resolveFare(trip: UberTripPayload): number {
    const fare = trip.fare || trip.price || trip.total_fare;

    if (typeof fare === 'number') {
      return fare;
    }

    if (fare && typeof fare === 'object') {
      if (typeof fare.total === 'number') {
        return fare.total;
      }
      if (typeof fare.value === 'number') {
        return fare.value;
      }
      if (typeof fare.amount === 'number') {
        return fare.amount;
      }
    }

    if (typeof trip.earnings === 'number') {
      return trip.earnings;
    }

    return 0;
  }

  private resolveTip(trip: UberTripPayload): number {
    if (typeof trip.tip === 'number') {
      return trip.tip;
    }

    if (trip.fare && typeof trip.fare === 'object' && typeof trip.fare.tip === 'number') {
      return trip.fare.tip;
    }

    return 0;
  }

  private resolveTolls(trip: UberTripPayload): number {
    if (typeof trip.tolls === 'number') {
      return trip.tolls;
    }

    if (trip.fare && typeof trip.fare === 'object' && typeof trip.fare.tolls === 'number') {
      return trip.fare.tolls;
    }

    return 0;
  }

  private resolveCurrency(trip: UberTripPayload): string | undefined {
    if (typeof trip.currency === 'string') {
      return trip.currency;
    }

    const fare = trip.fare || trip.price;
    if (fare && typeof fare === 'object' && typeof fare.currency_code === 'string') {
      return fare.currency_code;
    }

    if (fare && typeof fare === 'object' && typeof fare.currency === 'string') {
      return fare.currency;
    }

    return undefined;
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
        const numeric = Number(trimmed);
        return trimmed.length <= 10 ? numeric * 1000 : numeric;
      }

      const date = new Date(trimmed);
      if (!Number.isNaN(date.getTime())) {
        return date.getTime();
      }
    }

    return null;
  }

  private toEpochSeconds(date: string): number | null {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return Math.floor(parsed.getTime() / 1000);
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

  private resolveExpiry(value?: number | string | Date): number {
    if (!value) {
      return Date.now() + 5 * 60 * 1000; // default 5 minutes
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    if (typeof value === 'number') {
      return value > 10_000_000_000 ? value : value * 1000;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }

    return Date.now() + 5 * 60 * 1000;
  }
}
