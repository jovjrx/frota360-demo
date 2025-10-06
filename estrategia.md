# 🎯 Estratégia Completa de Gestão de Dados

---

## 📋 **ENTENDIMENTO DO FLUXO**

### **1. Cadastro de Motoristas (2 formas):**

```
FORMA 1: Solicitação (Self-service)
┌─────────────────────────────────────┐
│ Motorista preenche formulário      │
│ (nome, email, senha, telefone, etc)│
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Salvo em: requests                  │
│ Status: pending                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Admin aprova em /admin/requests     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Criado em: drivers                  │
│ Status: active                      │
│ (copia dados do request)            │
└─────────────────────────────────────┘

FORMA 2: Criação Direta pelo Admin
┌─────────────────────────────────────┐
│ Admin cria em /admin/drivers        │
│ (preenche todos os dados)           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Salvo direto em: drivers            │
│ Status: active                      │
└─────────────────────────────────────┘
```

### **2. Gestão de Motoristas:**

```
Tela: /admin/drivers (ou /admin/fleet)
┌─────────────────────────────────────┐
│ • Lista todos os motoristas         │
│ • Editar informações                │
│ • Adicionar IDs de plataformas      │
│ • Associar veículo                  │
│ • Associar cartão myprio            │
│ • Definir IBAN                      │
│ • Ativar/Desativar                  │
└─────────────────────────────────────┘
```

---

## 🗄️ **ESTRUTURA DE DADOS NO FIRESTORE**

### **Collection: `drivers`**

```typescript
{
  // Identificação Básica (do cadastro)
  id: string                    // ID único gerado pelo Firestore
  name: string                  // Nome completo
  email: string                 // Email (login)
  phone: string                 // Telefone
  
  // Autenticação (se usar Firebase Auth)
  firebaseUid?: string          // UID do Firebase Auth
  
  // IDs das Plataformas (preenchido pelo admin)
  integrations: {
    uber: {
      uuid: string | null       // UUID do Uber
      name: string | null       // Nome no Uber (pode ser diferente)
      lastSync: string | null   // Última sincronização
    },
    bolt: {
      id: string | null         // ID do Bolt
      email: string | null      // Email no Bolt
      lastSync: string | null
    }
  },
  
  // Veículo e Cartões (preenchido pelo admin)
  vehicle: {
    plate: string | null        // Matrícula do carro atual
    model: string | null        // Modelo do carro
    assignedDate: string | null // Data de atribuição
  },
  
  cards: {
    myprio: string | null       // Número do cartão myprio
    viaverde: string | null     // Se tiver cartão ViaVerde individual
  },
  
  // Dados Bancários (preenchido pelo admin)
  banking: {
    iban: string | null         // IBAN para transferências
    accountHolder: string | null // Titular da conta
  },
  
  // Status e Tipo
  status: 'active' | 'inactive' | 'suspended'
  type: 'affiliate' | 'renter'
  
  // Metadados
  createdAt: string             // Data de criação
  updatedAt: string             // Última atualização
  createdBy: 'request' | 'admin' // Como foi criado
  requestId?: string            // ID do request original (se veio de lá)
  
  // Notas
  notes?: string                // Observações do admin
}
```

---

## 🔄 **ESTRATÉGIA DE IMPORTAÇÃO DE DADOS**

### **PRINCÍPIO: Fonte Única de Verdade**

```
┌─────────────────────────────────────────────────────┐
│         DADOS BRUTOS (Raw Data)                     │
│  Collection: weeklyDataImports                      │
│  • Armazena dados originais das plataformas         │
│  • Nunca é modificado                               │
│  • Serve de auditoria                               │
└─────────────────────────────────────────────────────┘
              ↓ (processamento)
┌─────────────────────────────────────────────────────┐
│         DADOS PROCESSADOS (Processed Data)          │
│  Collection: driverWeeklyRecords                    │
│  • Dados normalizados e calculados                  │
│  • Associados aos motoristas                        │
│  • Prontos para uso                                 │
└─────────────────────────────────────────────────────┘
```

