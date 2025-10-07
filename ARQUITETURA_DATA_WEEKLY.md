# 🏗️ Arquitetura: Data Management & Weekly Reports

## 🎯 Visão Geral

Separação clara de responsabilidades:
- **`/admin/data`** → Gerenciamento de dados (CRUD, importações)
- **`/admin/weekly`** → Visualização e relatórios (Read-only)

---

## 📊 `/admin/data` - Gerenciamento de Dados

### Responsabilidades
1. ✅ Listar todas as semanas com dados
2. ✅ Criar nova importação (Arquivo ou API)
3. ✅ Visualizar histórico de importações
4. ✅ Deletar importações (se necessário)
5. ✅ Re-importar dados
6. ✅ Ver status de sincronização

### Interface Proposta

```
┌─────────────────────────────────────────────────────────┐
│  Gerenciamento de Dados                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [+ Nova Importação]  [🔄 Sincronizar APIs]            │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Semanas com Dados                                │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 📅 29/09 - 05/10/2024                           │  │
│  │    Uber ✅  Bolt ✅  Prio ✅  ViaVerde ✅       │  │
│  │    2 motoristas • 15 registros                   │  │
│  │    [Ver] [Reimportar] [Deletar]                 │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 📅 22/09 - 28/09/2024                           │  │
│  │    Uber ✅  Bolt ❌  Prio ✅  ViaVerde ✅       │  │
│  │    1 motorista • 8 registros                     │  │
│  │    [Ver] [Reimportar] [Deletar]                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Histórico de Importações                         │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 07/10/2024 10:30 - Arquivo (Uber)              │  │
│  │ 07/10/2024 10:25 - API (Bolt)                  │  │
│  │ 06/10/2024 15:20 - Arquivo (Prio)              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Modal "Nova Importação"

```
┌─────────────────────────────────────────┐
│  Nova Importação                        │
├─────────────────────────────────────────┤
│                                          │
│  Período:                                │
│  [29/09/2024] até [05/10/2024]          │
│                                          │
│  Método de Importação:                   │
│  ( ) Arquivo  (•) API                    │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Uber                               │ │
│  │ [Escolher Arquivo] ou [Sync API]  │ │
│  │ ✅ uber_data.csv (uploaded)        │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Bolt                               │ │
│  │ [Escolher Arquivo] ou [Sync API]  │ │
│  │ ✅ bolt_data.csv (uploaded)        │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Prio                               │ │
│  │ [Escolher Arquivo] ou [Sync API]  │ │
│  │ ✅ prio_data.xlsx (uploaded)       │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ViaVerde                           │ │
│  │ [Escolher Arquivo] ou [Sync API]  │ │
│  │ ✅ viaverde_data.xlsx (uploaded)   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [Cancelar]  [Importar Dados]           │
└─────────────────────────────────────────┘
```

---

## 📈 `/admin/weekly` - Relatórios Semanais

### Responsabilidades
1. ✅ Listar APENAS semanas com dados
2. ✅ Visualizar dados processados
3. ✅ Gerar resumos (PDFs + Excel)
4. ✅ Exibir métricas e totais
5. ❌ NÃO importa dados (read-only)

### Interface Proposta

```
┌─────────────────────────────────────────────────────────┐
│  Controle Semanal                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Selecionar Semana:                                     │
│  [▼ 29/09 - 05/10/2024 (Semana Atual)]                 │
│      22/09 - 28/09/2024                                 │
│      15/09 - 21/09/2024                                 │
│                                                          │
│  [Gerar Resumos]  [Exportar Excel]                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Totais da Semana                                 │  │
│  │ Ganhos: €1.234,56 | Despesas: €456,78          │  │
│  │ Líquido: €777,78                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Motorista      | Uber  | Bolt  | Líquido        │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ Wedson         | €500  | €300  | €299,63        │  │
│  │ Yuri           | €340  | €0    | €382,92        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Estrutura de Dados no Firebase

### Collections Raw (Dados Importados)

#### `raw_uber`
```typescript
{
  importId: string,          // UUID da importação
  weekStart: string,         // "2024-09-29"
  weekEnd: string,           // "2024-10-05"
  driverUuid: string,        // UUID do motorista no Uber
  totalEarnings: number,
  commission: number,
  tips: number,
  tolls: number,
  trips: number,
  hours: number,
  importedAt: Timestamp,
  importedBy: string,        // UID do admin
  sourceType: 'file' | 'api',
  sourceFile?: string,       // Nome do arquivo (se file)
}
```

#### `raw_bolt`, `raw_prio`, `raw_viaverde`
Estrutura similar, adaptada para cada plataforma.

### Collection de Importações

