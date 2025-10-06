# 🚗 Integração Uber - Plano de Extensão

**Data:** 06 de Outubro de 2025  
**Status:** ⚠️ **PRECISA EXTENSÃO**  
**Tempo Estimado:** 1 hora

---

## ✅ O Que Já Está Funcionando

### **Integração Bolt - 100% OK**
- **Arquivo:** `lib/integrations/bolt/client.ts`
- ✅ Autenticação OAuth 2.0 funcionando
- ✅ Buscar viagens completas
- ✅ Buscar motoristas
- ✅ Calcular ganhos totais
- ✅ API testada e validada

**Conclusão:** Bolt NÃO precisa de alterações. Já está pronto!

---

## ⚠️ O Que Precisa Ser Feito na Uber

### **Status Atual:**
- **Arquivo:** `lib/integrations/uber/client.ts`
- ✅ Autenticação OAuth 2.0 funcionando
- ✅ Método `getTrips()` implementado
- ✅ Método `getEarnings()` implementado
- ❌ **PROBLEMA:** Não separa gorjetas e portagens

### **O Que Falta:**
Criar método para buscar dados semanais **separados**:
- **Viagens** (trips) - Ganhos de corridas (€)
- **Gorjetas** (tips) - Gorjetas dos passageiros (€)
- **Portagens** (tolls) - Reembolsos de portagens (€)

---

## 🎯 Solução: Adicionar Método getWeeklyData()

### **Arquivo a modificar:**
`lib/integrations/uber/client.ts`

### **Código a adicionar:**

```typescript
/**
 * Buscar dados semanais separados por tipo
 * @param driverId - ID do motorista Uber
 * @param weekStart - Data início (YYYY-MM-DD)
 * @param weekEnd - Data fim (YYYY-MM-DD)
 * @returns Objeto com trips, tips e tolls separados
 */
async getWeeklyData(
  driverId: string, 
  weekStart: string, 
  weekEnd: string
): Promise<{
  trips: number;      // Ganhos de viagens (€)
  tips: number;       // Gorjetas (€)
  tolls: number;      // Portagens/reembolsos (€)
}> {
  try {
    const orgUuid = this.credentials.orgUuid as string;
    
    // Converter datas para timestamp Unix (segundos)
    const startTime = Math.floor(new Date(weekStart).getTime() / 1000);
    const endTime = Math.floor(new Date(weekEnd).getTime() / 1000);
    
    // OPÇÃO 1: Usar endpoint de pagamentos (se disponível)
    try {
      const response = await this.makeRequest(
        'GET',
        `/organizations/${orgUuid}/driver-payments?driver_id=${driverId}&start_time=${startTime}&end_time=${endTime}`
      );
      
      // Estrutura esperada da resposta (adaptar conforme API real):
      return {
        trips: response.fare_breakdown?.base_fare || 0,
        tips: response.fare_breakdown?.tips || 0,
        tolls: response.fare_breakdown?.tolls || 0,
      };
    } catch (error) {
      console.warn('driver-payments endpoint not available, falling back to trips');
    }
    
    // OPÇÃO 2: Usar endpoint de viagens e agregar
    const response = await this.makeRequest(
      'GET',
      `/organizations/${orgUuid}/trips?driver_id=${driverId}&start_time=${startTime}&end_time=${endTime}`
    );
    
    const trips = response.trips || [];
    
    // Agregar valores de todos os trips
    const totals = trips.reduce((acc: any, trip: any) => {
      const fare = trip.fare_breakdown || trip.fare || {};
      
      return {
        trips: acc.trips + (fare.base_fare || fare.subtotal || 0),
        tips: acc.tips + (fare.tip || fare.tips || 0),
        tolls: acc.tolls + (fare.tolls || fare.toll_charges || 0),
      };
    }, { trips: 0, tips: 0, tolls: 0 });
    
    return totals;
    
  } catch (error) {
    console.error('Error fetching Uber weekly data:', error);
    return { trips: 0, tips: 0, tolls: 0 };
  }
}
```

---

## 📚 Documentação Uber API

### **Endpoints Relevantes:**

#### **1. Driver Payments (Recomendado)**
```
GET /v1/organizations/{orgUuid}/driver-payments
```
**Query Parameters:**
- `driver_id` - ID do motorista
- `start_time` - Timestamp início (Unix seconds)
- `end_time` - Timestamp fim (Unix seconds)

**Response esperado:**
```json
{
  "driver_id": "abc123",
  "period": {
    "start": "2024-09-01",
    "end": "2024-09-07"
  },
  "fare_breakdown": {
    "base_fare": 389.04,
    "tips": 13.55,
    "tolls": 17.70,
    "total": 420.29
  }
}
```

#### **2. Trips (Alternativa)**
```
GET /v1/organizations/{orgUuid}/trips
```
**Query Parameters:**
- `driver_id` - ID do motorista
- `start_time` - Timestamp início
- `end_time` - Timestamp fim

**Response:**
```json
{
  "trips": [
    {
      "trip_id": "abc123",
      "driver_id": "driver123",
      "fare_breakdown": {
        "base_fare": 15.50,
        "tip": 2.00,
        "toll_charges": 1.20
      }
    }
  ]
}
```

### **Documentação Oficial:**
- https://developer.uber.com/docs/business/api-reference
- https://developer.uber.com/docs/business/driver-earnings

---

## 🔧 Atualizar API de Sincronização

### **Arquivo:** `pages/api/admin/weekly-records/sync.ts`

### **Modificar a seção de busca de dados:**

