# Prompt Completo: Integração de APIs para Dashboard TVDE

## Objetivo

Integrar 6 plataformas (Uber, Bolt, Cartrack, FONOA, ViaVerde, myprio) no painel admin do Conduz PT para fornecer métricas consolidadas em tempo real para gestão de frota TVDE.

---

## Credenciais das Plataformas

```env
# Uber
UBER_CLIENT_ID=
UBER_CLIENT_SECRET=
UBER_ORG_UUID=
UBER_EMAIL=info@alvoradamagistral.eu
UBER_PASSWORD=Alvorada@25

# Bolt
BOLT_EMAIL=caroline@alvoradamagistral.eu
BOLT_PASSWORD=Muffin@2017

# Cartrack
CARTRACK_BASE_URL=https://fleetapi-pt.cartrack.com/rest
CARTRACK_USERNAME=ALVO00008
CARTRACK_PASSWORD=Alvorada2025@

# FONOA
FONOA_EMAIL=info@alvoradamagistral.eu
FONOA_PASSWORD=Muffin@2017

# ViaVerde
VIAVERDE_EMAIL=info@alvoradamagistral.eu
VIAVERDE_PASSWORD=Alvorada2025@

# myprio
MYPRIO_ACCOUNT_ID=606845
MYPRIO_PASSWORD=Alvorada25@
```

---

## 1. Cartrack API (Portugal)

### Informações Gerais
- **Base URL**: `https://fleetapi-pt.cartrack.com/rest`
- **Autenticação**: Basic Auth (Base64 encoded `username:password`)
- **Documentação**: https://fleetapi-pt.cartrack.com/rest/redoc.php
- **Formato**: JSON

### Autenticação

```typescript
const auth = Buffer.from(`${username}:${password}`).toString('base64');
const headers = {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json'
};
```

### Endpoints Importantes

#### 1.1 Listar Veículos
```
GET /vehicles
GET /vehicles/status
```

**Response:**
```json
{
  "vehicles": [
    {
      "id": "12345",
      "registration": "AB-12-CD",
      "make": "Toyota",
      "model": "Corolla",
      "year": 2020,
      "status": "active",
      "location": {
        "lat": 38.7223,
        "lng": -9.1393
      },
      "odometer": 45000,
      "fuel_level": 75
    }
  ]
}
```

**Dados para Dashboard:**
- Total de veículos ativos
- Localização em tempo real
- Nível de combustível
- Quilometragem

#### 1.2 Viagens (Trips)
```
GET /trips?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
GET /trips/{vehicle_id}
```

**Response:**
```json
{
  "trips": [
    {
      "id": "trip123",
      "vehicle_id": "12345",
      "driver_id": "driver456",
      "start_time": "2025-01-15T08:00:00Z",
      "end_time": "2025-01-15T09:30:00Z",
      "distance_km": 25.5,
      "duration_minutes": 90,
      "start_location": {...},
      "end_location": {...},
      "max_speed": 120,
      "avg_speed": 45,
      "idle_time_minutes": 5
    }
  ],
  "summary": {
    "total_trips": 150,
    "total_distance_km": 3825,
    "total_duration_hours": 225
  }
}
```

**Dados para Dashboard:**
- Total de viagens
- Distância total percorrida
- Tempo total em operação
- Velocidade média
- Tempo ocioso

#### 1.3 Combustível
```
GET /fuel?vehicle_id={id}&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
GET /fuel/consumption
```

**Response:**
```json
{
  "fuel_data": [
    {
      "vehicle_id": "12345",
      "date": "2025-01-15",
      "fuel_consumed_liters": 45.5,
      "distance_km": 550,
      "consumption_per_100km": 8.3,
      "cost": 75.50
    }
  ],
  "summary": {
    "total_fuel_consumed": 1250,
    "total_cost": 2187.50,
    "avg_consumption": 8.5
  }
}
```

**Dados para Dashboard:**
- Consumo total de combustível
- Custo total de combustível
- Consumo médio (L/100km)
- Gastos por veículo

#### 1.4 Motoristas (Drivers)
```
GET /drivers
GET /drivers/{id}
POST /drivers
```

**Response:**
```json
{
  "drivers": [
    {
      "id": "driver123",
      "name": "João Silva",
      "license_number": "PT123456",
      "phone": "+351912345678",
      "email": "joao@example.com",
      "status": "active",
      "assigned_vehicle": "12345"
    }
  ]
}
```

