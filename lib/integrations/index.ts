export { BaseIntegrationClient } from './base-client';
export { UberClient } from './uber/client';
export { BoltClient } from './bolt/client';
export { CartrackClient } from './cartrack/client';
export { ViaVerdeClient } from './viaverde/client';
export { FONOAClient } from './fonoa/client';
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
import { FONOAClient as FONOAClientClass } from './fonoa/client';
import { MyprioClient as MyprioClientClass } from './myprio/client';

export function createUberClient() {
  return new UberClientClass({
    clientId: process.env.UBER_CLIENT_ID || '',
    clientSecret: process.env.UBER_CLIENT_SECRET || '',
    orgUuid: process.env.UBER_ORG_UUID || '',
  });
}

export function createBoltClient() {
  return new BoltClientClass({
    email: process.env.BOLT_EMAIL || '',
    password: process.env.BOLT_PASSWORD || '',
  });
}

export function createCartrackClient() {
  return new CartrackClientClass({
    baseUrl: process.env.CARTRACK_BASE_URL || 'https://fleetapi-pt.cartrack.com/rest',
    username: process.env.CARTRACK_USERNAME || '',
    password: process.env.CARTRACK_PASSWORD || '',
  });
}

export function createViaVerdeClient() {
  return new ViaVerdeClientClass({
    email: process.env.VIAVERDE_EMAIL || '',
    password: process.env.VIAVERDE_PASSWORD || '',
  });
}

export function createFonoaClient() {
  return new FONOAClientClass({
    email: process.env.FONOA_EMAIL || '',
    password: process.env.FONOA_PASSWORD || '',
  });
}

export function createMyprioClient() {
  return new MyprioClientClass({
    accountId: process.env.MYPRIO_ACCOUNT_ID || '',
    password: process.env.MYPRIO_PASSWORD || '',
  });
}