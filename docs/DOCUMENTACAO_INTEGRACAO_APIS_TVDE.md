# 📊 Documentação Completa: Integração APIs para Dashboard TVDE

**Projeto:** Conduz PT - Sistema de Gestão TVDE  
**Objetivo:** Integrar 6 plataformas para métricas unificadas  
**Data:** Janeiro 2025  
**Prioridade:** Uber, Bolt, Cartrack (APIs oficiais)

---

## 🎯 Resumo Executivo

### Plataformas e Status

| Plataforma | API Oficial | Método | Prioridade | Dificuldade |
|------------|-------------|--------|------------|-------------|
| **Uber** | ✅ Sim | REST API | 🔴 Alta | Média |
| **Bolt** | ❌ Não | Web Scraping | 🔴 Alta | Alta |
| **Cartrack** | ✅ Sim | REST API | 🔴 Alta | Baixa |
| **FONOA** | ✅ Sim | REST API | 🟡 Média | Baixa |
| **ViaVerde** | ❌ Não | Web Scraping | 🟡 Média | Média |
| **myprio** | ❌ Não | Web Scraping | 🟡 Média | Média |

---

## 1️⃣ UBER - API Oficial (Prioridade 1)

### 📋 Informações Gerais

**Documentação:** https://developer.uber.com/docs/businesses/introduction  
**Tipo:** REST API  
**Autenticação:** OAuth 2.0  
**Requisito:** Conta Uber for Business Enterprise  

### 🔑 Credenciais Fornecidas
```
Email: info@alvoradamagistral.eu
Senha: Alvorada@25
```

### 📡 APIs Disponíveis

#### **Receipts API** (Recomendado)
- **Endpoint Base:** `https://api.uber.com/v1/businesses`
- **Funcionalidade:** Dados de viagens em tempo real
- **Dados Disponíveis:**
  - ✅ Viagens completas
  - ✅ Ganhos por viagem
  - ✅ Gorjetas
  - ✅ Portagens
  - ✅ Data/hora
  - ✅ Origem/destino
  - ✅ Motorista
  - ✅ Status da viagem

#### **SFTP Data Automation** (Alternativa)
- **Funcionalidade:** Sincronização em massa via SFTP
- **Dados Disponíveis:**
  - Lista de empregados
  - Códigos de despesa
  - Dados transacionais em bulk

### 🔐 Autenticação

```typescript
// 1. Registrar app no Developer Dashboard
// 2. Obter Client ID e Client Secret
// 3. Implementar OAuth 2.0

const getAccessToken = async () => {
  const response = await fetch('https://login.uber.com/oauth/v2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.UBER_CLIENT_ID,
      client_secret: process.env.UBER_CLIENT_SECRET,
      grant_type: 'client_credentials',
      scope: 'receipts'
    })
  });
  
  const data = await response.json();
  return data.access_token;
};
```

### 📊 Endpoints Principais

#### 1. Listar Viagens
```typescript
GET /v1/businesses/receipts
Headers:
  Authorization: Bearer {access_token}
  
Query Parameters:
  start_date: string (YYYY-MM-DD)
  end_date: string (YYYY-MM-DD)
  limit: number (max 100)
  offset: number

Response:
{
  "receipts": [
    {
      "receipt_id": "abc123",
      "trip_id": "trip_xyz",
      "request_time": "2025-01-15T10:30:00Z",
      "dropoff_time": "2025-01-15T11:00:00Z",
      "distance": "15.5",
      "distance_unit": "km",
      "duration": "1800",
      "fare": {
        "subtotal": "25.00",
        "tip": "5.00",
        "tolls": "2.50",
        "total": "32.50",
        "currency_code": "EUR"
      },
      "driver": {
        "name": "João Silva",
        "phone": "+351912345678"
      },
      "start_location": {
        "address": "Rua X, Porto",
        "latitude": 41.1579,
        "longitude": -8.6291
      },
      "end_location": {
        "address": "Rua Y, Porto",
        "latitude": 41.1496,
        "longitude": -8.6109
      }
    }
  ],
  "count": 50,
  "limit": 100,
  "offset": 0
}
```