**Dados para Dashboard:**
- Total de motoristas ativos
- Motoristas por veículo
- Performance individual

#### 1.5 Manutenção
```
GET /maintenance
GET /maintenance/reminders
POST /maintenance
```

**Response:**
```json
{
  "maintenance": [
    {
      "id": "maint123",
      "vehicle_id": "12345",
      "type": "oil_change",
      "date": "2025-01-10",
      "cost": 150.00,
      "odometer": 45000,
      "next_service_km": 50000
    }
  ],
  "reminders": [
    {
      "vehicle_id": "12345",
      "type": "inspection",
      "due_date": "2025-02-15",
      "due_km": 48000
    }
  ]
}
```

**Dados para Dashboard:**
- Custos de manutenção
- Próximas manutenções
- Alertas de serviço

### Implementação Cartrack

```typescript
// lib/integrations/cartrack/client.ts

import axios, { AxiosInstance } from 'axios';

export interface CartrackConfig {
  baseUrl: string;
  username: string;
  password: string;
}

export interface CartrackVehicle {
  id: string;
  registration: string;
  make: string;
  model: string;
  status: string;
  odometer: number;
  fuel_level: number;
}

export interface CartrackTrip {
  id: string;
  vehicle_id: string;
  start_time: string;
  end_time: string;
  distance_km: number;
  duration_minutes: number;
}

export interface CartrackMetrics {
  vehicles: {
    total: number;
    active: number;
    inactive: number;
  };
  trips: {
    total: number;
    total_distance_km: number;
    total_duration_hours: number;
  };
  fuel: {
    total_consumed_liters: number;
    total_cost: number;
    avg_consumption: number;
  };
  maintenance: {
    total_cost: number;
    upcoming_services: number;
  };
}

export class CartrackClient {
  private client: AxiosInstance;
  private auth: string;

  constructor(config: CartrackConfig) {
    this.auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.client.get('/vehicles/status');
      return {
        success: response.status === 200,
        error: response.status !== 200 ? 'Failed to connect' : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  }

  async getVehicles(): Promise<CartrackVehicle[]> {
    const response = await this.client.get('/vehicles');
    return response.data.vehicles || [];
  }

  async getTrips(startDate: string, endDate: string): Promise<CartrackTrip[]> {
    const response = await this.client.get('/trips', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data.trips || [];
  }

  async getFuelData(startDate: string, endDate: string) {
    const response = await this.client.get('/fuel', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  }

  async getMaintenanceData(startDate: string, endDate: string) {
    const response = await this.client.get('/maintenance', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  }

  async getMetrics(startDate: string, endDate: string): Promise<CartrackMetrics> {
    const [vehicles, trips, fuel, maintenance] = await Promise.all([
      this.getVehicles(),
      this.getTrips(startDate, endDate),
      this.getFuelData(startDate, endDate),
      this.getMaintenanceData(startDate, endDate),
    ]);

    return {
      vehicles: {
        total: vehicles.length,
        active: vehicles.filter(v => v.status === 'active').length,
        inactive: vehicles.filter(v => v.status !== 'active').length,
      },
      trips: {
        total: trips.length,
        total_distance_km: trips.reduce((sum, t) => sum + t.distance_km, 0),
        total_duration_hours: trips.reduce((sum, t) => sum + t.duration_minutes, 0) / 60,
      },
      fuel: {
        total_consumed_liters: fuel.summary?.total_fuel_consumed || 0,
        total_cost: fuel.summary?.total_cost || 0,
        avg_consumption: fuel.summary?.avg_consumption || 0,
      },
      maintenance: {
        total_cost: maintenance.reduce((sum: number, m: any) => sum + m.cost, 0),
        upcoming_services: maintenance.reminders?.length || 0,
      },
    };
  }
}

export function createCartrackClient(): CartrackClient {
  return new CartrackClient({
    baseUrl: process.env.CARTRACK_BASE_URL || 'https://fleetapi-pt.cartrack.com/rest',
    username: process.env.CARTRACK_USERNAME || '',
    password: process.env.CARTRACK_PASSWORD || '',
  });
}
```

---

## 2. Uber API

### Informações Gerais
- **Base URL**: `https://api.uber.com`
- **Autenticação**: OAuth 2.0
- **Documentação**: https://developer.uber.com/docs/

### Endpoints Importantes