#### `imports`
```typescript
{
  id: string,                // UUID da importação
  weekStart: string,
  weekEnd: string,
  sources: {
    uber: { 
      status: 'success' | 'error' | 'pending',
      recordsCount: number,
      sourceType: 'file' | 'api',
      fileName?: string,
      error?: string,
    },
    bolt: { ... },
    prio: { ... },
    viaverde: { ... },
  },
  importedAt: Timestamp,
  importedBy: string,
  status: 'complete' | 'partial' | 'failed',
}
```

---

## 🔄 Fluxo de Dados

### 1. Importação (em `/admin/data`)

```
Admin → Nova Importação
  ↓
Escolhe Período (weekStart, weekEnd)
  ↓
Escolhe Método (Arquivo ou API)
  ↓
Para cada fonte (Uber, Bolt, Prio, ViaVerde):
  ↓
  Se Arquivo:
    - Upload do arquivo
    - Parse do CSV/Excel
    - Validação dos dados
    - Salvar em raw_{source}
  ↓
  Se API:
    - Conectar à API
    - Buscar dados do período
    - Validação dos dados
    - Salvar em raw_{source}
  ↓
Criar registro em `imports`
  ↓
Sucesso → Redirecionar para /admin/weekly
```

### 2. Visualização (em `/admin/weekly`)

```
Admin → Acessa /admin/weekly
  ↓
Buscar semanas com dados:
  SELECT DISTINCT weekStart, weekEnd FROM imports
  WHERE status = 'complete' OR status = 'partial'
  ORDER BY weekStart DESC
  ↓
Admin seleciona semana
  ↓
Buscar dados raw das 4 fontes:
  - raw_uber WHERE weekStart = X AND weekEnd = Y
  - raw_bolt WHERE weekStart = X AND weekEnd = Y
  - raw_prio WHERE weekStart = X AND weekEnd = Y
  - raw_viaverde WHERE weekStart = X AND weekEnd = Y
  ↓
Cruzar dados por motorista (usando integrations)
  ↓
Calcular valores (IVA, despesas, líquido)
  ↓
Exibir tabela
  ↓
Admin clica "Gerar Resumos"
  ↓
Gerar PDFs + Excel
```

---

## 🎯 APIs Necessárias

### `/api/admin/data/weeks`
- **GET** - Listar todas as semanas com dados
- Retorna: `[{ weekStart, weekEnd, sources: {...}, recordsCount }]`

### `/api/admin/data/import`
- **POST** - Criar nova importação
- Body: `{ weekStart, weekEnd, sources: {...} }`
- Retorna: `{ importId, status }`

### `/api/admin/data/import/[importId]`
- **GET** - Ver detalhes de uma importação
- **DELETE** - Deletar importação (e dados raw)

### `/api/admin/weekly/weeks`
- **GET** - Listar semanas disponíveis (com dados)
- Retorna: `[{ weekStart, weekEnd, label }]`

### `/api/admin/weekly/data`
- **GET** - Buscar dados de uma semana
- Query: `?weekStart=X&weekEnd=Y`
- Retorna: Dados processados por motorista

### `/api/admin/weekly/generate-resumos`
- **POST** - Gerar resumos (PDFs + Excel)
- Body: `{ weekStart, weekEnd }`
- Retorna: ZIP file

---

## 📋 Checklist de Implementação

### Fase 1: Estrutura de Dados
- [ ] Criar collection `imports`
- [ ] Atualizar schemas de `raw_*` com importId
- [ ] Criar índices no Firestore

### Fase 2: `/admin/data`
- [ ] Página principal (listar semanas)
- [ ] Modal "Nova Importação"
- [ ] Upload de arquivos
- [ ] Integração com APIs
- [ ] Histórico de importações
- [ ] Deletar importações

### Fase 3: `/admin/weekly`
- [ ] Buscar semanas com dados (não mocadas)
- [ ] Dropdown dinâmico de semanas
- [ ] Buscar dados raw do período
- [ ] Cruzamento de dados
- [ ] Cálculos em tempo real
- [ ] Geração de resumos

### Fase 4: APIs
- [ ] Implementar todas as APIs listadas
- [ ] Validação de dados
- [ ] Tratamento de erros
- [ ] Logs de auditoria

---

## 🚀 Vantagens desta Arquitetura

1. **Separação de Responsabilidades**
   - Data = CRUD
   - Weekly = Read-only + Reports

2. **Dados Reais**
   - Weekly lista apenas semanas com dados
   - Não há dados mocados

3. **Rastreabilidade**
   - Histórico completo de importações
   - Sabe quem importou, quando, de onde

4. **Flexibilidade**
   - Suporta arquivo E API
   - Pode reimportar se houver erro
   - Pode deletar importações ruins

5. **Performance**
   - Dados raw separados por fonte
   - Cruzamento feito sob demanda
   - Cálculos em tempo real (não salvos)

---

## ✅ Próximo Passo

Quer que eu implemente esta arquitetura? Posso começar por:
1. Atualizar `/admin/data` com a nova interface
2. Criar APIs de importação
3. Atualizar `/admin/weekly` para usar dados reais

Confirma? 🚀
