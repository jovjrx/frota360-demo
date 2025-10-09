export { BaseIntegrationClient } from './base-client';
export { UberClient } from './uber/client';
export { BoltClient } from './bolt/client';
export { CartrackClient } from './cartrack/client';
export { ViaVerdeClient } from './viaverde/client';
export { MyprioClient } from './myprio/client';

export type {
  IntegrationCredentials,
  IntegrationResponse,
  ConnectionTestResult,
  Trip,
  Earnings,
  Driver,
  VehicleData,
  Transaction,
  Invoice,
  Expense,
} from './base-client';

// Factory functions
import { Timestamp } from 'firebase-admin/firestore';
import { UberClient as UberClientClass } from './uber/client';
import { BoltClient as BoltClientClass } from './bolt/client';
import { CartrackClient as CartrackClientClass } from './cartrack/client';
import { ViaVerdeClient as ViaVerdeClientClass } from './viaverde/client';
import { MyprioClient as MyprioClientClass } from './myprio/client';
import integrationService from './integration-service';

// Factory functions - BUSCA CREDENCIAIS DO FIRESTORE

export async function createUberClient() {
  let integration: Awaited<ReturnType<typeof integrationService.getIntegration>> | null = null;

  try {
    integration = await integrationService.getIntegration('uber');
  } catch (error) {
    console.warn('Failed to load Uber integration from Firestore:', error);
  }

  if (integration) {
    const clientId = integration.credentials.clientId || process.env.UBER_CLIENT_ID || '';
    const clientSecret = integration.credentials.clientSecret || process.env.UBER_CLIENT_SECRET || '';
    const orgUuid = integration.credentials.orgUuid || process.env.UBER_ORG_UUID || '';

    if (!clientId || !clientSecret || !orgUuid) {
      throw new Error(
        'Uber integration is missing clientId, clientSecret or orgUuid. Atualize as credenciais ou configure as variáveis UBER_CLIENT_ID, UBER_CLIENT_SECRET e UBER_ORG_UUID.'
      );
    }

    const scope =
      integration.oauth?.scope ||
      integration.credentials.scope ||
      (integration.config?.options?.scope as string | undefined) ||
      process.env.UBER_SCOPE;

    const redirectUri =
      (integration.config?.options?.redirectUri as string | undefined) ||
      process.env.UBER_REDIRECT_URI;

    const tokenSnapshot = integration.oauth
      ? {
          accessToken: integration.oauth.accessToken,
          refreshToken: integration.oauth.refreshToken,
          tokenType: integration.oauth.tokenType,
          scope: integration.oauth.scope,
          expiresAt: integration.oauth.expiresAt?.toDate(),
        }
      : undefined;

    return new UberClientClass({
      clientId,
      clientSecret,
      orgUuid,
      apiBaseUrl: integration.config?.baseUrl || process.env.UBER_BASE_URL,
      authUrl:
        integration.config?.tokenUrl ||
        integration.config?.authUrl ||
        process.env.UBER_TOKEN_URL ||
        process.env.UBER_AUTH_URL,
      scope,
      redirectUri,
      tokens: tokenSnapshot,
      onTokenUpdate: async (tokens) => {
        const expiresDate = new Date(tokens.expiresAt);
        const safeExpires = Number.isNaN(expiresDate.getTime())
          ? new Date(Date.now() + 60 * 60 * 1000)
          : expiresDate;
        await integrationService.updateOAuthTokens('uber', {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: tokens.tokenType,
          scope: tokens.scope,
          expiresAt: Timestamp.fromDate(safeExpires),
        });
      },
    });
  }

  const clientId = process.env.UBER_CLIENT_ID || '';
  const clientSecret = process.env.UBER_CLIENT_SECRET || '';
  const orgUuid = process.env.UBER_ORG_UUID || '';

  if (!clientId || !clientSecret || !orgUuid) {
    throw new Error(
      'Uber integration not configured. Provide Firestore credentials or set UBER_CLIENT_ID, UBER_CLIENT_SECRET, and UBER_ORG_UUID environment variables.'
    );
  }

  return new UberClientClass({
    clientId,
    clientSecret,
    orgUuid,
    apiBaseUrl: process.env.UBER_BASE_URL,
    authUrl: process.env.UBER_TOKEN_URL || process.env.UBER_AUTH_URL,
    scope: process.env.UBER_SCOPE,
    redirectUri: process.env.UBER_REDIRECT_URI,
  });
}

export async function createBoltClient() {
  const integration = await integrationService.getIntegration('bolt');
  
  if (!integration) {
    throw new Error('Bolt integration not configured');
  }

  return new BoltClientClass({
    clientId: integration.credentials.clientId || '',
    clientSecret: integration.credentials.clientSecret || integration.credentials.client_secret || '',
    apiBaseUrl: integration.config?.baseUrl || process.env.BOLT_BASE_URL,
    authUrl: integration.config?.authUrl || integration.config?.tokenUrl || process.env.BOLT_AUTH_URL,
    scope:
      integration.credentials.scope ||
      (integration.config?.options?.scope as string | undefined) ||
      process.env.BOLT_SCOPE ||
      'fleet-integration:api',
    defaultPageSize:
      typeof integration.config?.options?.pageSize === 'number'
        ? integration.config?.options?.pageSize
        : undefined,
  });
}

export async function createCartrackClient() {
  const integration = await integrationService.getIntegration('cartrack');
  
  if (!integration) {
    throw new Error('Cartrack integration not configured');
  }

  return new CartrackClientClass({
    username: integration.credentials.username || '',
    apiKey: integration.credentials.apiKey || '',
    baseUrl: integration.config?.baseUrl,
  });
}

export async function createViaVerdeClient() {
  const integration = await integrationService.getIntegration('viaverde');
  
  if (!integration) {
    throw new Error('ViaVerde integration not configured');
  }

  return new ViaVerdeClientClass({
    email: integration.credentials.email || '',
    password: integration.credentials.password || '',
  });
}

export async function createMyprioClient() {
  const integration = await integrationService.getIntegration('myprio');
  
  if (!integration) {
    throw new Error('myPrio integration not configured');
  }

  return new MyprioClientClass({
    accountId: integration.credentials.accountId || '',
    password: integration.credentials.password || '',
  });
}