#### 2. Detalhes de Viagem Específica
```typescript
GET /v1/businesses/receipts/{receipt_id}
Headers:
  Authorization: Bearer {access_token}

Response:
{
  "receipt_id": "abc123",
  "trip_id": "trip_xyz",
  // ... dados completos da viagem
}
```

### 💾 Dados para Dashboard

```typescript
interface UberTrip {
  id: string;
  driverId: string;
  driverName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // segundos
  distance: number; // km
  fare: number; // EUR
  tip: number; // EUR
  tolls: number; // EUR
  total: number; // EUR
  origin: string;
  destination: string;
}

// Métricas Calculadas
interface UberMetrics {
  totalTrips: number;
  totalEarnings: number; // fare + tip
  totalTips: number;
  totalTolls: number;
  averageFare: number;
  totalDistance: number;
  totalDuration: number; // horas
}
```

### ⚠️ Limitações e Considerações

1. **Acesso Restrito:** Apenas para clientes Uber for Business Enterprise
2. **Rate Limiting:** Máximo 100 viagens por request
3. **Delay:** Dados podem ter atraso de até 24h
4. **Escopo:** Apenas viagens business (não pessoais)

### 📝 Implementação Recomendada

```typescript
// lib/integrations/uber/client-business.ts
export class UberBusinessClient {
  private accessToken: string;
  
  async authenticate() {
    // Implementar OAuth 2.0
  }
  
  async getTrips(startDate: string, endDate: string) {
    const trips = [];
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetch(
        `https://api.uber.com/v1/businesses/receipts?` +
        `start_date=${startDate}&end_date=${endDate}&limit=100&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      const data = await response.json();
      trips.push(...data.receipts);
      
      hasMore = data.receipts.length === 100;
      offset += 100;
    }
    
    return trips;
  }
  
  async getMetrics(startDate: string, endDate: string): Promise<UberMetrics> {
    const trips = await this.getTrips(startDate, endDate);
    
    return {
      totalTrips: trips.length,
      totalEarnings: trips.reduce((sum, t) => sum + parseFloat(t.fare.subtotal) + parseFloat(t.fare.tip), 0),
      totalTips: trips.reduce((sum, t) => sum + parseFloat(t.fare.tip), 0),
      totalTolls: trips.reduce((sum, t) => sum + parseFloat(t.fare.tolls), 0),
      averageFare: trips.reduce((sum, t) => sum + parseFloat(t.fare.subtotal), 0) / trips.length,
      totalDistance: trips.reduce((sum, t) => sum + parseFloat(t.distance), 0),
      totalDuration: trips.reduce((sum, t) => sum + parseInt(t.duration), 0) / 3600
    };
  }
}
```

---

## 2️⃣ BOLT - Web Scraping (Prioridade 1)

### 📋 Informações Gerais

**Portal:** https://fleet.bolt.eu  
**Tipo:** Web Scraping (Puppeteer/Playwright)  
**Autenticação:** Login via formulário  
**API Oficial:** ❌ Não disponível para fleet management  

### 🔑 Credenciais Fornecidas
```
Email: caroline@alvoradamagistral.eu
Senha: Muffin@2017
```

### 🎯 Dados Disponíveis (via Scraping)

- ✅ Viagens por motorista
- ✅ Ganhos totais
- ✅ Gorjetas
- ✅ Comissões
- ✅ Data/hora das viagens
- ✅ Status do motorista

### 🔐 Fluxo de Autenticação