#### 2.1 Viagens da Organização
```
GET /v1/organizations/{org_uuid}/trips
```

**Parameters:**
- `start_time`: Unix timestamp
- `end_time`: Unix timestamp
- `limit`: 50 (default)
- `offset`: 0

**Response:**
```json
{
  "trips": [
    {
      "trip_id": "abc123",
      "status": "completed",
      "fare": {
        "value": 25.50,
        "currency_code": "EUR"
      },
      "distance": 15.5,
      "duration": 1800,
      "start_time": 1705320000,
      "end_time": 1705321800,
      "driver": {
        "name": "João Silva",
        "rating": 4.8
      }
    }
  ],
  "count": 150,
  "offset": 0,
  "limit": 50
}
```

**Dados para Dashboard:**
- Total de viagens
- Receita total
- Ticket médio
- Distância total

#### 2.2 Ganhos
```
GET /v1/organizations/{org_uuid}/earnings
```

**Response:**
```json
{
  "earnings": {
    "total": 12500.00,
    "currency": "EUR",
    "breakdown": {
      "fares": 15000.00,
      "fees": -2500.00
    }
  }
}
```

### Implementação Uber

```typescript
// lib/integrations/uber/client.ts

export class UberClient {
  private accessToken: string = '';

  async authenticate() {
    // OAuth 2.0 flow
    const response = await axios.post('https://login.uber.com/oauth/v2/token', {
      client_id: process.env.UBER_CLIENT_ID,
      client_secret: process.env.UBER_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'business.trips business.earnings'
    });
    this.accessToken = response.data.access_token;
  }

  async getTrips(startDate: string, endDate: string) {
    const startTime = new Date(startDate).getTime() / 1000;
    const endTime = new Date(endDate).getTime() / 1000;
    
    const response = await axios.get(
      `https://api.uber.com/v1/organizations/${process.env.UBER_ORG_UUID}/trips`,
      {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        params: { start_time: startTime, end_time: endTime, limit: 1000 }
      }
    );
    
    return response.data.trips;
  }

  async getMetrics(startDate: string, endDate: string) {
    const trips = await this.getTrips(startDate, endDate);
    
    return {
      total_trips: trips.length,
      total_earnings: trips.reduce((sum: number, t: any) => sum + (t.fare?.value || 0), 0),
      total_distance: trips.reduce((sum: number, t: any) => sum + (t.distance || 0), 0),
      avg_fare: trips.length > 0 
        ? trips.reduce((sum: number, t: any) => sum + (t.fare?.value || 0), 0) / trips.length 
        : 0,
    };
  }
}
```

---

## 3. Bolt API

### Informações Gerais
- **Base URL**: `https://api.bolt.eu` (ou similar)
- **Autenticação**: API Key ou OAuth
- **Nota**: Bolt não tem API pública oficial, pode ser necessário web scraping ou acesso via painel

### Abordagem Alternativa: Web Scraping

```typescript
// lib/integrations/bolt/client.ts

import puppeteer from 'puppeteer';

export class BoltClient {
  private email: string;
  private password: string;

  constructor(config: { email: string; password: string }) {
    this.email = config.email;
    this.password = config.password;
  }

  async login() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://fleet.bolt.eu/login');
    await page.type('#email', this.email);
    await page.type('#password', this.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    return { browser, page };
  }

  async getTrips(startDate: string, endDate: string) {
    const { browser, page } = await this.login();
    
    await page.goto(`https://fleet.bolt.eu/trips?from=${startDate}&to=${endDate}`);
    await page.waitForSelector('.trips-table');
    
    const trips = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.trips-table tr'));
      return rows.map(row => ({
        date: row.querySelector('.date')?.textContent,
        driver: row.querySelector('.driver')?.textContent,
        fare: parseFloat(row.querySelector('.fare')?.textContent?.replace('€', '') || '0'),
        distance: parseFloat(row.querySelector('.distance')?.textContent?.replace('km', '') || '0'),
      }));
    });
    
    await browser.close();
    return trips;
  }

  async getMetrics(startDate: string, endDate: string) {
    const trips = await this.getTrips(startDate, endDate);
    
    return {
      total_trips: trips.length,
      total_earnings: trips.reduce((sum, t) => sum + t.fare, 0),
      total_distance: trips.reduce((sum, t) => sum + t.distance, 0),
    };
  }
}
```

---

## 4. ViaVerde API

### Informações Gerais
- **Portal**: https://www.viaverde.pt
- **Autenticação**: Login via portal
- **Dados**: Transações de portagens, estacionamento, combustível

### Implementação ViaVerde

```typescript
// lib/integrations/viaverde/client.ts

