# Collections Firebase - Conduz.pt

## 📊 Collections Necessárias (MANTER)

### 1. `drivers`
**Descrição:** Dados dos motoristas
**Estrutura:**
```typescript
{
  uid: string,
  fullName: string,
  email: string,
  phone: string,
  status: 'active' | 'inactive',
  type: 'affiliate' | 'renter',
  integrations: {
    uber: { key: string, enabled: boolean },
    bolt: { key: string, enabled: boolean },
    myprio: { key: string, enabled: boolean },
    viaverde: { key: string, enabled: boolean }
  },
  banking: {
    iban: string,
    accountHolder: string
  },
  vehicle: {
    plate: string,
    make: string,
    model: string,
    year: number
  },
  rental?: {
    amount: number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. `requests` ou `driver_requests`
**Descrição:** Solicitações de novos motoristas
**Estrutura:**
```typescript
{
  fullName: string,
  email: string,
  phone: string,
  type: 'affiliate' | 'renter',
  status: 'pending' | 'evaluation' | 'approved' | 'rejected',
  notes?: string,
  rejectionReason?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. `raw_uber`
**Descrição:** Dados brutos importados do Uber
**Estrutura:**
```typescript
{
  importId: string,
  weekStart: string,
  weekEnd: string,
  driverUuid: string,
  totalEarnings: number,
  commission: number,
  tips: number,
  tolls: number,
  trips: number,
  hours: number,
  importedAt: Date,
  importedBy: string,
  sourceFile: string
}
```

### 4. `raw_bolt`
**Descrição:** Dados brutos importados do Bolt
**Estrutura:**
```typescript
{
  importId: string,
  weekStart: string,
  weekEnd: string,
  driverEmail: string,
  totalEarnings: number,
  commission: number,
  tips: number,
  trips: number,
  hours: number,
  importedAt: Date,
  importedBy: string,
  sourceFile: string
}
```

### 5. `raw_prio`
**Descrição:** Transações de abastecimento Prio
**Estrutura:**
```typescript
{
  importId: string,
  weekStart: string,
  weekEnd: string,
  cardNumber: string,
  transactionDate: Date,
  location: string,
  amount: number,
  liters: number,
  pricePerLiter: number,
  importedAt: Date,
  importedBy: string,
  sourceFile: string
}
```

### 6. `raw_viaverde`
**Descrição:** Transações de portagens Via Verde
**Estrutura:**
```typescript
{
  importId: string,
  weekStart: string,
  weekEnd: string,
  plate: string,
  transactionDate: Date,
  location: string,
  amount: number,
  importedAt: Date,
  importedBy: string,
  sourceFile: string
}
```

### 7. `users`
**Descrição:** Dados de autenticação e perfil de usuários (admin e motoristas)
**Estrutura:**
```typescript
{
  uid: string,
  email: string,
  displayName: string,
  role: 'admin' | 'driver',
  createdAt: Date,
  lastLogin: Date
}
```

---

## 🗑️ Collections para DELETAR (se existirem)

- `weekly_data` (dados processados - agora calculamos em tempo real)
- `payslips` (recibos antigos - agora geramos dinamicamente)
- `imports` (importações antigas - agora usamos raw_*)
- `transactions` (transações antigas - agora usamos raw_*)
- `earnings` (ganhos antigos - agora calculamos em tempo real)
- Qualquer outra collection que não esteja na lista de "MANTER"

---

## 🔄 Fluxo de Dados

1. **Importação:**
   - Admin faz upload dos 4 arquivos (Uber, Bolt, Prio, ViaVerde)
   - Sistema salva dados brutos nas 4 collections `raw_*`
   - Cada registro tem `importId`, `weekStart`, `weekEnd`

2. **Visualização:**
   - Admin acessa `/admin/weekly`
   - Seleciona semana
   - Sistema busca dados das 4 collections `raw_*` para aquela semana
   - Cruza dados usando `integrations` dos motoristas
   - Calcula valores EM TEMPO REAL

3. **Geração de Resumos:**
   - Admin clica em "Gerar Resumos"
   - Sistema gera Excel + PDFs dinamicamente
   - Não salva nada no Firebase (apenas gera arquivos)

---

## 🔐 Índices Necessários

### `raw_uber`
- `weekStart` + `weekEnd` + `driverUuid`
- `importId`

### `raw_bolt`
- `weekStart` + `weekEnd` + `driverEmail`
- `importId`

### `raw_prio`
- `weekStart` + `weekEnd` + `cardNumber`
- `importId`

### `raw_viaverde`
- `weekStart` + `weekEnd` + `plate`
- `importId`

### `drivers`
- `email`
- `status`
- `integrations.uber.key`
- `integrations.bolt.key`
- `integrations.myprio.key`
- `integrations.viaverde.key`

### `requests`
- `status`
- `email`
- `createdAt`

---

## 📝 Notas

- **NÃO salvar cálculos no Firebase** - Sempre calcular em tempo real
- **Manter dados brutos** - Permite recalcular se houver erro
- **Usar importId** - Permite rastrear origem dos dados
- **Índices são essenciais** - Para performance das queries

---

## 🚀 Próximos Passos

1. Deletar collections antigas no Firebase Console
2. Criar índices necessários
3. Testar importação com dados reais
4. Validar cálculos na tela weekly
5. Testar geração de resumos