---

## 📊 **COLLECTIONS NO FIRESTORE**

### **1. `weeklyDataImports`** (Dados Brutos)

```typescript
{
  id: string                    // ID único
  importId: string              // ID da importação (agrupa plataformas)
  platform: 'uber' | 'bolt' | 'myprio' | 'viaverde'
  source: 'manual' | 'api'      // Como veio
  weekStart: string             // Semana (YYYY-MM-DD)
  weekEnd: string               // Semana (YYYY-MM-DD)
  
  // Dados brutos (JSON original)
  rawData: any                  // Dados como vieram da plataforma
  
  // Metadados
  importedAt: string            // Quando foi importado
  importedBy: string            // Quem importou (admin ID)
  fileName?: string             // Nome do arquivo (se manual)
  
  // Status
  processed: boolean            // Já foi processado?
  processedAt?: string          // Quando foi processado
  errors?: string[]             // Erros no processamento
}
```

**Exemplo (Uber manual):**
```json
{
  "id": "import_uber_001",
  "importId": "week_2024_09_29",
  "platform": "uber",
  "source": "manual",
  "weekStart": "2024-09-29",
  "weekEnd": "2024-10-05",
  "rawData": {
    "rows": [
      {
        "UUID do motorista": "cdb71862-2a87-4c68-afb3-04bbe06e733d",
        "Nome próprio do motorista": "WEDSON",
        "Pago a si:Os seus rendimentos:Tarifa:Tarifa": "894.31",
        // ... todos os campos do CSV
      }
    ]
  },
  "importedAt": "2024-10-06T15:30:00Z",
  "importedBy": "admin_123",
  "fileName": "20250929-20251006-payments_driver.csv",
  "processed": true,
  "processedAt": "2024-10-06T15:31:00Z"
}
```

### **2. `driverWeeklyRecords`** (Dados Processados)

```typescript
{
  id: string                    // ID único
  driverId: string              // ID do motorista (FK → drivers)
  driverName: string            // Nome (cache)
  weekStart: string             // YYYY-MM-DD
  weekEnd: string               // YYYY-MM-DD
  
  // Uber
  uber: {
    earnings: number            // Ganhos de viagens
    tips: number                // Gorjetas
    tolls: number               // Portagens
    importId: string            // Referência ao import
  } | null,
  
  // Bolt
  bolt: {
    earnings: number
    tips: number
    tolls: number
    importId: string
  } | null,
  
  // myprio
  fuel: {
    amount: number              // Valor total
    transactions: number        // Número de abastecimentos
    importId: string
  } | null,
  
  // ViaVerde
  viaverde: {
    amount: number              // Valor total
    transactions: number        // Número de portagens
    importId: string
  } | null,
  
  // Cálculos
  calculations: {
    grossTotal: number          // Total bruto
    commissionBase: number      // Base de comissão
    commissionRate: number      // Taxa (0.07)
    commissionAmount: number    // Valor da comissão
    netPayout: number           // Valor líquido
  },
  
  // Pagamento
  payment: {
    iban: string                // IBAN (copiado do driver)
    status: 'pending' | 'paid' | 'cancelled'
    paidAt?: string
    reference?: string
  },
  
  // Metadados
  createdAt: string
  updatedAt: string
  notes?: string
}
```

---

## 🔧 **ESTRATÉGIA DE PROCESSAMENTO**

### **FLUXO COMPLETO:**

