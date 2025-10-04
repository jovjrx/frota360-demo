import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface IntegrationConfig {
  baseURL: string;
  username?: string;
  password?: string;
  apiKey?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface IntegrationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rawData?: any;
}

export abstract class BaseIntegrationClient {
  protected api: AxiosInstance;
  protected config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
    
    this.api = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers,
      },
    });

    this.setupAuth();
    this.setupInterceptors();
  }

  protected setupAuth(): void {
    if (this.config.username && this.config.password) {
      this.api.defaults.auth = {
        username: this.config.username,
        password: this.config.password,
      };
    }

    if (this.config.apiKey) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
  }

  protected setupInterceptors(): void {
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error(`Integration error (${this.constructor.name}):`, {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
        return Promise.reject(error);
      }
    );
  }

  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<IntegrationResponse<T>> {
    try {
      const response = await this.api.request({
        method,
        url: endpoint,
        data,
        ...config,
      });

      return {
        success: true,
        data: response.data,
        rawData: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Unknown error',
        rawData: error.response,
      };
    }
  }

  abstract testConnection(): Promise<IntegrationResponse>;
  abstract getName(): string;
}
