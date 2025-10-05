# Serviço Universal de Dados Admin

## 📋 Visão Geral

O serviço universal unifica **todos** os dados do sistema admin numa estrutura consistente e tipada, eliminando duplicação de código e facilitando manutenção.

## 🎯 Benefícios

- ✅ **Única fonte de verdade** para todos os dados
- ✅ **Tipagem TypeScript completa** em todas as estruturas
- ✅ **Cálculos automáticos** de métricas e estatísticas
- ✅ **Filtros flexíveis** via options
- ✅ **Performance otimizada** com queries paralelas
- ✅ **Tratamento de erros** robusto por collection
- ✅ **Fácil de testar e manter**

## 📦 O que está incluído

### Collections Unificadas

1. **Drivers** - Motoristas (ativos, inativos, afiliados, locatários)
2. **Vehicles** - Veículos (ativos, manutenção, inativos)
3. **Fleet Records** - Registros financeiros diários da frota
4. **Integrations** - Status das integrações externas
5. **Requests** - Solicitações de motoristas do site
6. **Weekly Records** - Métricas semanais de motoristas (opcional)

### Métricas Calculadas Automaticamente

#### Financial (Financeiro)
- `totalEarnings` - Receita total
- `totalExpenses` - Despesas totais
- `netProfit` - Lucro líquido
- `profitMargin` - Margem de lucro (%)
- `avgTripValue` - Valor médio por viagem

#### Operations (Operacional)
- `totalTrips` - Total de viagens
- `totalDistance` - Distância total percorrida
- `totalHours` - Horas trabalhadas
- `avgTripsPerDay` - Média de viagens por dia

#### Fleet (Frota)
- `totalVehicles` - Total de veículos
- `activeVehicles` - Veículos ativos
- `inactiveVehicles` - Veículos inativos
- `maintenanceVehicles` - Veículos em manutenção
- `utilizationRate` - Taxa de utilização (%)

#### Drivers (Motoristas)
- `totalDrivers` - Total de motoristas
- `activeDrivers` - Motoristas ativos
- `affiliates` - Afiliados ativos
- `renters` - Locatários ativos
- `avgRating` - Avaliação média

#### Integrations (Integrações)
- `total` - Total de integrações
- `connected` - Conectadas
- `disconnected` - Desconectadas
- `errors` - Com erro

#### Requests (Solicitações)
- `total` - Total de solicitações
- `pending` - Pendentes
- `approved` - Aprovadas
- `rejected` - Rejeitadas

## 🚀 Como Usar

### 1. No SSR (getServerSideProps)

#### Opção A: Dashboard (Recomendado)
```typescript
import { fetchDashboardData } from '@/lib/admin/unified-data';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);
  
  if ('redirect' in authResult || 'notFound' in authResult) {
    return authResult;
  }

  // Buscar dados dos últimos 30 dias
  const data = await fetchDashboardData(30);

  return {
    props: {
      ...authResult.props,
      data,
    },
  };
};
```

#### Opção B: Métricas de Motoristas
```typescript
import { fetchDriverMetricsData } from '@/lib/admin/unified-data';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);
  
  if ('redirect' in authResult || 'notFound' in authResult) {
    return authResult;
  }

  // Buscar dados de motoristas dos últimos 7 dias
  const data = await fetchDriverMetricsData(7);

  return {
    props: {
      ...authResult.props,
      drivers: data.drivers,
      summary: data.summary,
    },
  };
};
```

#### Opção C: Customizado
```typescript
import { fetchUnifiedAdminData } from '@/lib/admin/unified-data';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { checkAdminAuth } = await import('@/lib/auth/adminCheck');
  const authResult = await checkAdminAuth(context);
  
  if ('redirect' in authResult || 'notFound' in authResult) {
    return authResult;
  }

  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-12-31');

  const data = await fetchUnifiedAdminData({
    startDate,
    endDate,
    includeDrivers: true,
    includeVehicles: true,
    includeFleetRecords: true,
    includeIntegrations: false, // Não precisa de integrações
    includeRequests: false,      // Não precisa de solicitações
    includeWeeklyRecords: true,  // Incluir métricas semanais
    driverStatus: 'active',      // Apenas ativos
    vehicleStatus: 'all',        // Todos os veículos
  });

  return {
    props: {
      ...authResult.props,
      data,
    },
  };
};
```