```
┌─────────────────────────────────────────────────────┐
│  PASSO 1: IMPORTAR DADOS BRUTOS                     │
├─────────────────────────────────────────────────────┤
│  Manual:                                            │
│  • Admin faz upload de arquivos CSV/Excel          │
│  • Sistema salva em weeklyDataImports              │
│  • Status: processed = false                        │
│                                                     │
│  Automático (futuro):                               │
│  • Cron job chama APIs                              │
│  • Sistema salva em weeklyDataImports              │
│  • Status: processed = false                        │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│  PASSO 2: PROCESSAR DADOS                           │
├─────────────────────────────────────────────────────┤
│  Para cada registro em weeklyDataImports:           │
│                                                     │
│  1. Identificar motorista:                          │
│     • Uber UUID → buscar em drivers.integrations   │
│     • Bolt ID → buscar em drivers.integrations     │
│     • Cartão myprio → buscar em drivers.cards      │
│     • Matrícula → buscar em drivers.vehicle        │
│                                                     │
│  2. Se motorista NÃO encontrado:                    │
│     • Marcar como erro                              │
│     • Adicionar em errors[]                         │
│     • Notificar admin                               │
│     • PULAR este registro                           │
│                                                     │
│  3. Se motorista encontrado:                        │
│     • Extrair valores da plataforma                 │
│     • Buscar/criar driverWeeklyRecord              │
│     • Atualizar campos da plataforma                │
│     • Recalcular totais                             │
│     • Salvar                                        │
│                                                     │
│  4. Marcar import como processado                   │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│  PASSO 3: CONSOLIDAR POR MOTORISTA/SEMANA          │
├─────────────────────────────────────────────────────┤
│  Chave única: driverId + weekStart                  │
│                                                     │
│  Se já existe registro:                             │
│  • ATUALIZAR campos da plataforma específica        │
│  • RECALCULAR totais                                │
│  • NÃO duplicar                                     │
│                                                     │
│  Se não existe:                                     │
│  • CRIAR novo registro                              │
│  • Preencher campos disponíveis                     │
│  • Calcular totais                                  │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│  PASSO 4: GERAR CONTRACHEQUES                       │
├─────────────────────────────────────────────────────┤
│  • Buscar todos os driverWeeklyRecords da semana   │
│  • Gerar PDF para cada motorista                    │
│  • Disponibilizar para download                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 **ESTRATÉGIA ANTI-DUPLICAÇÃO**

### **Regra de Ouro:**

```typescript
// Chave única composta
const uniqueKey = `${driverId}_${weekStart}_${platform}`;

