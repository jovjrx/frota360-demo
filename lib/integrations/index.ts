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
import { UberClient as UberClientClass } from './uber/client';
import { BoltClient as BoltClientClass } from './bolt/client';
import { CartrackClient as CartrackClientClass } from './cartrack/client';
import { ViaVerdeClient as ViaVerdeClientClass } from './viaverde/client';
import { MyprioClient as MyprioClientClass } from './myprio/client';
import integrationService from './integration-service';

// Factory functions - BUSCA CREDENCIAIS DO FIRESTORE

export async function createUberClient() {
  const integration = await integrationService.getIntegration('uber');
  
  if (!integration) {
    throw new Error('Uber integration not configured');
  }

  return new UberClientClass({
    clientId: integration.credentials.clientId || '',
    clientSecret: integration.credentials.clientSecret || '',
    orgUuid: integration.credentials.orgUuid || '',
  });
}

export async function createBoltClient() {
  const integration = await integrationService.getIntegration('bolt');
  
  if (!integration) {
    throw new Error('Bolt integration not configured');
  }

  return new BoltClientClass({
    clientId: integration.credentials.clientId || '',
    clientSecret: integration.credentials.clientSecret || '',
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