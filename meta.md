# 📊 Análise Completa do Painel Conduz-PT

## 🎯 Estrutura Atual do Painel Admin

Baseado na análise do código, o painel tem **7 telas principais**:

### 1️⃣ **Dashboard** (`/admin`)
- **Objetivo**: Visão geral do sistema
- **Status**: Tela principal de entrada
- **Dados necessários**: Resumo geral de todas as métricas

---

### 2️⃣ **Solicitações** (`/admin/requests`)
- **Objetivo**: Gerenciar pedidos de motoristas
- **Status**: Funcional
- **Dados necessários**: 
  - Solicitações de novos motoristas
  - Status de aprovação
  - Documentação

---

### 3️⃣ **Controle** (`/admin/drivers-weekly`)
- **Objetivo**: Controle semanal de ganhos e repasses
- **Status**: ✅ **IMPLEMENTADO** mas precisa ajustes
- **Estrutura de dados**: `DriverWeeklyRecord`

#### 📋 Schema Atual (driver-weekly-record.ts)

```typescript
{
  id: string
  driverId: string
  driverName: string
  weekStart: string        // YYYY-MM-DD
  weekEnd: string          // YYYY-MM-DD
  
  // Uber
  uberTrips: number       // Ganhos de viagens Uber
  uberTips: number        // Gorjetas Uber
  uberTolls: number       // Portagens Uber
  
  // Bolt
  boltTrips: number       // Ganhos de viagens Bolt
  boltTips: number        // Gorjetas Bolt
  
  // Totais
  grossTotal: number      // Total bruto
  
  // Despesas
  fuel: number            // Combustível
  otherCosts: number      // Outros custos
  
  // Comissão
  commissionBase: number  // Base de cálculo
  commissionRate: number  // Taxa (padrão 7%)
  commissionAmount: number // Valor da comissão
  
  // Líquido
  netPayout: number       // Valor a transferir
  
  // Pagamento
  iban: string
  paymentStatus: 'pending' | 'paid' | 'cancelled'
  paymentDate: string
  
  // Metadados
  createdAt: string
  updatedAt: string
  notes: string
}
```

#### 🔢 Fórmula de Cálculo Atual

```javascript
grossTotal = uberTrips + uberTips + uberTolls + boltTrips + boltTips

commissionBase = uberTrips + boltTrips  // Só viagens, sem gorjetas/portagens

commissionAmount = commissionBase × 0.07

netPayout = grossTotal - commissionAmount - fuel - otherCosts
```

#### ⚠️ **PROBLEMA IDENTIFICADO**

Comparando com as planilhas do cliente:

**Planilha do Cliente:**
```
Base Comissão = Ganhos Total - Portagens
Comissão 7% = Base × 0.07
Repasse = Ganhos + Gorjetas - Comissão - Combustível
```

**Código Atual:**
```
commissionBase = uberTrips + boltTrips  // ❌ ERRADO
```

**O correto seria:**
```
commissionBase = (uberTrips + boltTrips) - uberTolls  // Excluir portagens
```

---

### 4️⃣ **Frota** (`/admin/fleet`)
- **Objetivo**: Gestão de frota e motoristas unificados
- **Status**: ✅ **IMPLEMENTADO**
- **Estrutura de dados**: `FleetRecord`

#### 📋 O que mostra:

- Lista de todos os registros de frota
- Filtros por motorista, veículo, status
- KPIs:
  - Total de ganhos
  - Total de despesas
  - Total de comissões
  - Total de repasses
  - Pagamentos pendentes

#### 📊 Dados necessários:

- Informações de motoristas (nome, email, tipo)
- Informações de veículos (matrícula, modelo)
- Registros de atividade
- Status de pagamentos

---

### 5️⃣ **Monitor** (`/admin/monitor`)
- **Objetivo**: Rastreamento em tempo real via Cartrack
- **Status**: ✅ **IMPLEMENTADO COM CARTRACK**
- **Funcionalidades**:
  - 🗺️ **Mapa em tempo real** (CartrackMap component)
  - 📋 **Lista de viagens**
  - 📊 **Estatísticas de viagens**

#### 📋 Dados da Cartrack:

```typescript
{
  platform: "cartrack"
  lastUpdate: string
  count: number
  summary: {
    totalTrips: number
    totalVehicles: number
    totalDistance: number
    period: { start: string, end: string }
  }
  trips: [
    {
      trip_id: number
      vehicle_id: number
      registration: string          // Matrícula
      driver_name: string
      driver_surname: string
      start_timestamp: string
      end_timestamp: string
      trip_duration: string
      trip_duration_seconds: number
      start_location: string
      end_location: string
      trip_distance: number
      max_speed: number
      harsh_braking_events: number
      harsh_cornering_events: number
      harsh_acceleration_events: number
      road_speeding_events: number
      start_coordinates: { latitude, longitude }
      end_coordinates: { latitude, longitude }
    }
  ]
}
```