export class ViaVerdeClient {
  async login() {
    // Puppeteer para fazer login no portal
  }

  async getTransactions(startDate: string, endDate: string) {
    // Buscar transações do período
    return [
      {
        date: '2025-01-15',
        type: 'toll', // toll, parking, fuel
        amount: 5.50,
        location: 'A1 Lisboa-Porto',
        vehicle: 'AB-12-CD'
      }
    ];
  }

  async getMetrics(startDate: string, endDate: string) {
    const transactions = await this.getTransactions(startDate, endDate);
    
    return {
      total_transactions: transactions.length,
      total_spent: transactions.reduce((sum, t) => sum + t.amount, 0),
      by_type: {
        tolls: transactions.filter(t => t.type === 'toll').reduce((sum, t) => sum + t.amount, 0),
        parking: transactions.filter(t => t.type === 'parking').reduce((sum, t) => sum + t.amount, 0),
        fuel: transactions.filter(t => t.type === 'fuel').reduce((sum, t) => sum + t.amount, 0),
      }
    };
  }
}
```

---

## 5. FONOA API

### Informações Gerais
- **Serviço**: Gestão fiscal e faturas
- **Portal**: https://www.fonoa.com
- **Dados**: Faturas emitidas, impostos pagos

### Implementação FONOA

```typescript
// lib/integrations/fonoa/client.ts

export class FONOAClient {
  async getInvoices(startDate: string, endDate: string) {
    return [
      {
        invoice_number: 'INV-2025-001',
        date: '2025-01-15',
        amount: 1250.00,
        tax: 287.50,
        total: 1537.50,
        status: 'paid'
      }
    ];
  }

  async getMetrics(startDate: string, endDate: string) {
    const invoices = await this.getInvoices(startDate, endDate);
    
    return {
      total_invoices: invoices.length,
      total_invoiced: invoices.reduce((sum, i) => sum + i.amount, 0),
      total_tax: invoices.reduce((sum, i) => sum + i.tax, 0),
      total_received: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    };
  }
}
```

---

## 6. myprio API

### Informações Gerais
- **Serviço**: Gestão de despesas
- **Account ID**: 606845
- **Dados**: Despesas por categoria

### Implementação myprio

```typescript
// lib/integrations/myprio/client.ts

export class MyprioClient {
  async getExpenses(startDate: string, endDate: string) {
    return [
      {
        date: '2025-01-15',
        category: 'fuel',
        amount: 75.50,
        vehicle: 'AB-12-CD',
        description: 'Abastecimento'
      },
      {
        date: '2025-01-16',
        category: 'maintenance',
        amount: 150.00,
        vehicle: 'AB-12-CD',
        description: 'Mudança de óleo'
      }
    ];
  }