### 2. Via API

#### GET /api/admin/data/unified

**Parâmetros de Query:**

- `preset` - Preset de dados (`dashboard` | `driver-metrics`)
- `days` - Número de dias para buscar (default: 30)
- `startDate` - Data inicial (ISO string)
- `endDate` - Data final (ISO string)
- `include` - Lista separada por vírgula (`drivers,vehicles,fleet,integrations,requests,weekly`)
- `driverStatus` - Status dos motoristas (`active` | `inactive` | `all`)
- `vehicleStatus` - Status dos veículos (`active` | `inactive` | `maintenance` | `all`)

**Exemplos:**

```typescript
// Preset dashboard (últimos 30 dias)
const response = await fetch('/api/admin/data/unified?preset=dashboard');
const { data } = await response.json();

// Preset driver-metrics (últimos 7 dias)
const response = await fetch('/api/admin/data/unified?preset=driver-metrics&days=7');
const { data } = await response.json();

// Customizado - apenas fleet records do último mês
const response = await fetch('/api/admin/data/unified?include=fleet&days=30');
const { data } = await response.json();

// Período específico com tudo
const response = await fetch('/api/admin/data/unified?startDate=2025-01-01&endDate=2025-12-31&include=drivers,vehicles,fleet,requests,weekly');
const { data } = await response.json();

// Todos os motoristas (ativos e inativos)
const response = await fetch('/api/admin/data/unified?include=drivers&driverStatus=all');
const { data } = await response.json();
```

## 📊 Estrutura de Retorno

```typescript
interface UnifiedAdminData {
  // Métricas agregadas (sempre retornado)
  summary: {
    financial: { ... },
    operations: { ... },
    fleet: { ... },
    drivers: { ... },
    integrations: { ... },
    requests: { ... },
  };
  
  // Arrays de dados (conforme incluído)
  drivers: UnifiedDriver[];
  vehicles: UnifiedVehicle[];
  fleetRecords: UnifiedFleetRecord[];
  integrations: UnifiedIntegration[];
  requests: UnifiedRequest[];
  weeklyRecords: UnifiedWeeklyRecord[];
  
  // Metadata
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  
  // Erros (se houver)
  errors: string[];
  
  // Timestamp da busca
  fetchedAt: string;
}
```

## 🎨 Exemplos de Uso no Componente

### Dashboard Stats Cards

```typescript
interface DashboardProps {
  data: UnifiedAdminData;
}

export default function Dashboard({ data }: DashboardProps) {
  const { summary } = data;
  
  return (
    <>
      <StatCard
        label="Receita Total"
        value={formatCurrency(summary.financial.totalEarnings)}
        change="+12.5%"
        icon={FiDollarSign}
      />
      
      <StatCard
        label="Lucro Líquido"
        value={formatCurrency(summary.financial.netProfit)}
        helpText={`Margem: ${summary.financial.profitMargin.toFixed(1)}%`}
        icon={FiTrendingUp}
      />
      
      <StatCard
        label="Viagens"
        value={summary.operations.totalTrips}
        helpText={`Média: ${summary.operations.avgTripsPerDay.toFixed(0)}/dia`}
        icon={FiActivity}
      />
      
      <StatCard
        label="Frota Ativa"
        value={summary.fleet.activeVehicles}
        helpText={`Taxa: ${summary.fleet.utilizationRate.toFixed(0)}%`}
        icon={FiTruck}
      />
    </>
  );
}
```

### Lista de Motoristas com Métricas