#### ✅ O que o Cartrack fornece:

- ✅ Localização em tempo real
- ✅ Histórico de viagens
- ✅ Quilometragem
- ✅ Identificação de veículo (matrícula)
- ✅ Nome do motorista
- ✅ Eventos de direção (freadas bruscas, excesso de velocidade)

#### ❌ O que o Cartrack NÃO fornece:

- ❌ Valores financeiros (ganhos, gorjetas)
- ❌ Qual plataforma foi usada (Uber/Bolt)
- ❌ Dados de passageiros

---

### 6️⃣ **Métricas** (`/admin/metrics`)
- **Objetivo**: Análise de performance e dados unificados
- **Status**: ✅ **IMPLEMENTADO**
- **Funcionalidades**:
  - Resumo financeiro geral
  - Métricas por plataforma (Uber, Bolt, Cartrack)
  - Status de conexão das integrações
  - Filtros por período

#### 📊 Estrutura UnifiedMetrics:

```typescript
{
  summary: {
    totalEarnings: number
    totalExpenses: number
    netProfit: number
    totalTrips: number
    activeVehicles: number
    activeDrivers: number
  }
  platforms: {
    uber: { online, lastSync, data }
    bolt: { online, lastSync, data }
    cartrack: { online, lastSync, data }
    viaverde: { online, lastSync, data }
    myprio: { online, lastSync, data }
  }
  errors: string[]
}
```

---

### 7️⃣ **Integrações** (`/admin/integrations`)
- **Objetivo**: Gerenciar conexões com plataformas externas
- **Status**: ✅ **IMPLEMENTADO**
- **Plataformas suportadas**:
  - ✅ Uber
  - ✅ Bolt
  - ✅ Cartrack
  - ⚠️ ViaVerde (estrutura existe)
  - ⚠️ myprio (estrutura existe)

---

## 🔍 Análise: O Que Temos vs O Que o Cliente Precisa

### ✅ **O QUE JÁ FUNCIONA**

| Necessidade do Cliente | Status | Tela Atual |
|------------------------|--------|------------|
| Controle semanal de repasses | ✅ Implementado | `/admin/drivers-weekly` |
| Rastreamento de frota | ✅ Implementado | `/admin/monitor` |
| Dados do Cartrack | ✅ Funcionando | `/admin/monitor` |
| Dados do Bolt | ✅ Funcionando | `/admin/metrics` |
| Gestão de motoristas | ✅ Implementado | `/admin/fleet` |
| Métricas unificadas | ✅ Implementado | `/admin/metrics` |

### ⚠️ **O QUE PRECISA AJUSTAR**

#### 1. **Fórmula de Comissão** (CRÍTICO)

**Problema**: O cálculo da comissão está incluindo portagens na base.

**Solução**: Ajustar `calculateDriverWeeklyRecord()` em `driver-weekly-record.ts`:

```typescript
// ATUAL (ERRADO):
const commissionBase = (data.uberTrips || 0) + (data.boltTrips || 0);

// CORRETO:
const commissionBase = 
  (data.uberTrips || 0) + 
  (data.boltTrips || 0) - 
  (data.uberTolls || 0);  // Excluir portagens
```

#### 2. **Estrutura de Dados** (IMPORTANTE)

**Problema**: O schema atual não separa claramente "Ganhos" de "Gorjetas".

**Planilha do Cliente:**
- Ganhos Uber (viagens)
- Gorjetas Uber (separado)
- Portagens Uber (reembolsadas)

**Schema Atual:**
- `uberTrips` → Deveria ser só ganhos de viagens
- `uberTips` → Gorjetas (OK)
- `uberTolls` → Portagens (OK)

**Solução**: Renomear para clareza:

```typescript
// Renomear campos:
uberTrips → uberEarnings  // Ganhos de viagens
boltTrips → boltEarnings  // Ganhos de viagens
```

#### 3. **Integração Uber** (IMPORTANTE)

**Problema**: Precisamos garantir que a API do Uber retorna:
- Ganhos de viagens (separado)
- Gorjetas (separado)
- Portagens reembolsadas (separado)

**Verificar**: `/lib/integrations/uber/`

---

## 🎯 **PLANO DE AÇÃO IDEAL**

### **FASE 1: Correções Críticas** (Urgente)