// Exemplo:
"driver_wedson_2024-09-29_uber"
"driver_wedson_2024-09-29_bolt"
```

### **Lógica de Merge:**

```typescript
async function processImport(importData) {
  // 1. Identificar motorista
  const driver = await findDriver(importData);
  
  if (!driver) {
    // Erro: motorista não encontrado
    return { error: 'Driver not found' };
  }
  
  // 2. Buscar ou criar weekly record
  const recordId = `${driver.id}_${importData.weekStart}`;
  let record = await getWeeklyRecord(recordId);
  
  if (!record) {
    // Criar novo
    record = createEmptyWeeklyRecord(driver, importData.weekStart);
  }
  
  // 3. Atualizar apenas a plataforma específica
  switch (importData.platform) {
    case 'uber':
      record.uber = extractUberData(importData.rawData);
      record.uber.importId = importData.id;
      break;
    case 'bolt':
      record.bolt = extractBoltData(importData.rawData);
      record.bolt.importId = importData.id;
      break;
    case 'myprio':
      record.fuel = extractMyprioData(importData.rawData);
      record.fuel.importId = importData.id;
      break;
    case 'viaverde':
      record.viaverde = extractViaverdeData(importData.rawData);
      record.viaverde.importId = importData.id;
      break;
  }
  
  // 4. Recalcular totais
  record.calculations = calculateTotals(record);
  
  // 5. Salvar
  await saveWeeklyRecord(record);
  
  return { success: true, recordId };
}
```

### **Resultado:**

```json
{
  "id": "driver_wedson_2024-09-29",
  "driverId": "driver_wedson",
  "weekStart": "2024-09-29",
  "weekEnd": "2024-10-05",
  
  "uber": {
    "earnings": 894.31,
    "tips": 22.85,
    "tolls": 14.46,
    "importId": "import_uber_001"
  },
  
  "bolt": {
    "earnings": 37.66,
    "tips": 0.00,
    "tolls": 1.10,
    "importId": "import_bolt_001"
  },
  
  "fuel": {
    "amount": 49.73,
    "transactions": 1,
    "importId": "import_myprio_001"
  },
  
  "viaverde": {
    "amount": 57.30,
    "transactions": 20,
    "importId": "import_viaverde_001"
  },
  
  "calculations": {
    "grossTotal": 969.28,
    "commissionBase": 917.51,
    "commissionRate": 0.07,
    "commissionAmount": 64.23,
    "netPayout": 855.32
  }
}
```

---

## 🖥️ **TELAS NO PAINEL ADMIN**

### **1. `/admin/drivers` (Gestão de Motoristas)**

```
┌─────────────────────────────────────────────────────┐
│  MOTORISTAS                                         │
├─────────────────────────────────────────────────────┤
│  [+ Novo Motorista]  [Importar]  [Exportar]        │
│                                                     │
│  Filtros: [Status ▼] [Tipo ▼] [Buscar...]         │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Nome          │ Email      │ Status │ Ações  │ │
│  ├───────────────────────────────────────────────┤ │
│  │ Wedson        │ wedson@... │ Ativo  │ [Edit] │ │
│  │ Yuri          │ yuri@...   │ Ativo  │ [Edit] │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Modal de Edição:**
```
┌─────────────────────────────────────────────────────┐
│  EDITAR MOTORISTA: Wedson                           │
├─────────────────────────────────────────────────────┤
│  Dados Básicos:                                     │
│  Nome: [Wedson de Souza Guarino]                   │
│  Email: [wedsoniris@gmail.com]                     │
│  Telefone: [+351917822826]                         │
│                                                     │
│  Integrações:                                       │
│  Uber UUID: [cdb71862-2a87-4c68...]               │
│  Uber Nome: [WEDSON DE SOUZA GUARINO]             │
│  Bolt ID: [7e9fdb57-289c-46d3...]                 │
│  Bolt Email: [Wedsoniris@gmail.com]               │
│                                                     │
│  Veículo:                                           │
│  Matrícula: [GP798SH]                              │
│  Modelo: [Renault Clio]                            │
│                                                     │
│  Cartões:                                           │
│  myprio: [7824736068450001]                        │
│                                                     │
│  Dados Bancários:                                   │
│  IBAN: [PT50...]                                    │
│                                                     │
│  [Cancelar]  [Salvar]                              │
└─────────────────────────────────────────────────────┘
```

### **2. `/admin/weekly/import` (Importação de Dados)**

```
┌─────────────────────────────────────────────────────┐
│  IMPORTAR DADOS SEMANAIS                            │
├─────────────────────────────────────────────────────┤
│  Semana: [29/09/2024 ▼] até [05/10/2024 ▼]        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ UBER                                        │   │
│  │ [Selecionar arquivo CSV]                    │   │
│  │ ✅ uber_payments.csv (2 motoristas)         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ BOLT                                        │   │
│  │ [Selecionar arquivo CSV]                    │   │
│  │ ✅ bolt_earnings.csv (2 motoristas)         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ MYPRIO                                      │   │
│  │ [Selecionar arquivo Excel]                  │   │
│  │ ✅ myprio_transactions.xlsx (5 transações)  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ VIAVERDE                                    │   │
│  │ [Selecionar arquivo Excel]                  │   │
│  │ ✅ viaverde_movimento.xlsx (39 portagens)   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Cancelar]  [Processar Importação]                │
└─────────────────────────────────────────────────────┘
```