```typescript
import puppeteer from 'puppeteer';

export class BoltScraperClient {
  private browser: any;
  private page: any;
  
  async authenticate() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // 1. Navegar para login
    await this.page.goto('https://fleet.bolt.eu/login');
    
    // 2. Preencher formulário
    await this.page.type('input[name="email"]', 'caroline@alvoradamagistral.eu');
    await this.page.type('input[name="password"]', 'Muffin@2017');
    
    // 3. Submeter
    await this.page.click('button[type="submit"]');
    
    // 4. Aguardar redirecionamento
    await this.page.waitForNavigation();
    
    // 5. Verificar se logou
    const isLoggedIn = await this.page.$('div[class*="dashboard"]');
    
    if (!isLoggedIn) {
      throw new Error('Bolt login failed');
    }
  }
  
  async getTrips(startDate: string, endDate: string) {
    // Navegar para página de viagens
    await this.page.goto('https://fleet.bolt.eu/trips');
    
    // Aplicar filtros de data
    await this.page.select('select[name="start_date"]', startDate);
    await this.page.select('select[name="end_date"]', endDate);
    await this.page.click('button[class*="apply-filter"]');
    
    // Aguardar carregamento
    await this.page.waitForSelector('table[class*="trips-table"]');
    
    // Extrair dados
    const trips = await this.page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        return {
          date: cells[0]?.textContent?.trim(),
          driverName: cells[1]?.textContent?.trim(),
          trips: parseInt(cells[2]?.textContent?.trim() || '0'),
          earnings: parseFloat(cells[3]?.textContent?.replace('€', '').trim() || '0'),
          tips: parseFloat(cells[4]?.textContent?.replace('€', '').trim() || '0'),
          total: parseFloat(cells[5]?.textContent?.replace('€', '').trim() || '0')
        };
      });
    });
    
    return trips;
  }
  
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
```

### 💾 Dados para Dashboard

```typescript
interface BoltTrip {
  date: string;
  driverId: string;
  driverName: string;
  trips: number;
  earnings: number;
  tips: number;
  total: number;
}

interface BoltMetrics {
  totalTrips: number;
  totalEarnings: number;
  totalTips: number;
  averageEarningsPerTrip: number;
}
```

### ⚠️ Limitações e Considerações

1. **Fragilidade:** Scraping quebra se o site mudar
2. **Performance:** Mais lento que API
3. **Manutenção:** Requer atualizações frequentes
4. **Rate Limiting:** Evitar muitas requisições
5. **CAPTCHA:** Pode aparecer, requer tratamento

### 📝 Implementação Recomendada

- Usar **Puppeteer** ou **Playwright**
- Implementar **retry logic**
- Adicionar **delays** entre requests
- Salvar **cookies** para evitar re-login
- Implementar **error handling** robusto

---

## 3️⃣ CARTRACK - API Oficial (Prioridade 1)

### 📋 Informações Gerais

**Documentação:** https://fleetapi-pt.cartrack.com/rest/redoc.php  
**Tipo:** REST API  
**Autenticação:** Basic Auth  
**Região:** Portugal  

### 🔑 Credenciais Fornecidas
```
Username: ALVO00008
Password: Alvorada2025@
```

### 📡 APIs Disponíveis

#### **Base URL**
```
https://fleetapi-pt.cartrack.com/rest
```

#### **Endpoints Principais**

1. **Veículos**
   - `GET /vehicles` - Listar todos os veículos
   - `GET /vehicles/{id}` - Detalhes de um veículo
   - `GET /vehicles/{id}/position` - Posição atual

2. **Viagens**
   - `GET /trips` - Listar viagens
   - `GET /trips/{id}` - Detalhes de uma viagem
   - `GET /trips/summary` - Resumo de viagens

3. **Combustível**
   - `GET /fuel/consumption` - Consumo de combustível
   - `GET /fuel/transactions` - Transações de abastecimento

4. **Manutenção**
   - `GET /maintenance/schedule` - Agenda de manutenção
   - `GET /maintenance/history` - Histórico

5. **Motoristas**
   - `GET /drivers` - Listar motoristas
   - `GET /drivers/{id}/trips` - Viagens de um motorista