  async getMetrics(startDate: string, endDate: string) {
    const expenses = await this.getExpenses(startDate, endDate);
    
    return {
      total_expenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      by_category: {
        fuel: expenses.filter(e => e.category === 'fuel').reduce((sum, e) => sum + e.amount, 0),
        maintenance: expenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
        tolls: expenses.filter(e => e.category === 'tolls').reduce((sum, e) => sum + e.amount, 0),
        insurance: expenses.filter(e => e.category === 'insurance').reduce((sum, e) => sum + e.amount, 0),
        other: expenses.filter(e => e.category === 'other').reduce((sum, e) => sum + e.amount, 0),
      }
    };
  }
}
```

---

## 7. API Consolidada de Métricas

### Endpoint Unificado

```typescript
// pages/api/admin/metrics/unified.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '@/lib/session';
import { createCartrackClient } from '@/lib/integrations/cartrack/client';
import { createUberClient } from '@/lib/integrations/uber/client';
import { createBoltClient } from '@/lib/integrations/bolt/client';
import { createViaVerdeClient } from '@/lib/integrations/viaverde/client';
import { createFONOAClient } from '@/lib/integrations/fonoa/client';
import { createMyprioClient } from '@/lib/integrations/myprio/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession(req, res);
  if (!session?.user || session.user.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    // Criar clientes
    const cartrack = createCartrackClient();
    const uber = createUberClient();
    const bolt = createBoltClient();
    const viaverde = createViaVerdeClient();
    const fonoa = createFONOAClient();
    const myprio = createMyprioClient();

    // Buscar dados em paralelo
    const [
      cartrackData,
      uberData,
      boltData,
      viaverdeData,
      fonoaData,
      myprioData,
    ] = await Promise.allSettled([
      cartrack.getMetrics(startDate as string, endDate as string),
      uber.getMetrics(startDate as string, endDate as string),
      bolt.getMetrics(startDate as string, endDate as string),
      viaverde.getMetrics(startDate as string, endDate as string),
      fonoa.getMetrics(startDate as string, endDate as string),
      myprio.getMetrics(startDate as string, endDate as string),
    ]);

    // Processar resultados
    const platforms = {
      cartrack: cartrackData.status === 'fulfilled' ? cartrackData.value : null,
      uber: uberData.status === 'fulfilled' ? uberData.value : null,
      bolt: boltData.status === 'fulfilled' ? boltData.value : null,
      viaverde: viaverdeData.status === 'fulfilled' ? viaverdeData.value : null,
      fonoa: fonoaData.status === 'fulfilled' ? fonoaData.value : null,
      myprio: myprioData.status === 'fulfilled' ? myprioData.value : null,
    };

    // Consolidar métricas
    const summary = {
      // Receitas (Uber + Bolt)
      totalEarnings: 
        (platforms.uber?.total_earnings || 0) + 
        (platforms.bolt?.total_earnings || 0),

      // Despesas (ViaVerde + myprio + Cartrack manutenção)
      totalExpenses: 
        (platforms.viaverde?.total_spent || 0) + 
        (platforms.myprio?.total_expenses || 0) + 
        (platforms.cartrack?.maintenance?.total_cost || 0),

      // Lucro
      netProfit: 0, // Calculado abaixo

      // Viagens
      totalTrips: 
        (platforms.uber?.total_trips || 0) + 
        (platforms.bolt?.total_trips || 0),

      // Frota
      activeVehicles: platforms.cartrack?.vehicles?.active || 0,

      // Motoristas (estimativa baseada em viagens)
      activeDrivers: Math.ceil(
        ((platforms.uber?.total_trips || 0) + (platforms.bolt?.total_trips || 0)) / 50
      ),
    };

    summary.netProfit = summary.totalEarnings - summary.totalExpenses;

    // Erros
    const errors = [];
    if (cartrackData.status === 'rejected') errors.push({ platform: 'cartrack', error: cartrackData.reason });
    if (uberData.status === 'rejected') errors.push({ platform: 'uber', error: uberData.reason });
    if (boltData.status === 'rejected') errors.push({ platform: 'bolt', error: boltData.reason });
    if (viaverdeData.status === 'rejected') errors.push({ platform: 'viaverde', error: viaverdeData.reason });
    if (fonoaData.status === 'rejected') errors.push({ platform: 'fonoa', error: fonoaData.reason });
    if (myprioData.status === 'rejected') errors.push({ platform: 'myprio', error: myprioData.reason });

    return res.status(200).json({
      success: true,
      data: {
        summary,
        platforms,
        errors,
      },
    });
  } catch (error: any) {
    console.error('Error fetching unified metrics:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch metrics',
    });
  }
}
```

---

## 8. Dados para o Dashboard

### Métricas Consolidadas

```typescript
interface DashboardMetrics {
  // KPIs Financeiros
  totalEarnings: number;        // Uber + Bolt
  totalExpenses: number;        // ViaVerde + myprio + Cartrack
  netProfit: number;            // Earnings - Expenses
  profitMargin: number;         // (netProfit / totalEarnings) * 100

  // KPIs Operacionais
  totalTrips: number;           // Uber + Bolt
  avgFare: number;              // totalEarnings / totalTrips
  totalDistance: number;        // Cartrack
  activeVehicles: number;       // Cartrack
  activeDrivers: number;        // Estimativa

  // Breakdown de Despesas
  expenses: {
    fuel: number;               // myprio + ViaVerde
    tolls: number;              // ViaVerde
    maintenance: number;        // Cartrack + myprio
    insurance: number;          // myprio
    parking: number;            // ViaVerde
    other: number;              // myprio
  };

  // Breakdown de Receitas
  earnings: {
    uber: number;
    bolt: number;
  };