**Após Processar:**
```
┌─────────────────────────────────────────────────────┐
│  RESULTADO DA IMPORTAÇÃO                            │
├─────────────────────────────────────────────────────┤
│  ✅ Uber: 2 motoristas processados                  │
│  ✅ Bolt: 2 motoristas processados                  │
│  ✅ myprio: 2 motoristas processados                │
│  ✅ ViaVerde: 2 motoristas processados              │
│                                                     │
│  ⚠️ Avisos:                                         │
│  • myprio: 1 transação sem matrícula (ignorada)    │
│                                                     │
│  [Ver Detalhes]  [Ir para Controle Semanal]        │
└─────────────────────────────────────────────────────┘
```

### **3. `/admin/weekly` (Controle Semanal)**

```
┌─────────────────────────────────────────────────────┐
│  CONTROLE SEMANAL                                   │
├─────────────────────────────────────────────────────┤
│  Semana: [29/09 - 05/10 ▼]  [Importar Dados]      │
│                                                     │
│  Resumo: Total Bruto: 1554.98€ | Líquido: 1328.74€│
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ Motorista │ Uber │ Bolt │ Comb. │ Líq. │ Ações││
│  ├───────────────────────────────────────────────┤ │
│  │ Wedson    │931.62│37.66 │49.73  │855.32│[PDF]││
│  │ Yuri      │411.17│174.03│75.23  │473.42│[PDF]││
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  [Exportar Excel]  [Gerar Todos os PDFs]           │
└─────────────────────────────────────────────────────┘
```

---

## ✅ **VANTAGENS DESTA ESTRATÉGIA**

### **1. Separação de Responsabilidades**
- ✅ Dados brutos separados dos processados
- ✅ Auditoria completa (sempre pode reprocessar)
- ✅ Rastreabilidade (sabe de onde veio cada dado)

### **2. Flexibilidade**
- ✅ Funciona com importação manual
- ✅ Funciona com APIs automáticas
- ✅ Mesma lógica para ambos

### **3. Anti-Duplicação**
- ✅ Chave única por motorista/semana
- ✅ Merge inteligente de dados
- ✅ Cada plataforma atualiza apenas seu campo

### **4. Escalabilidade**
- ✅ Fácil adicionar novas plataformas
- ✅ Fácil adicionar novos campos
- ✅ Fácil reprocessar dados antigos

### **5. Manutenibilidade**
- ✅ Código organizado e modular
- ✅ Fácil debugar problemas
- ✅ Fácil entender o fluxo

---

## 🎯 **RESUMO DA ESTRATÉGIA**

```
1. CADASTRO
   • Requests (self-service) → aprovação → drivers
   • Criação direta pelo admin → drivers

2. GESTÃO
   • Tela /admin/drivers
   • Adicionar IDs de plataformas
   • Associar veículo e cartões

3. IMPORTAÇÃO
   • Upload de arquivos → weeklyDataImports (raw)
   • Processamento → driverWeeklyRecords (processed)
   • Anti-duplicação: driverId + weekStart

4. CONTROLE SEMANAL
   • Visualizar driverWeeklyRecords
   • Gerar contracheques PDF
   • Marcar como pago

5. FUTURO (APIs)
   • Mesma lógica de processamento
   • Apenas muda a fonte (API em vez de arquivo)
```

---

## ❓ **ESTÁ ALINHADO COM SUA VISÃO?**

**Pontos para confirmar:**

1. ✅ Requests → aprovação → drivers (OK?)
2. ✅ Admin pode criar drivers diretamente (OK?)
3. ✅ Tela de gestão de motoristas com IDs de plataformas (OK?)
4. ✅ Importação manual via upload (OK?)
5. ✅ Dados brutos separados dos processados (OK?)
6. ✅ Anti-duplicação por chave única (OK?)
7. ✅ Mesma lógica para manual e automático (OK?)

**Quer ajustar algo antes de eu começar a desenvolver?** 🎯