### 🔐 Autenticação

```typescript
// Basic Auth
const auth = Buffer.from('ALVO00008:Alvorada2025@').toString('base64');

const headers = {
  'Authorization': `Basic ${auth}`,
  'Content-Type': 'application/json'
};
```

### 📊 Exemplo de Implementação

```typescript
export class CartrackClient {
  private baseUrl = 'https://fleetapi-pt.cartrack.com/rest';
  private auth: string;
  
  constructor() {
    this.auth = Buffer.from('ALVO00008:Alvorada2025@').toString('base64');
  }
  
  private async request(endpoint: string, params?: any) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.keys(params).forEach(key => 
        url.searchParams.append(key, params[key])
      );
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Cartrack API error: ${response.status}`);
    }
    
    return response.json();
  }
  
  async getVehicles() {
    return this.request('/vehicles');
  }
  
  async getTrips(startDate: string, endDate: string) {
    return this.request('/trips', {
      start_date: startDate,
      end_date: endDate
    });
  }
  
  async getFuelConsumption(vehicleId: string, startDate: string, endDate: string) {
    return this.request('/fuel/consumption', {
      vehicle_id: vehicleId,
      start_date: startDate,
      end_date: endDate
    });
  }
  
  async getMetrics(startDate: string, endDate: string) {
    const [vehicles, trips, fuel] = await Promise.all([
      this.getVehicles(),
      this.getTrips(startDate, endDate),
      this.getFuelConsumption('all', startDate, endDate)
    ]);
    
    return {
      activeVehicles: vehicles.filter((v: any) => v.status === 'active').length,
      totalVehicles: vehicles.length,
      totalTrips: trips.length,
      totalDistance: trips.reduce((sum: number, t: any) => sum + t.distance, 0),
      totalFuelCost: fuel.reduce((sum: number, f: any) => sum + f.cost, 0),
      averageFuelConsumption: fuel.reduce((sum: number, f: any) => sum + f.consumption, 0) / fuel.length
    };
  }
}
```

### 💾 Dados para Dashboard

```typescript
interface CartrackVehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  status: 'active' | 'inactive' | 'maintenance';
  currentLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface CartrackTrip {
  id: string;
  vehicleId: string;
  driverId: string;
  startTime: string;
  endTime: string;
  distance: number; // km
  duration: number; // minutos
  maxSpeed: number;
  averageSpeed: number;
  idleTime: number; // minutos
}

interface CartrackMetrics {
  activeVehicles: number;
  totalVehicles: number;
  totalDistance: number;
  totalFuelCost: number;
  averageFuelConsumption: number; // L/100km
}
```

### ⚠️ Limitações e Considerações

1. **Rate Limiting:** Verificar limites na documentação
2. **Dados em Tempo Real:** Posição atualizada a cada 30s-1min
3. **Histórico:** Dados disponíveis por até 90 dias

---

## 4️⃣ FONOA - API Oficial (Prioridade 2)

### 📋 Informações Gerais

**Documentação:** https://docs.fonoa.com  
**Tipo:** REST API  
**Autenticação:** API Key  
**Funcionalidade:** Faturas e impostos  

### 🔑 Credenciais Fornecidas
```
Email: info@alvoradamagistral.eu
Senha: Muffin@2017
```

### 📡 Endpoints Principais

```typescript
// Base URL
https://api.fonoa.com/v1