  // Performance da Frota
  fleet: {
    total_vehicles: number;
    active_vehicles: number;
    utilization_rate: number;   // %
    avg_km_per_vehicle: number;
    avg_trips_per_vehicle: number;
  };
}
```

---

## 9. Checklist de Implementação

### Fase 1: Cartrack (Prioridade Alta)
- [ ] Criar cliente Cartrack com autenticação Basic Auth
- [ ] Implementar endpoint `/vehicles`
- [ ] Implementar endpoint `/trips`
- [ ] Implementar endpoint `/fuel`
- [ ] Implementar endpoint `/maintenance`
- [ ] Testar conexão com credenciais reais
- [ ] Implementar método `getMetrics()`

### Fase 2: Uber (Prioridade Alta)
- [ ] Configurar OAuth 2.0
- [ ] Implementar autenticação
- [ ] Implementar endpoint de viagens
- [ ] Implementar endpoint de ganhos
- [ ] Testar com credenciais reais
- [ ] Implementar método `getMetrics()`

### Fase 3: Bolt (Prioridade Média)
- [ ] Pesquisar API oficial ou alternativas
- [ ] Implementar web scraping se necessário
- [ ] Buscar dados de viagens
- [ ] Buscar dados de ganhos
- [ ] Implementar método `getMetrics()`

### Fase 4: ViaVerde (Prioridade Média)
- [ ] Implementar login no portal
- [ ] Buscar transações
- [ ] Categorizar despesas (portagens, parking, combustível)
- [ ] Implementar método `getMetrics()`

### Fase 5: FONOA (Prioridade Baixa)
- [ ] Implementar acesso ao portal
- [ ] Buscar faturas
- [ ] Calcular impostos
- [ ] Implementar método `getMetrics()`

### Fase 6: myprio (Prioridade Média)
- [ ] Implementar acesso à plataforma
- [ ] Buscar despesas por categoria
- [ ] Implementar método `getMetrics()`

### Fase 7: API Unificada
- [ ] Criar endpoint `/api/admin/metrics/unified`
- [ ] Implementar chamadas paralelas
- [ ] Consolidar dados
- [ ] Tratar erros individuais
- [ ] Retornar métricas consolidadas

### Fase 8: Dashboard
- [ ] Atualizar dashboard para consumir API unificada
- [ ] Exibir KPIs financeiros
- [ ] Exibir KPIs operacionais
- [ ] Exibir status das integrações
- [ ] Exibir alertas de erros

---

## 10. Exemplo de Uso no Dashboard

```typescript
// pages/admin/index.tsx

const [metrics, setMetrics] = useState<any>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchMetrics() {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    try {
      const response = await fetch(
        `/api/admin/metrics/unified?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  fetchMetrics();
}, []);

// Usar metrics.summary para exibir KPIs
// metrics.summary.totalEarnings
// metrics.summary.totalExpenses
// metrics.summary.netProfit
// etc.
```

---

## 11. Testes

### Testar Cada Integração

```bash
# Cartrack
curl -X GET "https://fleetapi-pt.cartrack.com/rest/vehicles" \
  -H "Authorization: Basic $(echo -n 'ALVO00008:Alvorada2025@' | base64)"

# Uber (após obter token)
curl -X GET "https://api.uber.com/v1/organizations/{org_uuid}/trips" \
  -H "Authorization: Bearer {access_token}"
```

### Testar API Unificada

```bash
curl -X GET "http://localhost:3000/api/admin/metrics/unified?startDate=2025-01-01&endDate=2025-01-31" \
  -H "Cookie: conduz-session=..."
```

---

## 12. Notas Importantes

1. **Cartrack** tem API oficial bem documentada - **PRIORIDADE 1**
2. **Uber** tem API oficial mas requer OAuth - **PRIORIDADE 1**
3. **Bolt** pode não ter API pública - considerar web scraping
4. **ViaVerde, FONOA, myprio** provavelmente requerem web scraping
5. Implementar cache para não sobrecarregar APIs
6. Implementar retry logic para chamadas que falharem
7. Logs detalhados para debug
8. Tratamento de erros robusto
9. Dados mock para desenvolvimento/testes

---

## Conclusão

Este prompt fornece toda a estrutura necessária para integrar as 6 plataformas no dashboard do Conduz PT. Comece pelo Cartrack (API oficial) e Uber (API oficial), depois avance para as outras plataformas que podem requerer web scraping.