```typescript
// ANTES (linha ~45):
const newRecord = calculateDriverWeeklyRecord({
  driverId: driver.id,
  driverName: driver.name || 'Unknown',
  weekStart,
  weekEnd,
  uberTrips: 0,  // ❌ Mockado
  uberTips: 0,   // ❌ Mockado
  uberTolls: 0,  // ❌ Mockado
  // ...
});

// DEPOIS:
// Buscar dados reais da Uber
const { UberClient } = await import('@/lib/integrations/uber/client');
const uberClient = new UberClient({
  clientId: process.env.UBER_CLIENT_ID || '',
  clientSecret: process.env.UBER_CLIENT_SECRET || '',
  orgUuid: process.env.UBER_ORG_UUID || '',
});

await uberClient.authenticate();
const uberData = await uberClient.getWeeklyData(driver.uberId, weekStart, weekEnd);

// Buscar dados da Bolt (já funciona)
const { BoltClient } = await import('@/lib/integrations/bolt/client');
const boltClient = new BoltClient({
  clientId: process.env.BOLT_CLIENT_ID || '',
  clientSecret: process.env.BOLT_SECRET || '',
});

await boltClient.authenticate();
const boltEarnings = await boltClient.getEarnings(weekStart, weekEnd);

const newRecord = calculateDriverWeeklyRecord({
  driverId: driver.id,
  driverName: driver.name || 'Unknown',
  weekStart,
  weekEnd,
  uberTrips: uberData.trips,    // ✅ Real
  uberTips: uberData.tips,      // ✅ Real
  uberTolls: uberData.tolls,    // ✅ Real
  boltTrips: boltEarnings.total, // ✅ Real (Bolt já inclui gorjetas)
  boltTips: 0,                   // Bolt não separa gorjetas
  fuel: 0, // TODO: integrar myprio
  // ...
});
```

---

## 🧪 Como Testar

### **1. Criar arquivo de teste:**
`tests/uber-integration.test.ts`

```typescript
import { UberClient } from '@/lib/integrations/uber/client';

async function testUberWeeklyData() {
  const client = new UberClient({
    clientId: process.env.UBER_CLIENT_ID || '',
    clientSecret: process.env.UBER_CLIENT_SECRET || '',
    orgUuid: process.env.UBER_ORG_UUID || '',
  });

  await client.authenticate();
  
  const weekStart = '2024-09-01';
  const weekEnd = '2024-09-07';
  const driverId = 'test-driver-id';
  
  const data = await client.getWeeklyData(driverId, weekStart, weekEnd);
  
  console.log('Uber Weekly Data:', data);
  console.log('Trips:', data.trips);
  console.log('Tips:', data.tips);
  console.log('Tolls:', data.tolls);
}

testUberWeeklyData();
```

### **2. Executar teste:**
```bash
npx ts-node tests/uber-integration.test.ts
```

### **3. Validar resposta:**
- ✅ `trips` > 0
- ✅ `tips` >= 0
- ✅ `tolls` >= 0
- ✅ Valores fazem sentido com dados reais

---

## 📋 Checklist de Implementação

### **Etapa 1: Pesquisa (15 min)**
- [ ] Acessar documentação Uber API
- [ ] Verificar endpoint `/driver-payments` disponível
- [ ] Verificar estrutura da resposta
- [ ] Confirmar campos: base_fare, tips, tolls

### **Etapa 2: Implementação (30 min)**
- [ ] Adicionar método `getWeeklyData()` em `lib/integrations/uber/client.ts`
- [ ] Implementar lógica de fallback (payments → trips)
- [ ] Tratar erros adequadamente
- [ ] Adicionar logs para debug

### **Etapa 3: Integração (10 min)**
- [ ] Atualizar `pages/api/admin/weekly-records/sync.ts`
- [ ] Substituir dados mockados por chamadas reais
- [ ] Adicionar tratamento de erros

### **Etapa 4: Testes (15 min)**
- [ ] Criar arquivo de teste
- [ ] Executar com dados reais
- [ ] Validar valores retornados
- [ ] Testar sincronização completa

### **Total:** ~60 minutos

---

## 🎯 Resultado Esperado

Após implementação, o sistema poderá:

1. ✅ Conectar à API Uber
2. ✅ Buscar dados semanais de motoristas
3. ✅ Separar viagens, gorjetas e portagens
4. ✅ Calcular comissão corretamente (sem portagens)
5. ✅ Gerar registros semanais automaticamente
6. ✅ Exibir na tela `/admin/weekly`
7. ✅ Exportar para Excel

---

## 📝 Notas Importantes

### **Variáveis de Ambiente Necessárias:**
```env
# .env.local
UBER_CLIENT_ID=your_client_id
UBER_CLIENT_SECRET=your_client_secret
UBER_ORG_UUID=your_organization_uuid

BOLT_CLIENT_ID=your_bolt_client_id
BOLT_SECRET=your_bolt_secret
```

### **Permissões OAuth Uber:**
Certifique-se que o app Uber tem os scopes:
- `business.trips` - Ler viagens
- `business.earnings` - Ler ganhos
- `business.payments` - Ler pagamentos (se disponível)

### **Rate Limits:**
- Uber API: ~1000 requests/hour
- Bolt API: ~500 requests/hour
- Implementar cache se necessário

---

## 🚀 Começar Agora

**Próximo passo:** Abrir `lib/integrations/uber/client.ts` e adicionar o método `getWeeklyData()`.

**Tempo estimado:** 1 hora

**Prioridade:** 🔥 Alta (necessário para controle semanal funcionar 100%)