// Endpoints
GET /transactions - Listar transações
GET /transactions/{id} - Detalhes de transação
GET /invoices - Listar faturas
GET /invoices/{id} - Detalhes de fatura
```

### 🔐 Autenticação

```typescript
const headers = {
  'Authorization': `Bearer ${process.env.FONOA_API_KEY}`,
  'Content-Type': 'application/json'
};
```

### 📊 Implementação

```typescript
export class FonoaClient {
  private baseUrl = 'https://api.fonoa.com/v1';
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async getInvoices(startDate: string, endDate: string) {
    const response = await fetch(
      `${this.baseUrl}/invoices?start_date=${startDate}&end_date=${endDate}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.json();
  }
  
  async getMetrics(startDate: string, endDate: string) {
    const invoices = await this.getInvoices(startDate, endDate);
    
    return {
      totalInvoices: invoices.length,
      totalTaxes: invoices.reduce((sum: number, i: any) => sum + i.tax_amount, 0),
      totalAmount: invoices.reduce((sum: number, i: any) => sum + i.total_amount, 0)
    };
  }
}
```

### 💾 Dados para Dashboard

```typescript
interface FonoaMetrics {
  totalInvoices: number;
  totalTaxes: number;
  totalAmount: number;
}
```

---

## 5️⃣ VIAVERDE - Web Scraping (Prioridade 2)

### 📋 Informações Gerais

**Portal:** https://www.viaverde.pt  
**Tipo:** Web Scraping  
**Autenticação:** Login via formulário  

### 🔑 Credenciais Fornecidas
```
Email: info@alvoradamagistral.eu
Senha: Alvorada2025@
```

### 🎯 Dados Disponíveis

- ✅ Transações de portagens
- ✅ Estacionamento
- ✅ Combustível
- ✅ Data e valor

### 📊 Implementação (Similar ao Bolt)

```typescript
export class ViaVerdeScraperClient {
  // Implementação similar ao BoltScraperClient
  // com ajustes para o portal ViaVerde
}
```

---

## 6️⃣ MYPRIO - Web Scraping (Prioridade 2)

### 📋 Informações Gerais

**Portal:** https://myprio.com (verificar URL exata)  
**Tipo:** Web Scraping  
**Autenticação:** Login  

### 🔑 Credenciais Fornecidas
```
Username: 606845
Senha: Alvorada25@
```

### 🎯 Dados Disponíveis

- ✅ Despesas por categoria
- ✅ Combustível
- ✅ Manutenção
- ✅ Outros custos

---

## 🔄 Integração Unificada

### Arquitetura Proposta

```typescript
// lib/sync/unified-sync.ts

export class UnifiedSyncService {
  private uber: UberBusinessClient;
  private bolt: BoltScraperClient;
  private cartrack: CartrackClient;
  private fonoa: FonoaClient;
  private viaverde: ViaVerdeScraperClient;
  private myprio: MyprioScraperClient;
  
  async syncAll(startDate: string, endDate: string) {
    const results = await Promise.allSettled([
      this.syncUber(startDate, endDate),
      this.syncBolt(startDate, endDate),
      this.syncCartrack(startDate, endDate),
      this.syncFonoa(startDate, endDate),
      this.syncViaVerde(startDate, endDate),
      this.syncMyprio(startDate, endDate)
    ]);
    
    return {
      uber: results[0].status === 'fulfilled' ? results[0].value : null,
      bolt: results[1].status === 'fulfilled' ? results[1].value : null,
      cartrack: results[2].status === 'fulfilled' ? results[2].value : null,
      fonoa: results[3].status === 'fulfilled' ? results[3].value : null,
      viaverde: results[4].status === 'fulfilled' ? results[4].value : null,
      myprio: results[5].status === 'fulfilled' ? results[5].value : null,
      errors: results
        .map((r, i) => ({ platform: ['uber', 'bolt', 'cartrack', 'fonoa', 'viaverde', 'myprio'][i], error: r.status === 'rejected' ? r.reason : null }))
        .filter(e => e.error)
    };
  }
  
  async getUnifiedMetrics(startDate: string, endDate: string) {
    const data = await this.syncAll(startDate, endDate);
    
    return {
      // Receitas (Uber + Bolt)
      totalEarnings: (data.uber?.totalEarnings || 0) + (data.bolt?.totalEarnings || 0),
      totalTrips: (data.uber?.totalTrips || 0) + (data.bolt?.totalTrips || 0),
      totalTips: (data.uber?.totalTips || 0) + (data.bolt?.totalTips || 0),
      
      // Despesas (Cartrack + ViaVerde + myprio)
      totalFuelCost: (data.cartrack?.totalFuelCost || 0) + (data.myprio?.fuelCost || 0),
      totalTollsCost: (data.uber?.totalTolls || 0) + (data.viaverde?.totalTolls || 0),
      totalMaintenanceCost: data.myprio?.maintenanceCost || 0,
      totalTaxes: data.fonoa?.totalTaxes || 0,
      
      // Frota (Cartrack)
      activeVehicles: data.cartrack?.activeVehicles || 0,
      totalDistance: data.cartrack?.totalDistance || 0,
      
      // Lucro
      netProfit: function() {
        const revenue = this.totalEarnings + this.totalTips;
        const expenses = this.totalFuelCost + this.totalTollsCost + this.totalMaintenanceCost + this.totalTaxes;
        return revenue - expenses;
      }
    };
  }
}
```

### API Endpoint

```typescript
// pages/api/admin/metrics/unified.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Missing date parameters' });
  }
  
  try {
    const syncService = new UnifiedSyncService();
    const metrics = await syncService.getUnifiedMetrics(
      startDate as string,
      endDate as string
    );
    
    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Unified sync error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to sync metrics'
    });
  }
}
```

---

## 📦 Variáveis de Ambiente

```env
# Uber
UBER_CLIENT_ID=your_client_id
UBER_CLIENT_SECRET=your_client_secret
UBER_EMAIL=info@alvoradamagistral.eu
UBER_PASSWORD=Alvorada@25

# Bolt (Scraping)
BOLT_EMAIL=caroline@alvoradamagistral.eu
BOLT_PASSWORD=Muffin@2017

# Cartrack
CARTRACK_USERNAME=ALVO00008
CARTRACK_PASSWORD=Alvorada2025@

# FONOA
FONOA_API_KEY=your_api_key
FONOA_EMAIL=info@alvoradamagistral.eu
FONOA_PASSWORD=Muffin@2017

# ViaVerde (Scraping)
VIAVERDE_EMAIL=info@alvoradamagistral.eu
VIAVERDE_PASSWORD=Alvorada2025@

# myprio (Scraping)
MYPRIO_USERNAME=606845
MYPRIO_PASSWORD=Alvorada25@
```

---

## 🚀 Plano de Implementação

### Fase 1: APIs Oficiais (1-2 semanas)
1. ✅ **Uber** - Receipts API
2. ✅ **Cartrack** - Fleet API
3. ✅ **FONOA** - Invoices API

### Fase 2: Web Scraping (2-3 semanas)
4. ⚠️ **Bolt** - Portal de frota
5. ⚠️ **ViaVerde** - Portal de cliente
6. ⚠️ **myprio** - Portal de despesas

### Fase 3: Integração e Testes (1 semana)
7. 🔄 Unified Sync Service
8. 📊 Dashboard com métricas
9. 🧪 Testes end-to-end

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Uber requer aprovação Enterprise | Alto | Contactar equipe Uber for Business |
| Bolt scraping quebra | Médio | Implementar retry + alertas |
| Rate limiting | Médio | Implementar cache + throttling |
| Credenciais inválidas | Alto | Validar antes de deploy |
| CAPTCHA em scrapers | Médio | Usar serviços de resolução |

---

## 📞 Próximos Passos

1. **Validar credenciais** de todas as plataformas
2. **Registrar app** no Uber Developer Dashboard
3. **Obter API keys** da FONOA
4. **Testar autenticação** em cada plataforma
5. **Implementar** integrações na ordem de prioridade
6. **Criar dashboard** com métricas unificadas

---

**Documentação criada por:** Manus AI  
**Data:** Janeiro 2025  
**Versão:** 1.0
