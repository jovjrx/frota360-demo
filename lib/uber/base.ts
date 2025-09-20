import axios, { AxiosInstance } from 'axios';
import { encrypt, decrypt } from '@/lib/crypto/secretBox';

export interface UberConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  orgUuid?: string;
  webhookSecret?: string;
  useSandbox: boolean;
}

export interface UberTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  tokenType: string;
  scope?: string;
}

export interface UberApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export class UberBaseClient {
  protected config: UberConfig;
  protected tokens?: UberTokens;
  protected api: AxiosInstance;

  constructor(config: UberConfig) {
    this.config = config;
    
    const baseURL = config.useSandbox 
      ? 'https://sandbox-api.uber.com'
      : 'https://api.uber.com';

    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  protected setupInterceptors(): void {
    this.api.interceptors.request.use((config) => {
      if (this.tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${this.tokens.accessToken}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.tokens?.refreshToken) {
          try {
            await this.refreshAccessToken();
            // Retry the original request
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${this.tokens!.accessToken}`;
            return this.api.request(originalRequest);
          } catch (refreshError) {
            console.error('Failed to refresh Uber token:', refreshError);
            throw error;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async setTokens(tokens: UberTokens): Promise<void> {
    this.tokens = {
      ...tokens,
      accessToken: encrypt(tokens.accessToken),
      refreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
    };
  }

  async getTokens(): Promise<UberTokens | null> {
    if (!this.tokens) return null;

    return {
      ...this.tokens,
      accessToken: decrypt(this.tokens.accessToken),
      refreshToken: this.tokens.refreshToken ? decrypt(this.tokens.refreshToken) : undefined,
    };
  }

  async refreshAccessToken(): Promise<void> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshToken = decrypt(this.tokens.refreshToken);
    
    const response = await axios.post('https://login.uber.com/oauth/v2/token', {
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const newTokens: UberTokens = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken,
      expiresAt: Date.now() + (response.data.expires_in * 1000),
      tokenType: response.data.token_type,
      scope: response.data.scope,
    };

    await this.setTokens(newTokens);
  }

  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: any
  ): Promise<UberApiResponse<T>> {
    try {
      const response = await this.api.request({
        method,
        url: endpoint,
        data,
        params,
      });

      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || error.message || 'Unknown error',
        status: error.response?.status || 500,
      };
    }
  }

  protected buildAuthUrl(scopes: string[], state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(' '),
    });

    if (state) {
      params.append('state', state);
    }

    return `https://login.uber.com/oauth/v2/authorize?${params.toString()}`;
  }

  protected async exchangeCodeForTokens(code: string): Promise<UberApiResponse<UberTokens>> {
    try {
      const response = await axios.post('https://login.uber.com/oauth/v2/token', {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
        code,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const tokens: UberTokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000),
        tokenType: response.data.token_type,
        scope: response.data.scope,
      };

      return {
        data: tokens,
        status: response.status,
      };
    } catch (error: any) {
      return {
        error: error.response?.data?.message || error.message || 'Token exchange failed',
        status: error.response?.status || 500,
      };
    }
  }

  isConfigured(): boolean {
    return !!(
      this.config.clientId &&
      this.config.clientSecret &&
      this.config.redirectUri
    );
  }

  isAuthenticated(): boolean {
    return !!(this.tokens?.accessToken && this.tokens.expiresAt > Date.now());
  }
}

export function createUberConfig(): UberConfig {
  return {
    clientId: process.env.UBER_CLIENT_ID || '',
    clientSecret: process.env.UBER_CLIENT_SECRET || '',
    redirectUri: process.env.UBER_REDIRECT_URI || '',
    orgUuid: process.env.UBER_ORG_UUID,
    webhookSecret: process.env.UBER_WEBHOOK_SECRET,
    useSandbox: process.env.UBER_USE_SANDBOX === 'true',
  };
}
