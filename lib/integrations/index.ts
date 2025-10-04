// Exportar clientes de integração
export { BoltClient, createBoltClient } from './bolt/client';
export { CartrackClient, createCartrackClient } from './cartrack/client';
export { FonoaClient, createFonoaClient } from './fonoa/client';
export { ViaVerdeClient, createViaVerdeClient } from './viaverde/client';
export { MyprioClient, createMyprioClient } from './myprio/client';
export { BaseIntegrationClient, type IntegrationResponse } from './base-client';

// Uber já existe
export { UberBaseClient, createUberConfig } from '../uber/base';

// Tipos
export type * from './bolt/client';
export type * from './cartrack/client';
export type * from './fonoa/client';
export type * from './viaverde/client';
export type * from './myprio/client';