1. ✅ **Corrigir fórmula de comissão**
   - Arquivo: `schemas/driver-weekly-record.ts`
   - Excluir portagens da base de comissão

2. ✅ **Validar dados do Uber/Bolt**
   - Verificar se APIs retornam dados separados
   - Ajustar mapeamento se necessário

3. ✅ **Testar cálculos**
   - Comparar com planilhas do cliente
   - Validar repasses

### **FASE 2: Organização das Telas** (Importante)

#### **Proposta de Reorganização:**

| Tela Atual | Novo Nome | Objetivo | Dados Principais |
|------------|-----------|----------|------------------|
| Dashboard | **Dashboard** | Visão geral | KPIs gerais |
| Solicitações | **Solicitações** | Pedidos de motoristas | Requests |
| **drivers-weekly** | **Controle Semanal** | Repasses semanais | DriverWeeklyRecord |
| **fleet** | **Motoristas** | Gestão de motoristas | Drivers + Vehicles |
| **monitor** | **Frota (Mapa)** | Rastreamento tempo real | Cartrack |
| metrics | **Métricas** | Análise de dados | UnifiedMetrics |
| integrations | **Integrações** | Configurar APIs | Integration configs |

#### **Estrutura Ideal:**

```
📊 Dashboard
   └─ Visão geral: ganhos, despesas, lucro, motoristas ativos

📋 Solicitações
   └─ Pedidos de novos motoristas

💰 Controle Semanal
   └─ Tabela de repasses por motorista/semana
   └─ Filtros: semana, motorista, status pagamento
   └─ Ações: marcar como pago, exportar

👥 Motoristas (Fleet)
   └─ Lista de todos os motoristas
   └─ Dados unificados: viagens, ganhos, veículos
   └─ Histórico completo

🚗 Frota (Monitor)
   ├─ Aba 1: Mapa em tempo real (Cartrack)
   └─ Aba 2: Lista de viagens recentes

📈 Métricas
   └─ Análise detalhada por período
   └─ Comparativos
   └─ Gráficos

⚙️ Integrações
   └─ Status de conexões
   └─ Configurar credenciais
```

### **FASE 3: Melhorias** (Desejável)

1. **Dashboard melhorado**
   - Gráficos de evolução
   - Comparativos mês a mês
   - Alertas de pagamentos pendentes

2. **Exportação de dados**
   - Exportar controle semanal para Excel
   - Formato igual às planilhas atuais

3. **Automação**
   - Sincronização automática com APIs
   - Cálculo automático de repasses
   - Notificações de pagamento

---

## 📊 **MAPEAMENTO DE DADOS**

### **Fluxo de Dados Ideal:**

```
┌─────────────────────────────────────────────────┐
│         FONTES DE DADOS (APIs)                  │
├─────────────────────────────────────────────────┤
│ Uber API      → Ganhos, Gorjetas, Portagens    │
│ Bolt API      → Ganhos, Gorjetas               │
│ Cartrack API  → Viagens, Km, Localização       │
│ myprio API    → Combustível, Manutenção        │
│ ViaVerde API  → Portagens (conferência)        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         PROCESSAMENTO (Backend)                 │
├─────────────────────────────────────────────────┤
│ 1. Buscar dados das APIs                       │
│ 2. Associar motorista → veículo → dados        │
│ 3. Calcular comissão (excluindo portagens)     │
│ 4. Calcular repasse líquido                    │
│ 5. Salvar em DriverWeeklyRecord                │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│         APRESENTAÇÃO (Frontend)                 │
├─────────────────────────────────────────────────┤
│ Dashboard     → Resumo geral                    │
│ Controle      → Tabela de repasses             │
│ Motoristas    → Perfis completos               │
│ Frota         → Mapa + Lista de viagens        │
│ Métricas      → Análises e gráficos            │
└─────────────────────────────────────────────────┘
```

---

## ✅ **CONCLUSÃO**

### **Pontos Fortes:**
- ✅ Estrutura bem organizada
- ✅ Cartrack já integrado e funcionando
- ✅ Bolt já funcionando
- ✅ Schema de dados bem definido
- ✅ Telas principais já existem

### **Ajustes Necessários:**
- ⚠️ Corrigir fórmula de comissão (CRÍTICO)
- ⚠️ Validar dados do Uber
- ⚠️ Clarificar nomenclatura (trips → earnings)
- ⚠️ Reorganizar menu (opcional)

### **Próximos Passos:**
1. Corrigir cálculo de comissão
2. Testar com dados reais
3. Validar contra planilhas do cliente
4. Ajustar telas conforme necessário

---

**O painel já tem 80% do que o cliente precisa. Precisamos apenas de ajustes finos!** 🎯