```typescript
interface DriversPageProps {
  data: UnifiedAdminData;
}

export default function DriversPage({ data }: DriversPageProps) {
  const { drivers } = data;
  
  return (
    <Table>
      <Thead>
        <Tr>
          <Th>Motorista</Th>
          <Th>Tipo</Th>
          <Th>Veículo</Th>
          <Th>Status</Th>
        </Tr>
      </Thead>
      <Tbody>
        {drivers.map(driver => (
          <Tr key={driver.id}>
            <Td>{driver.name}</Td>
            <Td>
              <Badge colorScheme={driver.type === 'affiliate' ? 'green' : 'blue'}>
                {driver.type}
              </Badge>
            </Td>
            <Td>{driver.vehicleName || '-'}</Td>
            <Td>
              <Badge colorScheme={driver.status === 'active' ? 'green' : 'gray'}>
                {driver.status}
              </Badge>
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
```

### Gráfico de Receita por Veículo

```typescript
export default function FleetChart({ data }: { data: UnifiedAdminData }) {
  // Agrupar fleet records por veículo
  const revenueByVehicle = data.fleetRecords.reduce((acc, record) => {
    if (!acc[record.vehicleId]) {
      acc[record.vehicleId] = {
        plate: record.vehiclePlate,
        earnings: 0,
      };
    }
    acc[record.vehicleId].earnings += record.totalEarnings;
    return acc;
  }, {} as Record<string, { plate: string; earnings: number }>);

  const chartData = Object.values(revenueByVehicle)
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 10); // Top 10

  return <BarChart data={chartData} />;
}
```

## ⚡ Performance

- **Queries paralelas** - Todas as collections são buscadas em paralelo
- **Cálculos otimizados** - Métricas calculadas uma única vez
- **Filtros server-side** - Reduz dados transferidos
- **Tipagem forte** - Zero overhead em runtime
- **Cache-friendly** - Estrutura consistente facilita caching

## 🔧 Manutenção

### Adicionar Nova Collection

1. Criar interface em `unified-data.ts`:
```typescript
export interface UnifiedNewCollection {
  id: string;
  // ... campos
}
```

2. Adicionar ao `UnifiedAdminData`:
```typescript
export interface UnifiedAdminData {
  // ... existing
  newCollection: UnifiedNewCollection[];
}
```

3. Adicionar opção em `FetchOptions`:
```typescript
export interface FetchOptions {
  // ... existing
  includeNewCollection?: boolean;
}
```

4. Implementar fetch em `fetchUnifiedAdminData`:
```typescript
if (includeNewCollection) {
  try {
    const snapshot = await adminDb.collection('newCollection').get();
    data.newCollection = snapshot.docs.map(doc => ({
      id: doc.id,
      // ... map fields
    }));
  } catch (error: any) {
    errors.push(`NewCollection: ${error.message}`);
  }
}
```

5. Adicionar métricas em `calculateSummaryStats` se necessário

## 📝 Notas Importantes

- ✅ **Sempre use SSR** - Performance melhor, dados frescos
- ✅ **Reutilize estruturas** - Evite criar novos tipos
- ✅ **Trate erros** - Array `errors` contém problemas não-críticos
- ✅ **Use presets** - `dashboard` e `driver-metrics` são otimizados
- ⚠️ **Cuidado com weekly records** - Pode ser grande, só incluir quando necessário
- ⚠️ **Período grandes** - Limitar a 90 dias para performance

## 🎯 Casos de Uso

| Página | Preset/Options | Motivo |
|--------|---------------|--------|
| Dashboard | `fetchDashboardData(30)` | Leve e rápido |
| Controle Semanal | `fetchDriverMetricsData(7)` | Incluí weekly records |
| Controle da Frota | Custom com `fleet` + `vehicles` + `drivers` | Precisa de relacionamentos |
| Solicitações | Custom com `requests` apenas | Não precisa de métricas |
| Integrações | Custom com `integrations` apenas | Isolado |
| Relatório Completo | `fetchFullReportData(start, end)` | Tudo incluído |

## 🚀 Próximos Passos

1. ✅ Migrar todas as páginas admin para usar o serviço
2. ✅ Criar testes unitários
3. ✅ Implementar caching (Redis/Memory)
4. ✅ Adicionar export para Excel/CSV
5. ✅ Criar dashboard de métricas em tempo real
